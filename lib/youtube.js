/**
 * lib/youtube.js — RapidAPI yt-api.p.rapidapi.com wrapper
 *
 * Supports MULTIPLE RapidAPI keys for automatic rotation when rate-limited.
 * Set in .env.local (comma-separated):
 *   NEXT_PUBLIC_RAPIDAPI_KEY=key1,key2,key3
 */

const BASE = "https://yt-api.p.rapidapi.com";
const HOST = "yt-api.p.rapidapi.com";

// ── Key rotation pool ─────────────────────────────────────────────────────────
let _keyIndex = 0;

function getKeys() {
  const raw = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || "";
  return raw.split(",").map(k => k.trim()).filter(Boolean);
}

function getNextKey() {
  const keys = getKeys();
  if (!keys.length) return "";
  const key = keys[_keyIndex % keys.length];
  return key;
}

function rotateKey() {
  _keyIndex = (_keyIndex + 1) % Math.max(1, getKeys().length);
}

function getHeaders(key) {
  return {
    "X-RapidAPI-Key":  key,
    "X-RapidAPI-Host": HOST,
  };
}

export function hasApiKey() {
  return getKeys().length > 0;
}

export function getKeyCount() {
  return getKeys().length;
}

async function ytFetch(path) {
  const keys = getKeys();
  if (!keys.length) {
    return { data: null, error: "NEXT_PUBLIC_RAPIDAPI_KEY is not set in .env.local" };
  }

  // Try each key in rotation on 429 (rate limit)
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[(_keyIndex + attempt) % keys.length];
    try {
      const res = await fetch(`${BASE}${path}`, {
        method: "GET",
        headers: getHeaders(key),
        cache: "no-store",
      });
    if (res.status === 429) {
        // Rate limited — rotate to next key and retry
        rotateKey();
        continue;
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        return { data: null, error: `HTTP ${res.status}: ${txt.slice(0, 200)}` };
      }
      const data = await res.json();
      return { data, error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }
  return { data: null, error: "All API keys rate-limited. Add more keys to NEXT_PUBLIC_RAPIDAPI_KEY (comma-separated)." };
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchYT(query, type = "video") {
  if (!query?.trim()) return { items: [], error: null };
  const params = new URLSearchParams({ query: query.trim() });
  if (type) params.set("type", type);
  const { data, error } = await ytFetch(`/search?${params}`);
  if (error || !data) return { items: [], error };
  const raw = data.data || data.items || data.results || [];
  return { items: raw.map(normaliseItem).filter(Boolean), error: null };
}

export const searchSongs = (q) => searchYT(q, "video");

// ── Video details ─────────────────────────────────────────────────────────────
export async function getVideoDetails(videoId) {
  if (!videoId) return { video: null, error: "No videoId" };
  const { data, error } = await ytFetch(`/video/info?id=${videoId}`);
  if (error || !data) return { video: null, error };
  return { video: normaliseItem(data), error: null };
}

// ── Related ───────────────────────────────────────────────────────────────────
export async function getRelatedVideos(videoId) {
  if (!videoId) return { items: [], error: null };
  const { data, error } = await ytFetch(`/related?id=${videoId}`);
  if (error || !data) return { items: [], error };
  const raw = data.data || data.items || data.results || [];
  return { items: raw.map(normaliseItem).filter(Boolean), error: null };
}

// ── Channel ───────────────────────────────────────────────────────────────────
export async function getChannelVideos(channelId) {
  if (!channelId) return { items: [], error: null };
  const { data, error } = await ytFetch(`/channel/videos?id=${channelId}`);
  if (error || !data) return { items: [], error };
  const raw = data.data || data.items || [];
  return { items: raw.map(normaliseItem).filter(Boolean), error: null };
}

// ── Trending ──────────────────────────────────────────────────────────────────
export async function getTrending(geo = "US", type = "music") {
  const params = new URLSearchParams({ geo, type });
  const { data, error } = await ytFetch(`/trending?${params}`);
  if (error || !data) return { items: [], error };
  const raw = data.data || data.items || [];
  return { items: raw.map(normaliseItem).filter(Boolean), error: null };
}

// ── Normaliser ────────────────────────────────────────────────────────────────
/**
 * Consistent YTItem shape:
 * { id, title, channelTitle, channelId, thumbnail,
 *   duration, durationText, viewCount, publishedAt, description, type }
 */
export function normaliseItem(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id =
    (typeof raw.videoId === "string" && raw.videoId) ||
    (typeof raw.id === "string" && raw.id) ||
    (raw.id?.videoId) ||
    "";

  if (!id) return null; // drop items with no ID

  // Pick the highest-resolution thumbnail available
  const thumbArr =
    raw.thumbnail?.thumbnails ||
    (Array.isArray(raw.thumbnails) ? raw.thumbnails : null) ||
    [];
  const thumbUrl =
    (thumbArr.length > 0 ? thumbArr[thumbArr.length - 1]?.url : null) ||
    raw.thumbnail?.url ||
    (typeof raw.thumbnail === "string" ? raw.thumbnail : null) ||
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  const channel = raw.channelHandle || raw.author || {};

  return {
    id,
    title:        raw.title || raw.name || "",
    channelTitle: raw.channelTitle || channel.title || channel.name || "",
    channelId:    raw.channelId    || channel.id    || "",
    thumbnail:    String(thumbUrl).replace(/^\/\//, "https://"),
    duration:     raw.duration || raw.lengthSeconds || 0,
    durationText: raw.durationText || raw.duration?.simpleText || fmtSec(raw.lengthSeconds),
    viewCount:    Number(raw.viewCount || raw.stats?.views || 0),
    publishedAt:  raw.publishedAt || raw.published || "",
    description:  raw.description || "",
    type:         raw.type || "video",
  };
}

function fmtSec(s) {
  if (!s) return "";
  const n = parseInt(s, 10);
  if (isNaN(n)) return "";
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function ytEmbedUrl(videoId) {
  if (!videoId) return "";
  const p = new URLSearchParams({
    autoplay: "1", rel: "0", modestbranding: "1", playsinline: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${p}`;
}

export function ytWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function formatViews(n) {
  const num = Number(n);
  if (!num) return "";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K views`;
  return `${num} views`;
}
