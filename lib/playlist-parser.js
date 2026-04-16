/**
 * lib/playlist-parser.js
 * Parses ANY playlist JSON format into a standard Arise song array.
 * Handles: YouTube scrape format, Saavn export, Spotify export, generic formats.
 */

/**
 * Extract YouTube video ID from a URL string
 */
function extractYtId(url) {
  if (!url) return null;
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * Normalise one song object from any known format into:
 * { id, name, artist, image, duration, source, url }
 */
export function normaliseSong(raw) {
  if (!raw || typeof raw !== "object") return null;

  // ── YouTube scrape format (from your exported JSON) ────────────────────────
  // Keys: "Title", "Channel name", "Thumbnail url", "Video url", "Duration in timestamp"
  if (raw["Video url"] || raw["Thumbnail url"] || raw["Channel name"]) {
    const url   = raw["Video url"] || "";
    const ytId  = extractYtId(url) || raw["Video ID"] || null;
    return {
      id:       ytId,
      name:     raw["Title"]        || raw["title"]        || "Unknown",
      artist:   raw["Channel name"] || raw["channel"]      || "",
      image:    raw["Thumbnail url"]|| raw["thumbnail"]    || null,
      duration: raw["Duration in timestamp"] || raw["Duration in seconds"]?.toString() || "",
      views:    raw["Views"]        || 0,
      source:   "youtube",
      url:      url,
      ytId,
    };
  }

  // ── Saavn / generic format ─────────────────────────────────────────────────
  // Keys: name/title/song, artist/artists/singers, id, image/thumbnail
  const id     = raw.id     || raw.videoId || raw.song_id || extractYtId(raw.url || raw.link || "") || null;
  const name   = raw.name   || raw.title   || raw.song    || raw.track_name || "Unknown";
  const artist = Array.isArray(raw.artists) ? raw.artists.join(", ")
               : (raw.artist || raw.artists || raw.singer || raw.channel || raw.channelTitle || "");
  const image  = raw.image  || raw.thumbnail || raw.cover || raw.artwork
               || raw["Thumbnail url"] || null;

  return { id, name, artist, image, duration: raw.duration || raw.durationText || "", source: "saavn", url: raw.url || "" };
}

/**
 * Parse a full playlist JSON (array or object with songs/tracks array).
 * Returns array of normalised song objects.
 */
export function parsePlaylistJSON(text, filename = "") {
  const raw = JSON.parse(text);

  // Could be: array directly, or object with .songs / .tracks / .items / .playlist
  let arr = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (Array.isArray(raw.songs))    { arr = raw.songs;    }
  else if (Array.isArray(raw.tracks))     { arr = raw.tracks;   }
  else if (Array.isArray(raw.items))      { arr = raw.items;    }
  else if (Array.isArray(raw.playlist))   { arr = raw.playlist; }
  else if (Array.isArray(raw.results))    { arr = raw.results;  }
  else { arr = [raw]; } // single song

  const songs = arr.map(normaliseSong).filter(Boolean);

  // Detect source from first item
  let source = "imported";
  if (arr[0]?.["Video url"] || arr[0]?.["Channel name"]) source = "youtube";
  else if (arr[0]?.source === "spotify" || arr[0]?.spotifyId) source = "spotify";

  // Playlist name: from JSON metadata or filename
  const playlistName = raw.name || raw.title || raw.playlistName
    || (filename ? filename.replace(/\.(json|m3u8?)$/i, "") : "Imported Playlist");

  return { songs, source, playlistName, total: songs.length };
}

/**
 * Parse M3U / M3U8 playlist
 */
export function parseM3U(text, filename = "") {
  const lines  = text.split(/\r?\n/);
  const songs  = [];
  let   pending = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "#EXTM3U") continue;

    if (trimmed.startsWith("#EXTINF:")) {
      // Format: #EXTINF:duration,Title - Artist
      const commaIdx = trimmed.indexOf(",");
      const meta     = commaIdx > -1 ? trimmed.slice(commaIdx + 1).trim() : "";
      const dashIdx  = meta.lastIndexOf(" - ");
      pending = {
        name:   dashIdx > -1 ? meta.slice(0, dashIdx).trim() : meta || "Unknown",
        artist: dashIdx > -1 ? meta.slice(dashIdx + 3).trim() : "",
        id:     null, image: null, source: "imported",
      };
    } else if (!trimmed.startsWith("#")) {
      // URL line
      const ytId = extractYtId(trimmed);
      const song = pending || { name: trimmed.split("/").pop() || "Unknown", artist: "", id: null, image: null, source: "imported" };
      if (ytId) { song.id = ytId; song.url = trimmed; song.source = "youtube"; }
      songs.push(song);
      pending = null;
    }
  }

  return {
    songs,
    source: "imported",
    playlistName: filename.replace(/\.(m3u8?)$/i, "") || "Imported Playlist",
    total: songs.length,
  };
}
