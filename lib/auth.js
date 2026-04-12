/**
 * lib/auth.js — OAuth helpers for Google (YouTube) and Spotify.
 *
 * Flow:
 *  1. User clicks "Connect Google" → we redirect to Google OAuth
 *  2. Google redirects back to /api/auth/google/callback
 *  3. We exchange code for tokens, store in localStorage
 *  4. YT API calls use the access_token
 *
 * Spotify flow is identical but with Spotify endpoints.
 *
 * NOTE: For a production app, tokens should be stored server-side in a session.
 * For this client-rendered music app we store in localStorage (educational use).
 */

// ── Google / YouTube ──────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID  = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID  || "";
const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
const APP_URL           = process.env.NEXT_PUBLIC_APP_URL           || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube",
].join(" ");

export const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-top-read",
  "user-read-recently-played",
].join(" ");

// ── Google OAuth redirect ─────────────────────────────────────────────────────
export function startGoogleLogin() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID not set in .env.local");
  }
  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  `${APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope:         GOOGLE_SCOPES,
    access_type:   "offline",
    prompt:        "consent",
    state:         crypto.randomUUID(),
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ── Spotify OAuth redirect ────────────────────────────────────────────────────
export function startSpotifyLogin() {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error("NEXT_PUBLIC_SPOTIFY_CLIENT_ID not set in .env.local");
  }
  const state = crypto.randomUUID();
  sessionStorage.setItem("spotify_oauth_state", state);
  const params = new URLSearchParams({
    client_id:     SPOTIFY_CLIENT_ID,
    redirect_uri:  `${APP_URL}/api/auth/spotify/callback`,
    response_type: "code",
    scope:         SPOTIFY_SCOPES,
    state,
    show_dialog:   "true",
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

// ── Token storage ─────────────────────────────────────────────────────────────
export function saveGoogleTokens(tokens) {
  try { localStorage.setItem("arise:google:tokens", JSON.stringify({ ...tokens, saved_at: Date.now() })); } catch {}
}
export function getGoogleTokens() {
  try { return JSON.parse(localStorage.getItem("arise:google:tokens") || "null"); } catch { return null; }
}
export function clearGoogleTokens() {
  try { localStorage.removeItem("arise:google:tokens"); localStorage.removeItem("arise:google:profile"); } catch {}
}

export function saveSpotifyTokens(tokens) {
  try { localStorage.setItem("arise:spotify:tokens", JSON.stringify({ ...tokens, saved_at: Date.now() })); } catch {}
}
export function getSpotifyTokens() {
  try { return JSON.parse(localStorage.getItem("arise:spotify:tokens") || "null"); } catch { return null; }
}
export function clearSpotifyTokens() {
  try {
    localStorage.removeItem("arise:spotify:tokens");
    localStorage.removeItem("arise:spotify:profile");
  } catch {}
}

// ── Profile storage ───────────────────────────────────────────────────────────
export function getGoogleProfile() {
  try { return JSON.parse(localStorage.getItem("arise:google:profile") || "null"); } catch { return null; }
}
export function saveGoogleProfile(profile) {
  try { localStorage.setItem("arise:google:profile", JSON.stringify(profile)); } catch {}
}
export function getSpotifyProfile() {
  try { return JSON.parse(localStorage.getItem("arise:spotify:profile") || "null"); } catch { return null; }
}
export function saveSpotifyProfile(profile) {
  try { localStorage.setItem("arise:spotify:profile", JSON.stringify(profile)); } catch {}
}

// ── Check login status ────────────────────────────────────────────────────────
export function isGoogleLoggedIn()  { return !!getGoogleTokens();  }
export function isSpotifyLoggedIn() { return !!getSpotifyTokens(); }

// ── Fetch YouTube playlists ───────────────────────────────────────────────────
export async function fetchYouTubePlaylists() {
  const tokens = getGoogleTokens();
  if (!tokens?.access_token) return { playlists: [], error: "Not logged in with Google" };
  try {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    if (!res.ok) {
      if (res.status === 401) { clearGoogleTokens(); return { playlists: [], error: "Session expired — please reconnect Google" }; }
      return { playlists: [], error: `YouTube API error: ${res.status}` };
    }
    const data = await res.json();
    return {
      playlists: (data.items || []).map(p => ({
        id:          p.id,
        title:       p.snippet?.title || "Untitled",
        description: p.snippet?.description || "",
        thumbnail:   p.snippet?.thumbnails?.medium?.url || p.snippet?.thumbnails?.default?.url || "",
        count:       p.contentDetails?.itemCount || 0,
        source:      "youtube",
      })),
      error: null,
    };
  } catch (e) {
    return { playlists: [], error: String(e) };
  }
}

// ── Fetch YouTube playlist items ──────────────────────────────────────────────
export async function fetchYouTubePlaylistItems(playlistId) {
  const tokens = getGoogleTokens();
  if (!tokens?.access_token) return { items: [], error: "Not logged in" };
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    if (!res.ok) return { items: [], error: `Error: ${res.status}` };
    const data = await res.json();
    return {
      items: (data.items || []).map(item => ({
        id:          item.snippet?.resourceId?.videoId || "",
        title:       item.snippet?.title || "",
        thumbnail:   item.snippet?.thumbnails?.medium?.url || "",
        channelTitle:item.snippet?.videoOwnerChannelTitle || "",
        type:        "video",
      })).filter(i => i.id),
      error: null,
    };
  } catch (e) {
    return { items: [], error: String(e) };
  }
}

// ── Fetch Spotify playlists ───────────────────────────────────────────────────
export async function fetchSpotifyPlaylists() {
  const tokens = getSpotifyTokens();
  if (!tokens?.access_token) return { playlists: [], error: "Not logged in with Spotify" };
  try {
    const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!res.ok) {
      if (res.status === 401) { clearSpotifyTokens(); return { playlists: [], error: "Session expired — please reconnect Spotify" }; }
      return { playlists: [], error: `Spotify API error: ${res.status}` };
    }
    const data = await res.json();
    return {
      playlists: (data.items || []).map(p => ({
        id:          p.id,
        title:       p.name || "Untitled",
        description: p.description || "",
        thumbnail:   p.images?.[0]?.url || "",
        count:       p.tracks?.total || 0,
        source:      "spotify",
        externalUrl: p.external_urls?.spotify || "",
      })),
      error: null,
    };
  } catch (e) {
    return { playlists: [], error: String(e) };
  }
}

// ── Fetch Spotify playlist tracks ─────────────────────────────────────────────
export async function fetchSpotifyPlaylistTracks(playlistId) {
  const tokens = getSpotifyTokens();
  if (!tokens?.access_token) return { tracks: [], error: "Not logged in" };
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    if (!res.ok) return { tracks: [], error: `Error: ${res.status}` };
    const data = await res.json();
    return {
      tracks: (data.items || []).filter(i => i.track).map(i => ({
        id:      i.track.id,
        name:    i.track.name || "",
        artists: (i.track.artists || []).map(a => a.name).join(", "),
        album:   i.track.album?.name || "",
        image:   i.track.album?.images?.[1]?.url || i.track.album?.images?.[0]?.url || "",
        source:  "spotify",
        // Spotify tracks can be searched on Saavn by name+artist
        searchQuery: `${i.track.name} ${i.track.artists?.[0]?.name || ""}`,
      })),
      error: null,
    };
  } catch (e) {
    return { tracks: [], error: String(e) };
  }
}
