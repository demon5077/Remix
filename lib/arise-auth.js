/**
 * lib/arise-auth.js — client-side auth helpers
 */

export const SESSION_KEY = "arise:session:v2";

export function getSession()      { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } }
export function saveSession(user) { localStorage.setItem(SESSION_KEY, JSON.stringify({ ...user, savedAt: Date.now() })); }
export function clearSession()    { localStorage.removeItem(SESSION_KEY); }
export function updateSessionField(field, value) {
  const s = getSession(); if (!s) return;
  saveSession({ ...s, [field]: value });
}

async function call(body) {
  const res = await fetch("/api/auth/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

export const registerUser          = (d) => call({ action: "register",       ...d });
export const verifyEmail           = (d) => call({ action: "verify",         ...d });
export const loginUser             = (d) => call({ action: "login",          ...d });
export const resendVerification    = (d) => call({ action: "resend",         ...d });
export const updateUser            = (d) => call({ action: "update",         ...d });
export const addPlaylistToAccount  = (d) => call({ action: "add-playlist",   ...d });
export const savePlaylistsToAccount= (d) => call({ action: "save-playlists", ...d });
export const refreshUserFromServer = (d) => call({ action: "get-user",       ...d });

/** Add a playlist to user's account and update local session */
export async function persistPlaylist(userId, playlist) {
  const res = await addPlaylistToAccount({ userId, playlist });
  if (res.ok) {
    updateSessionField("playlists", res.playlists);
    return res.playlists;
  }
  return null;
}

/** Save many playlists (after OAuth import) */
export async function persistManyPlaylists(userId, playlists) {
  const res = await savePlaylistsToAccount({ userId, playlists });
  if (res.ok) {
    updateSessionField("playlists", res.playlists);
    return res.playlists;
  }
  return null;
}
