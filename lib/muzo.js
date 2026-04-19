/**
 * lib/muzo.js
 * Client for the Muzo backend API.
 * Set NEXT_PUBLIC_MUZO_API_URL in .env.local
 * Default: https://Muzo-backend.vercel.app
 *
 * Endpoints:
 *  GET /api/search?q=&filter=songs|videos|albums|artists|playlists
 *  GET /api/search/suggestions?q=&music=1
 *  GET /api/similar?title=&artist=&limit=
 *  GET /api/stream/:videoId          → Invidious stream data (adaptive formats)
 *  GET /api/music/find?name=&artist= → Find YouTube Music ID
 *  GET /api/trending                  → Trending songs/videos/playlists
 *  GET /api/related/:videoId         → Related videos
 *  GET /api/album/:albumId           → Album + tracks
 *  GET /api/playlist/:playlistId     → Playlist + tracks
 *  GET /api/charts?country=          → Charts
 *  GET /api/moods                    → Mood categories
 *  GET /api/moods/:categoryId        → Mood playlists
 *  GET /api/songs/:videoId           → Song metadata
 *  GET /api/artists/:browseId        → Artist details
 *  GET /api/albums/:browseId         → Album details (YTM browse)
 *  GET /api/yt_search?q=&filter=     → YouTube search
 *  GET /api/yt_channel/:channelId    → Channel details
 *  GET /api/feed/unauthenticated?channels=
 */

function getMuzoBase() {
  return (process.env.NEXT_PUBLIC_MUZO_API_URL || "https://Muzo-backend.vercel.app").replace(/\/$/, "");
}

export function hasMuzoApi() {
  return !!(process.env.NEXT_PUBLIC_MUZO_API_URL || "https://Muzo-backend.vercel.app");
}

async function muzoFetch(path, opts = {}) {
  const base = getMuzoBase();
  try {
    const res = await fetch(`${base}${path}`, {
      cache: "no-store",
      ...opts,
    });
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}

// ── Search ────────────────────────────────────────────────────────────────────

/**
 * Search YouTube Music (songs, videos, albums, artists, playlists)
 */
export async function muzoSearch(query, filter = "", limit = 20) {
  const params = new URLSearchParams({ q: query });
  if (filter) params.set("filter", filter);
  if (limit)  params.set("limit", String(limit));
  const { data, error } = await muzoFetch(`/api/search?${params}`);
  if (error || !data) return [];
  return data.results || data.data || [];
}

/**
 * Search suggestions (autocomplete)
 */
export async function muzoSuggestions(query, music = true) {
  const params = new URLSearchParams({ q: query, music: music ? "1" : "0" });
  const { data } = await muzoFetch(`/api/search/suggestions?${params}`);
  return data?.suggestions || [];
}

/**
 * YouTube search (videos, channels, playlists)
 */
export async function muzoYtSearch(query, filter = "videos") {
  const params = new URLSearchParams({ q: query, filter });
  const { data } = await muzoFetch(`/api/yt_search?${params}`);
  return data?.results || data?.data || data || [];
}

// ── Streaming ─────────────────────────────────────────────────────────────────

/**
 * Get Invidious stream data for a YouTube video ID.
 * Returns { adaptiveFormats, formatStreams, ... } or null.
 */
export async function muzoStream(videoId) {
  const { data, error } = await muzoFetch(`/api/stream/${videoId}`);
  if (error || !data) return null;
  return data;
}

/**
 * Get best audio URL from Muzo stream data.
 * Priority: Saavn → adaptive audio → format stream
 */
export function getBestAudioUrl(streamData) {
  if (!streamData) return null;

  // Saavn streaming URLs (highest priority — best quality, no buffering)
  if (streamData.streamingUrls?.length) {
    const best = streamData.streamingUrls.find(u => u.quality === "320kbps")
      || streamData.streamingUrls.find(u => u.quality === "160kbps")
      || streamData.streamingUrls[0];
    if (best?.url) return best.url;
  }

  // Adaptive formats (audio-only, sorted by bitrate)
  if (streamData.adaptiveFormats?.length) {
    const audioFormats = streamData.adaptiveFormats
      .filter(f => f.type?.includes("audio") && f.url)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    if (audioFormats[0]?.url) return audioFormats[0].url;
  }

  // Format streams (muxed video+audio)
  if (streamData.formatStreams?.length) {
    const best = streamData.formatStreams
      .filter(f => f.url)
      .sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0))[0];
    if (best?.url) return best.url;
  }

  return null;
}

