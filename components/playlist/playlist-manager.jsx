"use client";
import { useState, useEffect, useRef } from "react";
import { useYT } from "@/hooks/use-youtube";
import { useMusicProvider } from "@/hooks/use-context";
import {
  Play, Pause, Trash2, Edit3, Plus, Check, X, Music2,
  Youtube, Search, ChevronDown, ChevronUp, MoreHorizontal,
  Download, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { muzoSearch, resolveYouTubeId, getSongThumbnail } from "@/lib/muzo";
import { getSongsByQuery } from "@/lib/fetch";

// ── Resolve a song to YT ID + thumbnail ──────────────────────────────────────
async function resolveSong(song) {
  const ytId = await resolveYouTubeId(song);
  const thumbnail = getSongThumbnail(song, ytId);
  return { ...song, ytId, thumbnail: thumbnail || song.thumbnail || song.image || null };
}

// ── Search for songs to add to playlist ──────────────────────────────────────
async function searchSongsToAdd(query) {
  try {
    // Search via Muzo (YouTube Music) first
    const muzoResults = await muzoSearch(query, "songs", 8);
    if (muzoResults.length) {
      return muzoResults.map(s => ({
        id:        s.videoId || s.id,
        ytId:      s.videoId || s.id,
        name:      s.title   || s.name,
        artist:    (s.artists || []).map(a => a.name || a).join(", ") || s.artist || "",
        thumbnail: s.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${s.videoId || s.id}/mqdefault.jpg`,
        source:    "youtube",
        duration:  s.duration || "",
      }));
    }
  } catch {}

  try {
    // Fallback to JioSaavn
    const res  = await getSongsByQuery(query, 1, 8);
    const data = await res?.json();
    return (data?.data?.results || []).map(s => ({
      id:       s.id,
      name:     s.name,
      artist:   s.artists?.primary?.[0]?.name || "",
      thumbnail: s.image?.[1]?.url || s.image?.[0]?.url || null,
      source:   "saavn",
    }));
  } catch {}

  return [];
}

// ── Single song row inside the playlist ──────────────────────────────────────
function SongRow({ song, index, isPlaying, onPlay, onRemove, onDragStart, onDragOver, onDrop }) {
  const [resolved, setResolved] = useState(song);
  const [resolving, setResolving] = useState(!song.ytId && !song.thumbnail);

  useEffect(() => {
    if (song.ytId || (song.id && /^[A-Za-z0-9_-]{11}$/.test(song.id))) {
      const ytId = song.ytId || song.id;
      setResolved({ ...song, ytId, thumbnail: getSongThumbnail(song, ytId) });
      setResolving(false);
      return;
    }
    if (song.name && song.name !== "Unknown") {
      resolveYouTubeId(song).then(ytId => {
        setResolved({ ...song, ytId, thumbnail: getSongThumbnail(song, ytId) });
        setResolving(false);
      });
    } else {
      setResolving(false);
    }
  }, [song.id, song.name, song.artist]);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => { e.preventDefault(); onDragOver(index); }}
      onDrop={() => onDrop(index)}
      className="flex items-center gap-3 p-2.5 rounded-xl group transition-all duration-200 cursor-pointer"
      style={{
        background: isPlaying ? "rgba(255,0,60,0.08)" : "rgba(18,18,32,0.5)",
        border:     isPlaying ? "1px solid rgba(255,0,60,0.2)" : "1px solid rgba(255,255,255,0.04)",
      }}
      onMouseEnter={e => { if (!isPlaying) { e.currentTarget.style.background = "rgba(28,28,48,0.8)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; } }}
      onMouseLeave={e => { if (!isPlaying) { e.currentTarget.style.background = "rgba(18,18,32,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; } }}
    >
      {/* Index / play indicator */}
      <div className="w-6 text-center flex-shrink-0">
        {isPlaying
          ? <div className="flex items-end justify-center gap-[2px] h-4">{[...Array(3)].map((_, i) => <div key={i} className="w-[2px] rounded-sm" style={{ background: "#FF003C", height: `${8 + i * 3}px`, animation: `bar${i+1} 0.6s ease-in-out ${i*0.1}s infinite alternate` }} />)}</div>
          : <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#666688", fontFamily: "Orbitron, sans-serif" }}>{index + 1}</span>}
      </div>

      {/* Thumbnail */}
      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => onPlay(resolved)}>
        {resolving
          ? <div className="remix-shimmer w-full h-full" />
          : resolved.thumbnail
            ? <img src={resolved.thumbnail} alt={resolved.name} className="w-full h-full object-cover" style={{ background: "rgba(18,18,32,0.8)" }} />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(18,18,32,0.8)" }}><Music2 className="w-4 h-4" style={{ color: "#44445a" }} /></div>
        }
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          <Play className="w-3.5 h-3.5 text-white" />
        </div>
        {/* YT/Saavn badge */}
        {resolved.ytId && (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-tl-sm flex items-center justify-center"
            style={{ background: "#FF0000" }}>
            <Youtube className="w-2 h-2 text-white" />
          </div>
        )}
      </div>

      {/* Song info */}
      <div className="flex-1 min-w-0" onClick={() => onPlay(resolved)}>
        <p className="text-sm font-semibold truncate leading-tight"
          style={{ color: isPlaying ? "#FF003C" : "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>
          {song.name || "Unknown"}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: "#666688" }}>
          {song.artist || ""}
          {song.duration ? ` · ${song.duration}` : ""}
        </p>
      </div>

      {/* Remove */}
      <button onClick={e => { e.stopPropagation(); onRemove(index); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ color: "#44445a" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; e.currentTarget.style.background = "rgba(255,0,60,0.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#44445a"; e.currentTarget.style.background = "transparent"; }}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <style>{`
        @keyframes bar1{from{height:4px}to{height:12px}}
        @keyframes bar2{from{height:8px}to{height:16px}}
        @keyframes bar3{from{height:6px}to{height:10px}}
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Main PlaylistManager
// ════════════════════════════════════════════════════════════════════════════
export default function PlaylistManager({ playlist, onUpdate, onDelete, onClose }) {
  const yt    = useYT() || {};
  const saavn = useMusicProvider() || {};

  const [songs,        setSongs]        = useState(playlist?.songs || []);
  const [playingIdx,   setPlayingIdx]   = useState(-1);
  const [editingName,  setEditingName]  = useState(false);
  const [name,         setName]         = useState(playlist?.name || "Playlist");
  const [showSearch,   setShowSearch]   = useState(false);
  const [searchQ,      setSearchQ]      = useState("");
  const [searchRes,    setSearchRes]    = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [dragFrom,     setDragFrom]     = useState(null);
  const [playingAll,   setPlayingAll]   = useState(false);
  const searchTimeout  = useRef(null);

  // ── Play a single song: YT first, Saavn fallback ─────────────────────────
  const playSong = async (song, idx) => {
    setPlayingIdx(idx);

    // If already has a YT ID
    const ytId = song.ytId || (/^[A-Za-z0-9_-]{11}$/.test(song.id || "") ? song.id : null);
    if (ytId) {
      yt.playVideo?.({
        id:           ytId,
        title:        song.name,
        channelTitle: song.artist,
        thumbnail:    song.thumbnail || getSongThumbnail(song, ytId),
      });
      toast(`▶ ${song.name}`);
      return;
    }

    // Resolve via Muzo
    try {
      const resolved = await resolveYouTubeId(song);
      if (resolved) {
        const thumb = getSongThumbnail(song, resolved);
        yt.playVideo?.({ id: resolved, title: song.name, channelTitle: song.artist, thumbnail: thumb });
        // Update song in list with resolved ID
        setSongs(prev => prev.map((s, i) => i === idx ? { ...s, ytId: resolved, thumbnail: thumb } : s));
        toast(`▶ ${song.name} (YouTube)`);
        return;
      }
    } catch {}

    // Saavn fallback
    try {
      const res  = await getSongsByQuery(`${song.name} ${song.artist}`, 1, 1);
      const data = await res?.json();
      const s    = data?.data?.results?.[0];
      if (s?.id) {
        saavn.playSong?.(s.id);
        toast(`▶ ${song.name} (Saavn)`);
        return;
      }
    } catch {}

    toast.error(`Couldn't play "${song.name}"`);
    setPlayingIdx(-1);
  };

  // ── Play all: resolve all YT IDs and queue ────────────────────────────────
  const playAll = async () => {
    if (!songs.length) return;
    setPlayingAll(true);
    toast("Resolving playlist… this may take a moment");

    // Resolve first song immediately
    await playSong(songs[0], 0);

    // Build YT queue from rest
    const queue = [];
    for (let i = 1; i < Math.min(songs.length, 30); i++) {
      const s    = songs[i];
      const ytId = s.ytId || (/^[A-Za-z0-9_-]{11}$/.test(s.id || "") ? s.id : null)
        || await resolveYouTubeId(s).catch(() => null);
      if (ytId) {
        queue.push({ id: ytId, title: s.name, channelTitle: s.artist, thumbnail: getSongThumbnail(s, ytId) });
      }
    }
    yt.setQueue?.(queue);
    setPlayingAll(false);
    toast.success(`Playing "${name}" — ${queue.length + 1} tracks`);
  };

  // ── Rename ────────────────────────────────────────────────────────────────
  const saveName = () => {
    if (!name.trim()) return;
    setEditingName(false);
    onUpdate?.({ ...playlist, name: name.trim(), songs });
    toast("Playlist renamed");
  };

  // ── Remove song ───────────────────────────────────────────────────────────
  const removeSong = (idx) => {
    const updated = songs.filter((_, i) => i !== idx);
    setSongs(updated);
    if (playingIdx === idx) setPlayingIdx(-1);
    onUpdate?.({ ...playlist, name, songs: updated });
    toast("Song removed");
  };

  // ── Drag reorder ──────────────────────────────────────────────────────────
  const handleDrop = (toIdx) => {
    if (dragFrom === null || dragFrom === toIdx) { setDragFrom(null); return; }
    const updated = [...songs];
    const [moved] = updated.splice(dragFrom, 1);
    updated.splice(toIdx, 0, moved);
    setSongs(updated);
    setDragFrom(null);
    onUpdate?.({ ...playlist, name, songs: updated });
  };

  // ── Search to add songs ───────────────────────────────────────────────────
  const handleSearchInput = (val) => {
    setSearchQ(val);
    clearTimeout(searchTimeout.current);
    if (!val.trim()) { setSearchRes([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchSongsToAdd(val);
      setSearchRes(results);
      setSearching(false);
    }, 400);
  };

  const addSong = (song) => {
    if (songs.find(s => s.id === song.id && s.name === song.name)) {
      toast("Already in playlist"); return;
    }
    const updated = [...songs, song];
    setSongs(updated);
    onUpdate?.({ ...playlist, name, songs: updated });
    toast(`Added "${song.name}"`);
  };

  // ── Delete playlist ───────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    onDelete?.(playlist.id);
    onClose?.();
    toast(`"${name}" deleted`);
  };

  const coverSong = songs.find(s => s.thumbnail || s.image);
  const coverImg  = coverSong?.thumbnail || coverSong?.image || null;

  return (
    <div className="flex flex-col h-full" style={{ color: "#e8e8f8" }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 p-5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-start gap-4">
          {/* Cover art */}
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative"
            style={{ background: "rgba(18,18,32,0.8)", boxShadow: "0 0 20px rgba(255,0,60,0.15)" }}>
            {coverImg
              ? <img src={coverImg} alt={name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Music2 className="w-7 h-7" style={{ color: "#44445a" }} /></div>}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name editor */}
            {editingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input autoFocus value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  className="flex-1 rounded-lg px-3 py-1.5 text-sm font-bold outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,0,60,0.4)", color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }} />
                <button onClick={saveName} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,0,60,0.15)", color: "#FF003C" }}><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => { setEditingName(false); setName(playlist?.name || "Playlist"); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "#44445a" }}><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-black truncate" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>{name}</h2>
                <button onClick={() => setEditingName(true)} className="flex-shrink-0 transition-colors" style={{ color: "#44445a" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#FF003C"} onMouseLeave={e => e.currentTarget.style.color = "#44445a"}>
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs" style={{ color: "#666688" }}>
              {songs.length} tracks
              {playlist?.source && <span style={{ color: "#9D4EDD" }}> · {playlist.source === "youtube" ? "YouTube" : playlist.source === "spotify" ? "Spotify" : "Imported"}</span>}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2.5">
              <button onClick={playAll} disabled={playingAll || !songs.length}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8B0000, #FF003C)", color: "white", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.06em", boxShadow: "0 0 14px rgba(255,0,60,0.3)" }}>
                <Play className="w-3 h-3" />
                {playingAll ? "Loading…" : "Play All"}
              </button>
              <button onClick={() => setShowSearch(s => !s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: showSearch ? "rgba(157,78,221,0.15)" : "rgba(255,255,255,0.05)",
                  border:     showSearch ? "1px solid rgba(157,78,221,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  color:      showSearch ? "#9D4EDD" : "#ccccee",
                  fontFamily: "Rajdhani, sans-serif",
                }}>
                <Plus className="w-3 h-3" /> Add Songs
              </button>
              <button onClick={handleDelete}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                style={{ color: "#44445a", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; e.currentTarget.style.background = "rgba(255,0,60,0.08)"; e.currentTarget.style.borderColor = "rgba(255,0,60,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#44445a"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Add songs search ─────────────────────────────────────────────── */}
        {showSearch && (
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#666688" }} />
              <input value={searchQ} onChange={e => handleSearchInput(e.target.value)}
                placeholder="Search songs to add…"
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(157,78,221,0.25)", color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(157,78,221,0.5)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(157,78,221,0.25)"; }} />
            </div>
            {searching && <p className="text-xs mt-2 text-center" style={{ color: "#666688" }}>Searching…</p>}
            {searchRes.length > 0 && (
              <div className="mt-2 space-y-1 max-h-52 overflow-y-auto">
                {searchRes.map((s, i) => (
                  <button key={i} onClick={() => addSong(s)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(157,78,221,0.08)"; e.currentTarget.style.borderColor = "rgba(157,78,221,0.15)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}>
                    {s.thumbnail
                      ? <img src={s.thumbnail} alt={s.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      : <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(18,18,32,0.8)" }}><Music2 className="w-3.5 h-3.5" style={{ color: "#44445a" }} /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>{s.name}</p>
                      <p className="text-[10px] truncate" style={{ color: "#666688" }}>{s.artist}</p>
                    </div>
                    <Plus className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9D4EDD" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Song list ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Music2 className="w-8 h-8 mb-2" style={{ color: "#44445a" }} />
            <p className="text-sm" style={{ color: "#8888aa" }}>No songs yet</p>
            <p className="text-xs mt-1" style={{ color: "#44445a" }}>Click "Add Songs" to search and add tracks</p>
          </div>
        ) : (
          songs.map((song, idx) => (
            <SongRow
              key={`${song.id}-${idx}`}
              song={song}
              index={idx}
              isPlaying={playingIdx === idx}
              onPlay={(resolved) => playSong(resolved, idx)}
              onRemove={removeSong}
              onDragStart={setDragFrom}
              onDragOver={() => {}}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>
    </div>
  );
}
