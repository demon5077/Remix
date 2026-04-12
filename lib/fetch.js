/**
 * lib/fetch.js — JioSaavn API wrapper.
 * API URL: process.env.NEXT_PUBLIC_API_URL (defaults to saavn.sumit.co fallback)
 * Never throws at module load — only logs warnings.
 */

function getApiUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL || "https://saavn.sumit.co/api/";
  // Ensure trailing slash
  return url.endsWith("/") ? url : url + "/";
}

async function apiFetch(path) {
  const url = getApiUrl() + path;
  try {
    const res = await fetch(url, { cache: "no-store" });
    return res;
  } catch (e) {
    console.error("[fetch.js] API error:", e);
    return null;
  }
}

// ── Songs ──────────────────────────────────────────────────────────────────────
export const getSongsByQuery = (query, page = 1, limit = 20) =>
  apiFetch(`search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);

export const getSongsById = (id) =>
  apiFetch(`songs/${id}`);

export const getSongsByIds = (ids) =>
  apiFetch(`songs?ids=${ids}`);

export const getSongsSuggestions = (id, limit = 10) =>
  apiFetch(`songs/${id}/suggestions?limit=${limit}`);

// ── Albums ─────────────────────────────────────────────────────────────────────
export const searchAlbumByQuery = (query, page = 1, limit = 20) =>
  apiFetch(`search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);

export const getAlbumById = (id) =>
  apiFetch(`albums?id=${id}`);

// ── Artists ────────────────────────────────────────────────────────────────────
export const searchArtistsByQuery = (query, page = 1, limit = 20) =>
  apiFetch(`search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);

export const getArtistById = (id, page = 1, songCount = 10, albumCount = 10) =>
  apiFetch(`artists/${id}?page=${page}&songCount=${songCount}&albumCount=${albumCount}`);

export const getArtistSongs = (id, page = 1, sortBy = "popularity", sortOrder = "desc") =>
  apiFetch(`artists/${id}/songs?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`);

export const getArtistAlbums = (id, page = 1, sortBy = "popularity", sortOrder = "desc") =>
  apiFetch(`artists/${id}/albums?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`);

// ── Playlists ──────────────────────────────────────────────────────────────────
export const searchPlaylistsByQuery = (query, page = 1, limit = 20) =>
  apiFetch(`search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);

export const getPlaylistById = (id) =>
  apiFetch(`playlists?id=${id}`);

// ── Global search ──────────────────────────────────────────────────────────────
export const searchGlobal = (query) =>
  apiFetch(`search?query=${encodeURIComponent(query)}`);
