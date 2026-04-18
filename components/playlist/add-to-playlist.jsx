"use client";
import { useState, useEffect, useRef } from "react";
import { ListMusic, Plus, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { getSession, saveSession, getImportedPlaylists, saveImportedPlaylists } from "@/lib/session";
import { persistPlaylist } from "@/lib/arise-auth";

// Get ALL playlists from both stores, deduped
function getAllPlaylists() {
  try {
    const session   = getSession();
    const imported  = getImportedPlaylists();
    const userPls   = session?.playlists || [];
    const map = new Map();
    [...userPls, ...imported].forEach(p => { if (p?.id) map.set(p.id, p); });
    return [...map.values()];
  } catch { return []; }
}

// Save a song to a playlist in the right store
function saveSongToPlaylist(playlistId, song) {
  try {
    const session  = getSession();
    const imported = getImportedPlaylists();

    // Check imported first
    const impIdx = imported.findIndex(p => p.id === playlistId);
    if (impIdx !== -1) {
      const pl  = imported[impIdx];
      const already = (pl.songs||[]).some(s =>
        (s.name === song.name && s.artist === song.artist) ||
        (s.id && s.id === song.id)
      );
      if (already) return "duplicate";
      const updated = { ...pl, songs: [...(pl.songs||[]), song], count: (pl.count||0)+1 };
      imported[impIdx] = updated;
      saveImportedPlaylists(imported);
      // Also update server
      if (session?.id) persistPlaylist(session.id, updated).catch(() => {});
      return "ok";
    }

    // Check session playlists
    if (session?.playlists) {
      const idx = session.playlists.findIndex(p => p.id === playlistId);
      if (idx !== -1) {
        const pl    = session.playlists[idx];
        const already = (pl.songs||[]).some(s =>
          (s.name === song.name && s.artist === song.artist) ||
          (s.id && s.id === song.id)
        );
        if (already) return "duplicate";
        const updated = { ...pl, songs: [...(pl.songs||[]), song], count: (pl.count||0)+1 };
        const newPls  = [...session.playlists];
        newPls[idx]   = updated;
        saveSession({ ...session, playlists: newPls });
        if (session?.id) persistPlaylist(session.id, updated).catch(() => {});
        return "ok";
      }
    }
    return "not_found";
  } catch (e) { return "error"; }
}

export default function AddToPlaylist({ song, size = "sm" }) {
  const [open,      setOpen]      = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [creating,  setCreating]  = useState(false);
  const [newName,   setNewName]   = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (open) setPlaylists(getAllPlaylists());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const addToPlaylist = (pl) => {
    const songToAdd = {
      id:        song.id    || song.videoId || null,
      ytId:      song.ytId  || song.videoId || (song.id && /^[A-Za-z0-9_-]{11}$/.test(song.id) ? song.id : null),
      name:      song.name  || song.title   || "Unknown",
      artist:    song.artist|| (Array.isArray(song.artists) ? song.artists.map(a=>a.name||a).join(", ") : song.artists) || "",
      image:     song.image || song.thumbnail || null,
      thumbnail: song.thumbnail || song.image || null,
      duration:  song.duration || "",
      source:    song.source || "saavn",
    };
    // Resolve thumbnail from ytId
    if (!songToAdd.thumbnail && songToAdd.ytId) {
      songToAdd.thumbnail = `https://i.ytimg.com/vi/${songToAdd.ytId}/mqdefault.jpg`;
      songToAdd.image     = songToAdd.thumbnail;
    }

    const result = saveSongToPlaylist(pl.id, songToAdd);
    if (result === "duplicate") toast("Already in this playlist");
    else if (result === "ok")   toast.success(`Added to "${pl.name || pl.title}"`);
    else toast.error("Could not add to playlist");
    setOpen(false);
  };

  const createAndAdd = () => {
    if (!newName.trim()) return;
    const session = getSession();
    const newPl = {
      id:         Date.now().toString(),
      name:       newName.trim(),
      songs:      [],
      count:      0,
      source:     "local",
      importedAt: Date.now(),
    };
    const existing = getImportedPlaylists();
    saveImportedPlaylists([newPl, ...existing]);
    if (session?.id) {
      const updated = [newPl, ...(session.playlists||[])];
      saveSession({ ...session, playlists: updated });
      persistPlaylist(session.id, newPl).catch(() => {});
    }
    addToPlaylist(newPl);
    setCreating(false);
    setNewName("");
  };

  const dim = size === "sm" ? "w-7 h-7" : "w-9 h-9";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={`${dim} rounded-full flex items-center justify-center transition-all duration-200`}
        style={{
          color:      open ? "var(--accent-2)" : "var(--text-faint)",
          background: open ? `color-mix(in srgb, var(--accent-2) 12%, transparent)` : "transparent",
          border:     open ? "1px solid color-mix(in srgb, var(--accent-2) 30%, transparent)" : "1px solid var(--border-subtle)",
        }}
        title="Add to playlist">
        <ListMusic className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 rounded-2xl overflow-hidden z-50"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)", boxShadow: "0 8px 40px rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}
          onClick={e => e.stopPropagation()}>
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--text-muted)", fontFamily: "Orbitron, sans-serif" }}>Add to Playlist</p>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {playlists.length === 0
              ? <p className="text-xs text-center py-4" style={{ color: "var(--text-faint)" }}>No playlists yet</p>
              : playlists.map(pl => (
                <button key={pl.id} onClick={() => addToPlaylist(pl)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: "var(--bg-card)" }}>
                    {pl.songs?.[0]?.thumbnail || pl.songs?.[0]?.image
                      ? <img src={pl.songs[0].thumbnail || pl.songs[0].image} alt="" className="w-full h-full object-cover" />
                      : <ListMusic className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ fontFamily: "Rajdhani, sans-serif", color: "var(--text-primary)" }}>{pl.name || pl.title}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{pl.count || pl.songs?.length || 0} tracks</p>
                  </div>
                </button>
              ))}
          </div>
          <div className="p-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            {creating ? (
              <div className="flex items-center gap-1.5">
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") createAndAdd(); if (e.key === "Escape") setCreating(false); }}
                  placeholder="Playlist name…"
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }} />
                <button onClick={createAndAdd}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "color-mix(in srgb, var(--accent-2) 15%, transparent)", color: "var(--accent-2)" }}>
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setCreating(false)} style={{ color: "var(--text-faint)" }}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{ color: "var(--accent-2)", fontFamily: "Rajdhani, sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <Plus className="w-3.5 h-3.5" /> New Playlist
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
