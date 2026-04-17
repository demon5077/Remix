/**
 * lib/session.js
 * Single source of truth for ALL auth session state.
 * Persists across page navigations via localStorage.
 * Used by AppShell, playlists page, login page — everywhere.
 */

const ARISE_SESSION  = "arise:session:v2";
const GOOGLE_TOKENS  = "arise:google:tokens";
const GOOGLE_PROFILE = "arise:google:profile";
const SPOTIFY_TOKENS = "arise:spotify:tokens";
const SPOTIFY_PROFILE= "arise:spotify:profile";
const IMPORTED_PLS   = "arise:imported-playlists";

// ── Helpers ───────────────────────────────────────────────────────────────────
function ls(key, fallback = null) {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function lsDel(key) {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(key); } catch {}
}

// ── Email/phone session ───────────────────────────────────────────────────────
export function getSession()    { return ls(ARISE_SESSION); }
export function saveSession(u)  { lsSet(ARISE_SESSION, { ...u, savedAt: Date.now() }); }
export function clearSession()  { lsDel(ARISE_SESSION); }
export function updateSessionField(field, value) {
  const s = getSession(); if (!s) return;
  saveSession({ ...s, [field]: value });
}

// ── Google OAuth ──────────────────────────────────────────────────────────────
export function getGoogleProfile()       { return ls(GOOGLE_PROFILE); }
export function saveGoogleProfile(p)     { lsSet(GOOGLE_PROFILE, p); }
export function getGoogleTokens()        { return ls(GOOGLE_TOKENS); }
export function saveGoogleTokens(t)      { lsSet(GOOGLE_TOKENS, t); }
export function clearGoogle()            { lsDel(GOOGLE_TOKENS); lsDel(GOOGLE_PROFILE); lsDel("arise:google:user"); lsDel("arise:google:token"); }
export function isGoogleConnected()      { return !!getGoogleTokens()?.access_token; }

// ── Spotify OAuth ─────────────────────────────────────────────────────────────
export function getSpotifyProfile()      { return ls(SPOTIFY_PROFILE); }
export function saveSpotifyProfile(p)    { lsSet(SPOTIFY_PROFILE, p); }
export function getSpotifyTokens()       { return ls(SPOTIFY_TOKENS); }
export function saveSpotifyTokens(t)     { lsSet(SPOTIFY_TOKENS, t); }
export function clearSpotify()           { lsDel(SPOTIFY_TOKENS); lsDel(SPOTIFY_PROFILE); lsDel("arise:spotify:tokens"); lsDel("arise:spotify:profile"); }
export function isSpotifyConnected()     { return !!getSpotifyTokens()?.access_token; }

// ── Unified "is any user present" ────────────────────────────────────────────
export function getAnyUser() {
  const session = getSession();
  const google  = getGoogleProfile();
  const spotify = getSpotifyProfile();
  if (session)  return { type: "email",   name: session.name,   avatar: session.avatar || null, email: session.identifier };
  if (google)   return { type: "google",  name: google.name,    avatar: google.picture  || null, email: google.email };
  if (spotify)  return { type: "spotify", name: spotify.display_name, avatar: spotify.images?.[0]?.url || null, email: spotify.email };
  return null;
}

// ── Imported playlists (local) ────────────────────────────────────────────────
export function getImportedPlaylists() { return ls(IMPORTED_PLS, []); }
export function saveImportedPlaylists(pls) { lsSet(IMPORTED_PLS, pls); }
export function addImportedPlaylist(pl) {
  const existing = getImportedPlaylists();
  const deduped  = existing.filter(p => p.id !== pl.id);
  saveImportedPlaylists([pl, ...deduped]);
}
export function removeImportedPlaylist(id) {
  saveImportedPlaylists(getImportedPlaylists().filter(p => p.id !== id));
}

// ── YouTube playlist fetch ────────────────────────────────────────────────────
export async function fetchYTPlaylists() {
  const tokens = getGoogleTokens();
  if (!tokens?.access_token) return { playlists: [], error: "Not connected" };
  try {
    const res  = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    if (res.status === 401) { clearGoogle(); return { playlists: [], error: "Token expired — reconnect Google" }; }
    const data = await res.json();
    const pls  = (data.items || []).map(item => ({
      id:        item.id,
      name:      item.snippet?.title || "Untitled",
      title:     item.snippet?.title || "Untitled",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      count:     item.contentDetails?.itemCount || 0,
      source:    "youtube",
    }));
    return { playlists: pls, error: null };
  } catch (e) { return { playlists: [], error: String(e) }; }
}

export async function fetchYTPlaylistItems(playlistId) {
  const tokens = getGoogleTokens();
  if (!tokens?.access_token) return { items: [], error: "Not connected" };
  try {
    const res  = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    if (res.status === 401) { clearGoogle(); return { items: [], error: "Token expired" }; }
    const data = await res.json();
    const items = (data.items || [])
      .filter(i => i.snippet?.resourceId?.videoId)
      .map(item => ({
        id:           item.snippet.resourceId.videoId,
        ytId:         item.snippet.resourceId.videoId,
        name:         item.snippet.title || "Unknown",
        title:        item.snippet.title || "Unknown",
        artist:       item.snippet.videoOwnerChannelTitle || "",
        channelTitle: item.snippet.videoOwnerChannelTitle || "",
        thumbnail:    item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/mqdefault.jpg`,
        source:       "youtube",
        type:         "video",
      }));
    return { items, error: null };
  } catch (e) { return { items: [], error: String(e) }; }
}

// ── Spotify playlist fetch ────────────────────────────────────────────────────
export async function fetchSpotifyPlaylists() {
  const tokens = getSpotifyTokens();
  if (!tokens?.access_token) return { playlists: [], error: "Not connected" };
  try {
    const res  = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    if (res.status === 401) { clearSpotify(); return { playlists: [], error: "Token expired" }; }
    const data = await res.json();
    const pls  = (data.items || []).map(p => ({
      id:        p.id,
      name:      p.name || "Untitled",
      title:     p.name || "Untitled",
      thumbnail: p.images?.[0]?.url || "",
      count:     p.tracks?.total || 0,
      source:    "spotify",
    }));
    return { playlists: pls, error: null };
  } catch (e) { return { playlists: [], error: String(e) }; }
}

export async function fetchSpotifyTracks(playlistId) {
  const tokens = getSpotifyTokens();
  if (!tokens?.access_token) return { items: [], error: "Not connected" };
  try {
    const res  = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    if (res.status === 401) { clearSpotify(); return { items: [], error: "Token expired" }; }
    const data = await res.json();
    const items = (data.items || []).filter(i => i.track).map(i => ({
      id:       i.track.id,
      name:     i.track.name || "",
      artist:   (i.track.artists || []).map(a => a.name).join(", "),
      artists:  (i.track.artists || []).map(a => a.name).join(", "),
      image:    i.track.album?.images?.[1]?.url || i.track.album?.images?.[0]?.url || "",
      thumbnail:i.track.album?.images?.[1]?.url || i.track.album?.images?.[0]?.url || "",
      source:   "spotify",
    }));
    return { items, error: null };
  } catch (e) { return { items: [], error: String(e) }; }
}
