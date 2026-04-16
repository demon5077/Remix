/**
 * POST /api/auth/email
 * Actions: register | verify | login | resend | update | add-playlist | remove-playlist
 *
 * Primary DB: Supabase (set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY)
 * Fallback:   File-based JSON at .arise-db.json (dev / no Supabase)
 *
 * Email: Resend (set RESEND_API_KEY + ARISE_FROM_EMAIL)
 */

import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import crypto from "crypto";
import {
  hasSupabase,
  createUser, getUserByIdentifier, getUserById, updateUser,
  upsertToken, getValidToken, deleteTokens,
  addPlaylistToUser, removePlaylistFromUser, bulkSavePlaylistsToUser,
} from "@/lib/supabase";

// ── File-based DB fallback ────────────────────────────────────────────────────
const DB_PATH = join(process.cwd(), ".arise-db.json");

function readDB() {
  try { return existsSync(DB_PATH) ? JSON.parse(readFileSync(DB_PATH, "utf8")) : { users: [], tokens: [] }; }
  catch { return { users: [], tokens: [] }; }
}
function writeDB(db) { writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

// ── Unified DB interface (Supabase OR file) ───────────────────────────────────
const db = {
  async getUser(identifier) {
    if (hasSupabase) return getUserByIdentifier(identifier);
    const d = readDB(); return d.users.find(u => u.identifier === identifier.toLowerCase().trim()) || null;
  },
  async getUserById(id) {
    if (hasSupabase) return getUserById(id);
    const d = readDB(); return d.users.find(u => u.id === id) || null;
  },
  async createUser(user) {
    if (hasSupabase) return createUser(user);
    const d = readDB(); d.users.push({ ...user, playlists: [], liked_songs: [], connected: {} }); writeDB(d);
    return user;
  },
  async updateUser(id, data) {
    if (hasSupabase) return updateUser(id, data);
    const d = readDB();
    const i = d.users.findIndex(u => u.id === id);
    if (i === -1) return null;
    // Map camelCase to snake_case for file DB
    if (data.playlists  !== undefined) d.users[i].playlists   = data.playlists;
    if (data.likedSongs !== undefined) d.users[i].liked_songs  = data.likedSongs;
    if (data.connected  !== undefined) d.users[i].connected    = data.connected;
    if (data.verified   !== undefined) d.users[i].verified     = data.verified;
    if (data.name       !== undefined) d.users[i].name         = data.name;
    writeDB(d);
    return d.users[i];
  },
  async upsertToken(identifier, code, type) {
    if (hasSupabase) return upsertToken({ identifier, code, type });
    const d  = readDB();
    const ex = Date.now() + 15 * 60 * 1000;
    d.tokens = (d.tokens || []).filter(t => !(t.identifier === identifier.toLowerCase() && t.type === type));
    d.tokens.push({ identifier: identifier.toLowerCase(), code, type, expiresAt: ex });
    writeDB(d); return { code };
  },
  async getToken(identifier, code, type) {
    if (hasSupabase) return getValidToken(identifier, code, type);
    const d = readDB(); const now = Date.now();
    return d.tokens?.find(t => t.identifier === identifier.toLowerCase() && t.code === code && t.type === type && (t.expiresAt || t.expires_at) > now) || null;
  },
  async deleteTokens(identifier, type) {
    if (hasSupabase) return deleteTokens(identifier, type);
    const d = readDB();
    d.tokens = (d.tokens || []).filter(t => !(t.identifier === identifier.toLowerCase() && t.type === type));
    writeDB(d);
  },
  async addPlaylist(userId, playlist) {
    if (hasSupabase) return addPlaylistToUser(userId, playlist);
    const user = await this.getUserById(userId); if (!user) return [];
    const existing = user.playlists || [];
    const updated  = [playlist, ...existing.filter(p => p.id !== playlist.id)];
    await this.updateUser(userId, { playlists: updated }); return updated;
  },
  async savePlaylists(userId, playlists) {
    if (hasSupabase) return bulkSavePlaylistsToUser(userId, playlists);
    await this.updateUser(userId, { playlists }); return playlists;
  },
};

function hashPw(pw) { return crypto.createHash("sha256").update(pw + "arise-salt-2025").digest("hex"); }

function safeUser(u) {
  return {
    id:         u.id,
    name:       u.name,
    identifier: u.identifier,
    verified:   u.verified,
    authType:   u.auth_type || u.authType,
    playlists:  u.playlists  || [],
    likedSongs: u.liked_songs || u.likedSongs || [],
    connected:  u.connected  || {},
  };
}

// ── Email sender ──────────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const key  = process.env.RESEND_API_KEY || "";
  const from = process.env.ARISE_FROM_EMAIL || "Arise <onboarding@resend.dev>";
  if (!key) { console.log(`[arise-email] Code for ${to}:`, subject); return { ok: false }; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  return res.ok ? { ok: true } : { ok: false };
}

function verifyHtml(name, code) {
  return `<div style="background:#07070d;color:#e8e8f8;font-family:monospace;max-width:480px;margin:0 auto;padding:32px;border-radius:16px;border:1px solid rgba(255,0,60,0.15)">
    <h1 style="color:#FF003C;font-size:28px;margin:0 0 4px">Arise</h1>
    <p style="color:#9999bb;font-size:11px;letter-spacing:0.3em;margin:0 0 24px">RISE FROM THE SHADOWS</p>
    <h2 style="color:#e8e8f8;font-size:18px;margin:0 0 8px">Welcome, ${name}!</h2>
    <p style="color:#aaaacc;font-size:14px;margin:0 0 20px">Your verification code:</p>
    <div style="background:rgba(255,0,60,0.08);border:1px solid rgba(255,0,60,0.25);border-radius:12px;padding:20px;text-align:center;margin:0 0 20px">
      <span style="font-size:38px;font-weight:900;letter-spacing:0.4em;color:#FF003C">${code}</span>
    </div>
    <p style="color:#666688;font-size:12px">Expires in 15 minutes. If you didn't sign up, ignore this.</p>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.05);margin:20px 0">
    <p style="color:#444466;font-size:10px">Crafted in darkness by Sunil · Arise Music</p>
  </div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  const { action } = body;

  // ── register ──────────────────────────────────────────────────────────────
  if (action === "register") {
    const { name, identifier, password, authType } = body;
    if (!name || !identifier || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    try {
      const existing = await db.getUser(identifier);
      if (existing) return NextResponse.json({ error: "Account already exists — sign in instead" }, { status: 409 });

      const id   = crypto.randomUUID();
      const code = crypto.randomInt(100000, 999999).toString();
      await db.createUser({ id, name: name.trim(), identifier: identifier.trim(), password: hashPw(password), authType });

      if (authType === "email") {
        await db.upsertToken(identifier.trim(), code, "verify");
        await sendEmail({ to: identifier.trim(), subject: "🔥 Verify your Arise account", html: verifyHtml(name, code) });
        return NextResponse.json({ ok: true, needsVerification: true, userId: id });
      }

      // Phone — no verification
      const u = await db.getUserById(id);
      return NextResponse.json({ ok: true, user: safeUser(u) });
    } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
  }

  // ── verify ────────────────────────────────────────────────────────────────
  if (action === "verify") {
    const { identifier, code } = body;
    if (!identifier || !code) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    try {
      const token = await db.getToken(identifier.trim(), code.trim(), "verify");
      if (!token) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
      const user  = await db.getUser(identifier.trim());
      if (!user)  return NextResponse.json({ error: "User not found" }, { status: 404 });
      await db.updateUser(user.id, { verified: true });
      await db.deleteTokens(identifier.trim(), "verify");
      const updated = await db.getUserById(user.id);
      return NextResponse.json({ ok: true, user: safeUser(updated) });
    } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
  }

  // ── login ─────────────────────────────────────────────────────────────────
  if (action === "login") {
    const { identifier, password } = body;
    if (!identifier || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    try {
      const user = await db.getUser(identifier.trim());
      if (!user || user.password !== hashPw(password)) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      if (!user.verified) return NextResponse.json({ error: "Email not verified", needsVerification: true }, { status: 403 });
      return NextResponse.json({ ok: true, user: safeUser(user) });
    } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
  }

  // ── resend ────────────────────────────────────────────────────────────────
  if (action === "resend") {
    const { identifier } = body;
    if (!identifier) return NextResponse.json({ error: "Missing identifier" }, { status: 400 });
    try {
      const user = await db.getUser(identifier.trim());
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      if (user.verified) return NextResponse.json({ ok: true });
      const code = crypto.randomInt(100000, 999999).toString();
      await db.upsertToken(identifier.trim(), code, "verify");
      await sendEmail({ to: identifier.trim(), subject: "🔥 Your new Arise code", html: verifyHtml(user.name, code) });
      return NextResponse.json({ ok: true });
    } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
  }

  // ── update (name, likedSongs, connected) ──────────────────────────────────
  if (action === "update") {
    const { userId, data } = body;
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    try {
      const allowed = ["name", "likedSongs", "connected"];
      const filtered = {};
      allowed.forEach(k => { if (data[k] !== undefined) filtered[k] = data[k]; });
      const updated = await db.updateUser(userId, filtered);
      return NextResponse.json({ ok: true, user: updated ? safeUser(updated) : null });
    } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
  }

  // ── add-playlist ──────────────────────────────────────────────────────────
  if (action === "add-playlist") {
    const { userId, playlist } = body;
    if (!userId || !playlist) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    try {
      const playlists = await db.addPlaylist(userId, playlist);
      return NextResponse.json({ ok: true, playlists });
    } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
  }

  // ── save-playlists (bulk, e.g. after OAuth import) ────────────────────────
  if (action === "save-playlists") {
    const { userId, playlists } = body;
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    try {
      const saved = await db.savePlaylists(userId, playlists || []);
      return NextResponse.json({ ok: true, playlists: saved });
    } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
  }

  // ── get-user ──────────────────────────────────────────────────────────────
  if (action === "get-user") {
    const { userId } = body;
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    try {
      const user = await db.getUserById(userId);
      if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true, user: safeUser(user) });
    } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
