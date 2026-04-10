const api_url = process.env.NEXT_PUBLIC_API_URL;
if (!api_url) {
  throw new Error('Missing NEXT_PUBLIC_API_URL environment variable');
}

// ── Songs ──────────────────────────────────────────
export const getSongsByQuery = async (query, page = 1, limit = 20) => {
  try {
    return await fetch(`${api_url}search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  } catch (e) { console.error(e); }
};

export const getSongsById = async (id) => {
  try {
    return await fetch(`${api_url}songs/${id}`);
  } catch (e) { console.error(e); }
};

export const getSongsByIds = async (ids) => {
  try {
    return await fetch(`${api_url}songs?ids=${ids}`);
  } catch (e) { console.error(e); }
};

export const getSongsSuggestions = async (id, limit = 10) => {
  try {
    return await fetch(`${api_url}songs/${id}/suggestions?limit=${limit}`);
  } catch (e) { console.error(e); }
};

// ── Albums ─────────────────────────────────────────
export const searchAlbumByQuery = async (query, page = 1, limit = 20) => {
  try {
    return await fetch(`${api_url}search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  } catch (e) { console.error(e); }
};

export const getAlbumById = async (id) => {
  try {
    return await fetch(`${api_url}albums?id=${id}`);
  } catch (e) { console.error(e); }
};

// ── Artists ────────────────────────────────────────
export const searchArtistsByQuery = async (query, page = 1, limit = 20) => {
  try {
    return await fetch(`${api_url}search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  } catch (e) { console.error(e); }
};

export const getArtistById = async (id, page = 1, songCount = 10, albumCount = 10) => {
  try {
    return await fetch(`${api_url}artists/${id}?page=${page}&songCount=${songCount}&albumCount=${albumCount}`);
  } catch (e) { console.error(e); }
};

export const getArtistSongs = async (id, page = 1, sortBy = 'popularity', sortOrder = 'desc') => {
  try {
    return await fetch(`${api_url}artists/${id}/songs?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
  } catch (e) { console.error(e); }
};

export const getArtistAlbums = async (id, page = 1, sortBy = 'releaseDate', sortOrder = 'desc') => {
  try {
    return await fetch(`${api_url}artists/${id}/albums?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
  } catch (e) { console.error(e); }
};

// ── Playlists ──────────────────────────────────────
export const getPlaylistById = async (id, page = 1, limit = 50) => {
  try {
    return await fetch(`${api_url}playlists?id=${id}&page=${page}&limit=${limit}`);
  } catch (e) { console.error(e); }
};

export const searchPlaylistsByQuery = async (query, page = 1, limit = 20) => {
  try {
    return await fetch(`${api_url}search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  } catch (e) { console.error(e); }
};

// ── Global Search ──────────────────────────────────
export const globalSearch = async (query) => {
  try {
    return await fetch(`${api_url}search?query=${encodeURIComponent(query)}`);
  } catch (e) { console.error(e); }
};