/**
 * Find a YouTube Music video ID for a song by name+artist,
 * then get its stream URL. Falls back to JioSaavn if Muzo fails.
 */
export async function muzoFindAndStream(name, artist) {
  const params = new URLSearchParams({ name, artist });
  const { data: findData } = await muzoFetch(`/api/music/find?${params}`);
  const videoId = findData?.data?.videoId || findData?.data?.id;
  if (!videoId) return { videoId: null, audioUrl: null };

  const streamData = await muzoStream(videoId);
  const audioUrl   = getBestAudioUrl(streamData);
  return { videoId, audioUrl, streamData, metadata: findData?.data };
}

// ── Similar tracks ────────────────────────────────────────────────────────────

export async function muzoSimilar(title, artist, limit = 10) {
  const params = new URLSearchParams({ title, artist, limit: String(limit) });
  const { data } = await muzoFetch(`/api/similar?${params}`);
  return Array.isArray(data) ? data : [];
}

// ── Trending ──────────────────────────────────────────────────────────────────

export async function muzoTrending() {
  const { data } = await muzoFetch("/api/trending");
  return data?.data || data || {};
}

// ── Related ───────────────────────────────────────────────────────────────────

export async function muzoRelated(videoId) {
  const { data } = await muzoFetch(`/api/related/${videoId}`);
  return data?.data || [];
}

// ── Album & Playlist ──────────────────────────────────────────────────────────

export async function muzoAlbum(albumId) {
  const { data } = await muzoFetch(`/api/album/${albumId}`);
  return data?.album || data || null;
}

export async function muzoPlaylist(playlistId) {
  const { data } = await muzoFetch(`/api/playlist/${playlistId}`);
  return data?.playlist || data || null;
}

export async function muzoAlbumBrowse(browseId) {
  const { data } = await muzoFetch(`/api/albums/${browseId}`);
  return data || null;
}

// ── Charts & Moods ────────────────────────────────────────────────────────────

export async function muzoCharts(country = "IN") {
  const params = country ? `?country=${country}` : "";
  const { data } = await muzoFetch(`/api/charts${params}`);
  return data || null;
}

export async function muzoMoods() {
  const { data } = await muzoFetch("/api/moods");
  return data || [];
}

export async function muzoMoodPlaylists(categoryId) {
  const { data } = await muzoFetch(`/api/moods/${categoryId}`);
  return data || [];
}

// ── Artist ────────────────────────────────────────────────────────────────────

export async function muzoArtist(browseId) {
  const { data } = await muzoFetch(`/api/artists/${browseId}`);
  return data || null;
}

export async function muzoSongDetails(videoId) {
  const { data } = await muzoFetch(`/api/songs/${videoId}`);
  return data || null;
}

// ── Channel & Feed ────────────────────────────────────────────────────────────

export async function muzoChannelFeed(channelIds, preview = false) {
  const ids = Array.isArray(channelIds) ? channelIds.join(",") : channelIds;
  const params = new URLSearchParams({ channels: ids });
  if (preview) params.set("preview", "1");
  const { data } = await muzoFetch(`/api/feed/unauthenticated?${params}`);
  return Array.isArray(data) ? data : [];
}

export async function muzoChannel(channelId) {
  const { data } = await muzoFetch(`/api/yt_channel/${channelId}`);
  return data || null;
}

// ── Playlist song resolver ────────────────────────────────────────────────────

/**
 * Given a song from an imported playlist, find the best YouTube ID.
 * 1. If song.ytId or song.id is already a YouTube ID → use it
 * 2. Otherwise → search YouTube Music by name+artist
 */
export async function resolveYouTubeId(song) {
  // Already have a YT ID
  const ytIdRegex = /^[A-Za-z0-9_-]{11}$/;
  if (song.id && ytIdRegex.test(song.id)) return song.id;
  if (song.ytId && ytIdRegex.test(song.ytId)) return song.ytId;

  // Search YT Music
  const query = `${song.name} ${song.artist}`.trim();
  if (!query || query.length < 3) return null;
  const results = await muzoSearch(query, "songs", 3);
  const first   = results[0];
  return first?.videoId || first?.id || null;
}

/**
 * Get thumbnail for a song — prefers YouTube thumbnail, falls back to stored image.
 */
export function getSongThumbnail(song, ytId) {
  if (ytId) return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
  if (song.image) return song.image;
  if (song.thumbnail) return song.thumbnail;
  return null;
}
