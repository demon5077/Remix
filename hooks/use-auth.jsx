"use client";
/**
 * AuthProvider — handles Google (YouTube) + Spotify OAuth.
 *
 * Google: uses window.google.accounts.oauth2 (Google Identity Services)
 * Spotify: uses Authorization Code Flow with PKCE via redirect
 *
 * Tokens stored in localStorage (for demo; use httpOnly cookies in production).
 * Playlist import fetches from YouTube Data API / Spotify Web API using the token.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";

// ── PKCE helpers ─────────────────────────────────────────────────
async function generatePKCE() {
  const array   = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
  return { verifier, challenge };
}

export function AuthProvider({ children }) {
  const [googleUser,  setGoogleUser]  = useState(null);
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [googleToken, setGoogleToken] = useState(null);
  const [spotifyToken,setSpotifyToken]= useState(null);
  const [playlists,   setPlaylists]   = useState({ google: [], spotify: [] });
  const [importing,   setImporting]   = useState(false);

  // ── Restore sessions on mount ─────────────────────────────────
  useEffect(() => {
    try {
      const gt = localStorage.getItem("arise:google:token");
      const gu = localStorage.getItem("arise:google:user");
      const st = localStorage.getItem("arise:spotify:token");
      const su = localStorage.getItem("arise:spotify:user");
      if (gt) { setGoogleToken(gt); }
      if (gu) { setGoogleUser(JSON.parse(gu)); }
      if (st) { setSpotifyToken(st); }
      if (su) { setSpotifyUser(JSON.parse(su)); }
    } catch {}
  }, []);

  // ── Handle Spotify OAuth callback ─────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("spotify_code");
    const state  = params.get("spotify_state");
    if (!code || !state) return;

    const savedState    = localStorage.getItem("arise:spotify:state");
    const verifier      = localStorage.getItem("arise:spotify:verifier");
    if (state !== savedState || !verifier) return;

    // Exchange code for token
    const redirectUri = `${window.location.origin}/auth/callback`;
    fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "authorization_code",
        code,
        redirect_uri:  redirectUri,
        client_id:     SPOTIFY_CLIENT_ID,
        code_verifier: verifier,
      }),
    })
    .then(r => r.json())
    .then(async data => {
      if (!data.access_token) return;
      const token = data.access_token;
      setSpotifyToken(token);
      localStorage.setItem("arise:spotify:token", token);
      // Fetch user profile
      const profile = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
      setSpotifyUser(profile);
      localStorage.setItem("arise:spotify:user", JSON.stringify(profile));
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    })
    .catch(console.error);
  }, []);

  // ── Google Sign-In (one-tap / button) ─────────────────────────
  const loginWithGoogle = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      alert("Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local to enable Google login");
      return;
    }
    // Use Google Identity Services (GIS) popup flow
    const script = document.createElement("script");
    script.src   = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope:     "openid email profile https://www.googleapis.com/auth/youtube.readonly",
        callback:  async (response) => {
          if (!response.access_token) return;
          const token = response.access_token;
          setGoogleToken(token);
          localStorage.setItem("arise:google:token", token);
          // Fetch user info
          const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${token}` },
          }).then(r => r.json());
          setGoogleUser(info);
          localStorage.setItem("arise:google:user", JSON.stringify(info));
        },
      }).requestAccessToken();
    };
    document.head.appendChild(script);
  }, []);

  // ── Spotify PKCE Login ────────────────────────────────────────
  const loginWithSpotify = useCallback(async () => {
    if (!SPOTIFY_CLIENT_ID) {
      alert("Set NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local to enable Spotify login");
      return;
    }
    const { verifier, challenge } = await generatePKCE();
    const state = crypto.randomUUID();
    localStorage.setItem("arise:spotify:verifier", verifier);
    localStorage.setItem("arise:spotify:state",    state);

    const params = new URLSearchParams({
      client_id:             SPOTIFY_CLIENT_ID,
      response_type:         "code",
      redirect_uri:          `${window.location.origin}/auth/callback`,
      state,
      scope:                 "user-read-private user-read-email playlist-read-private playlist-read-collaborative user-library-read",
      code_challenge_method: "S256",
      code_challenge:        challenge,
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logoutGoogle = useCallback(() => {
    setGoogleUser(null); setGoogleToken(null);
    setPlaylists(p => ({ ...p, google: [] }));
    localStorage.removeItem("arise:google:token");
    localStorage.removeItem("arise:google:user");
  }, []);

  const logoutSpotify = useCallback(() => {
    setSpotifyUser(null); setSpotifyToken(null);
    setPlaylists(p => ({ ...p, spotify: [] }));
    localStorage.removeItem("arise:spotify:token");
    localStorage.removeItem("arise:spotify:user");
  }, []);

  // ── Import Playlists ──────────────────────────────────────────
  const importGooglePlaylists = useCallback(async () => {
    if (!googleToken) return [];
    setImporting(true);
    try {
      const res  = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50",
        { headers: { Authorization: `Bearer ${googleToken}` } }
      );
      const data = await res.json();
      const pls  = (data.items || []).map(item => ({
        id:        item.id,
        name:      item.snippet?.title || "Untitled",
        thumbnail: item.snippet?.thumbnails?.medium?.url || "",
        count:     item.contentDetails?.itemCount || 0,
        source:    "youtube",
      }));
      setPlaylists(p => ({ ...p, google: pls }));
      return pls;
    } catch (e) { console.error(e); return []; }
    finally    { setImporting(false); }
  }, [googleToken]);

  const importSpotifyPlaylists = useCallback(async () => {
    if (!spotifyToken) return [];
    setImporting(true);
    try {
      const res  = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });
      const data = await res.json();
      const pls  = (data.items || []).map(item => ({
        id:        item.id,
        name:      item.name || "Untitled",
        thumbnail: item.images?.[0]?.url || "",
        count:     item.tracks?.total || 0,
        source:    "spotify",
      }));
      setPlaylists(p => ({ ...p, spotify: pls }));
      return pls;
    } catch (e) { console.error(e); return []; }
    finally    { setImporting(false); }
  }, [spotifyToken]);

  // ── Fetch playlist tracks ─────────────────────────────────────
  const getYouTubePlaylistTracks = useCallback(async (playlistId) => {
    if (!googleToken) return [];
    const res  = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`,
      { headers: { Authorization: `Bearer ${googleToken}` } }
    );
    const data = await res.json();
    return (data.items || []).map(item => ({
      id:        item.snippet?.resourceId?.videoId,
      title:     item.snippet?.title,
      thumbnail: item.snippet?.thumbnails?.medium?.url,
      channelTitle: item.snippet?.videoOwnerChannelTitle,
    }));
  }, [googleToken]);

  const getSpotifyPlaylistTracks = useCallback(async (playlistId) => {
    if (!spotifyToken) return [];
    const res  = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
      headers: { Authorization: `Bearer ${spotifyToken}` },
    });
    const data = await res.json();
    return (data.items || [])
      .filter(i => i.track)
      .map(i => ({
        id:         i.track.id,
        name:       i.track.name,
        artists:    i.track.artists?.map(a => a.name).join(", "),
        album:      i.track.album?.name,
        thumbnail:  i.track.album?.images?.[1]?.url,
        spotifyUrl: i.track.external_urls?.spotify,
      }));
  }, [spotifyToken]);

  const allPlaylists = [...playlists.google, ...playlists.spotify];
  const isLoggedIn   = !!googleUser || !!spotifyUser;

  return (
    <AuthContext.Provider value={{
      googleUser, spotifyUser, googleToken, spotifyToken,
      playlists, allPlaylists, isLoggedIn, importing,
      loginWithGoogle, loginWithSpotify,
      logoutGoogle, logoutSpotify,
      importGooglePlaylists, importSpotifyPlaylists,
      getYouTubePlaylistTracks, getSpotifyPlaylistTracks,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
