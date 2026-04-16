/**
 * lib/supabase.js
 * Supabase client + all DB operations for Arise.
 *
 * Setup:
 * 1. Create free project at https://supabase.com
 * 2. Run the SQL schema below in the Supabase SQL editor
 * 3. Add to .env.local:
 *    NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 *    SUPABASE_SERVICE_KEY=eyJ...   ← server-only, never expose client-side
 *
 * SQL Schema (run once in Supabase SQL editor):
 * ─────────────────────────────────────────────
 * create table arise_users (
 *   id          uuid primary key default gen_random_uuid(),
 *   name        text not null,
 *   identifier  text not null unique,  -- email or phone
 *   password    text not null,
 *   auth_type   text not null default 'email',
 *   verified    boolean not null default false,
 *   created_at  timestamptz default now(),
 *   playlists   jsonb default '[]'::jsonb,
 *   liked_songs jsonb default '[]'::jsonb,
 *   connected   jsonb default '{}'::jsonb
 * );
 * create index on arise_users (identifier);
 *
 * create table arise_tokens (
 *   id          uuid primary key default gen_random_uuid(),
 *   identifier  text not null,
 *   code        text not null,
 *   type        text not null,
 *   expires_at  timestamptz not null,
 *   created_at  timestamptz default now()
 * );
 * create index on arise_tokens (identifier, type);
 * ─────────────────────────────────────────────
 */

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SVC_KEY  = process.env.SUPABASE_SERVICE_KEY          || SUPABASE_ANON_KEY;

export const hasSupabase = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// ── Raw fetch helper (no SDK dependency — avoids bundle bloat) ────────────────
async function sbFetch(path, opts = {}, useService = false) {
  if (!hasSupabase) throw new Error("Supabase not configured");
  const key = useService ? SUPABASE_SVC_KEY : SUPABASE_ANON_KEY;
  const res  = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      "Content-Type":    "application/json",
      "apikey":          key,
      "Authorization":   `Bearer ${key}`,
      "Prefer":          "return=representation",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Supabase error ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function createUser({ id, name, identifier, password, authType }) {
  const rows = await sbFetch("/arise_users", {
    method: "POST",
    body: JSON.stringify({
      id,
      name,
      identifier: identifier.toLowerCase().trim(),
      password,
      auth_type: authType,
      verified:  authType === "phone",
      playlists:   [],
      liked_songs: [],
      connected:   {},
    }),
  }, true);
  return rows?.[0] || null;
}

export async function getUserByIdentifier(identifier) {
  const rows = await sbFetch(
    `/arise_users?identifier=eq.${encodeURIComponent(identifier.toLowerCase().trim())}&limit=1`,
    { method: "GET" }, true
  );
  return rows?.[0] || null;
}

export async function getUserById(id) {
  const rows = await sbFetch(`/arise_users?id=eq.${id}&limit=1`, { method: "GET" }, true);
  return rows?.[0] || null;
}

export async function updateUser(id, data) {
  // Map camelCase → snake_case for Supabase columns
  const payload = {};
  if (data.name        !== undefined) payload.name         = data.name;
  if (data.verified    !== undefined) payload.verified      = data.verified;
  if (data.playlists   !== undefined) payload.playlists     = data.playlists;
  if (data.likedSongs  !== undefined) payload.liked_songs   = data.likedSongs;
  if (data.connected   !== undefined) payload.connected     = data.connected;

  await sbFetch(`/arise_users?id=eq.${id}`, {
    method:  "PATCH",
    body:    JSON.stringify(payload),
  }, true);
  return getUserById(id);
}

// ── Tokens (email verification) ───────────────────────────────────────────────

export async function upsertToken({ identifier, code, type }) {
  // Delete existing tokens for this identifier+type
  await sbFetch(
    `/arise_tokens?identifier=eq.${encodeURIComponent(identifier.toLowerCase())}&type=eq.${type}`,
    { method: "DELETE" }, true
  );
  // Insert new
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const rows = await sbFetch("/arise_tokens", {
    method: "POST",
    body: JSON.stringify({ identifier: identifier.toLowerCase(), code, type, expires_at: expiresAt }),
  }, true);
  return rows?.[0] || null;
}

export async function getValidToken(identifier, code, type) {
  const rows = await sbFetch(
    `/arise_tokens?identifier=eq.${encodeURIComponent(identifier.toLowerCase())}&type=eq.${type}&code=eq.${code}&expires_at=gt.${new Date().toISOString()}&limit=1`,
    { method: "GET" }, true
  );
  return rows?.[0] || null;
}

export async function deleteTokens(identifier, type) {
  await sbFetch(
    `/arise_tokens?identifier=eq.${encodeURIComponent(identifier.toLowerCase())}&type=eq.${type}`,
    { method: "DELETE" }, true
  );
}

// ── Playlist helpers ──────────────────────────────────────────────────────────

export async function addPlaylistToUser(userId, playlist) {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  const existing   = user.playlists || [];
  const deduped    = existing.filter(p => p.id !== playlist.id);
  const updated    = [playlist, ...deduped]; // newest first
  await updateUser(userId, { playlists: updated });
  return updated;
}

export async function removePlaylistFromUser(userId, playlistId) {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  const updated = (user.playlists || []).filter(p => p.id !== playlistId);
  await updateUser(userId, { playlists: updated });
  return updated;
}

export async function bulkSavePlaylistsToUser(userId, playlists) {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  const existing = user.playlists || [];
  // Merge: new playlists added, existing by same id updated
  const map = new Map(existing.map(p => [p.id, p]));
  playlists.forEach(p => map.set(p.id, p));
  const merged = [...map.values()];
  await updateUser(userId, { playlists: merged });
  return merged;
}
