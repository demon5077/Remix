/**
 * lib/youtube.js
 * RapidAPI → yt-api.p.rapidapi.com
 *
 * All functions return { data, error } so callers never need try/catch.
 * Key stored in NEXT_PUBLIC_RAPIDAPI_KEY (client-safe for this public key).
 */

const BASE    = "https://yt-api.p.rapidapi.com";
const API_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || "";
const HOST    = "yt-api.p.rapidapi.com";

const HEADERS = {
  "X-RapidAPI-Key":  API_KEY,
  "X-RapidAPI-Host": HOST,
};

async function ytFetch(path) {
  if (!API_KEY) {
    console.warn("[youtube.js] NEXT_PUBLIC_RAPIDAPI_KEY is not set");
    return { data: null, error: "API key not configured" };
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "GET",
      headers: HEADERS,
      next: { revalidate: 300 }, // cache 5 min on server
    });
    if (!res.ok) {
      const text = await res.text();
      return { data: null, error: `HTTP ${res.status}: ${text.slice(0, 120)}` };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
/**
 * searchYT(query, type?)
 * type: "video" | "channel" | "playlist" | "" (all)
 * Returns array of items shaped as YTItem (see below).
 */
export async function searchYT(query, type = "video") {
  const params = new URLSearchParams({ query });
  if (type) params.set("type", type);
  const { data, error } = await ytFetch(`/search?${params}`);
  if (error || !data) return { items: [], error };
  // Normalise to a flat array
  const raw = data.data || data.items || data.results || [];
  return { items: raw.map(normaliseItem), error: null };
}

/**
 * searchSongs(query) — convenience wrapper that filters to music-like results
 */
export async function searchSongs(query) {
  return searchYT(query, "video");
}

// ── Video details ─────────────────────────────────────────────────────────────
/**
 * getVideoDetails(videoId)
 * Returns full metadata for a single video.
 */
export async function getVideoDetails(videoId) {
  const { data, error } = await ytFetch(`/video/info?id=${videoId}`);
  if (error || !data) return { video: null, error };
  return { video: normaliseItem(data), error: null };
}

// ── Related / suggestions ─────────────────────────────────────────────────────
/**
 * getRelatedVideos(videoId)
 * Returns array of related videos for a given video ID.
 */
export async function getRelatedVideos(videoId) {
  const { data, error } = await ytFetch(`/related?id=${videoId}`);
  if (error || !data) return { items: [], error };
  const raw = data.data || data.items || data.results || [];
  return { items: raw.map(normaliseItem), error: null };
}

// ── Channel ───────────────────────────────────────────────────────────────────
export async function getChannelVideos(channelId) {
  const { data, error } = await ytFetch(`/channel/videos?id=${channelId}`);
  if (error || !data) return { items: [], error };
  const raw = data.data || data.items || [];
  return { items: raw.map(normaliseItem), error: null };
}

// ── Trending ──────────────────────────────────────────────────────────────────
export async function getTrending(geo = "US", type = "music") {
  const params = new URLSearchParams({ geo, type });
  const { data, error } = await ytFetch(`/trending?${params}`);
  if (error || !data) return { items: [], error };
  const raw = data.data || data.items || [];
  return { items: raw.map(normaliseItem), error: null };
}

// ── Normaliser ────────────────────────────────────────────────────────────────
/**
 * Normalises any yt-api response item into a consistent YTItem shape:
 * {
 *   id, title, channelTitle, channelId,
 *   thumbnail, duration, durationText,
 *   viewCount, publishedAt, description,
 *   type: "video" | "channel" | "playlist"
 * }
 */
export function normaliseItem(raw) {
  if (!raw) return null;

  // videoId can be nested differently
  const id =
    raw.videoId ||
    raw.id?.videoId ||
    raw.id ||
    "";

  // Thumbnails — pick best quality
  const thumbs =
    raw.thumbnail?.thumbnails ||
    raw.thumbnails ||
    [];
  const thumbnail =
    (Array.isArray(thumbs) && thumbs.length > 0
      ? thumbs[thumbs.length - 1].url
      : null) ||
    raw.thumbnail?.url ||
    raw.thumbnail ||
    (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");

  const channelData = raw.channelHandle || raw.author || {};

  return {
    id,
    title:        raw.title || "",
    channelTitle: raw.channelTitle || channelData.title || channelData.name || "",
    channelId:    raw.channelId    || channelData.id || "",
    thumbnail:    thumbnail.replace(/^\/\//, "https://"),
    duration:     raw.duration || raw.lengthSeconds || 0,
    durationText: raw.durationText || raw.duration?.simpleText || formatSeconds(raw.lengthSeconds),
    viewCount:    raw.viewCount   || raw.stats?.views || 0,
    publishedAt:  raw.publishedAt || raw.published || "",
    description:  raw.description || raw.snippet?.description || "",
    type:         raw.type || "video",
  };
}

function formatSeconds(s) {
  if (!s) return "";
  const n = parseInt(s, 10);
  const m = Math.floor(n / 60);
  const sec = n % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ── YouTube embed URL helper ──────────────────────────────────────────────────
export function ytEmbedUrl(videoId, autoplay = true) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    enablejsapi: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${params}`;
}

export function ytWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
