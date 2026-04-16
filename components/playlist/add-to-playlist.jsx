"use client";
import { useState, useEffect, useRef } from "react";
import { ListMusic, Plus, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { getSession, saveSession, persistPlaylist } from "@/lib/arise-auth";

// ── Get all playlists from localStorage + session ────────────────────────────
function getAllPlaylists() {
  try {
    const session   = getSession();
    const imported  = JSON.parse(localStorage.getItem("arise:imported-playlists") || "[]");
    const userPls   = session?.playlists || [];
    // Merge, deduplicate by id
    const map = new Map();
    [...userPls, ...imported].forEach(p => { if (p?.id) map.set(p.id, p); });
    return [...map.values()];
  } catch { return []; }
}

function saveSongToPlaylist(playlistId, song) {
  try {
    // Update localStorage
    const imported = JSON.parse(localStorage.getItem("arise:imported-playlists") || "[]");
    const session  = getSession();
    const userPls  = session?.playlists || [];

    // Find in either store
    let found = false;
    const updatedImported = imported.map(pl => {
      if (pl.id !== playlistId) return pl;
      found = true;
      const already = pl.songs?.some(s => s.name === song.name && s.artist === song.artist);
      if (already) return pl;
      return { ...pl, songs: [...(pl.songs || []), song], count: (pl.count || 0) + 1 };
    });
    if (!found) {
      // Try session playlists
      const updatedUser = userPls.map(pl => {
        if (pl.id !== playlistId) return pl;
        const already = pl.songs?.some(s => s.name === song.name && s.artist === song.artist);
        if (already) return pl;
        return { ...pl, songs: [...(pl.songs || []), song], count: (pl.count || 0) + 1 };
      });
      saveSession({ ...session, playlists: updatedUser });
      // Persist to server
      const pl = updatedUser.find(p => p.id === playlistId);
      if (pl && session?.id) persistPlaylist(session.id, pl).catch(() => {});
    } else {
      localStorage.setItem("arise:imported-playlists", JSON.stringify(updatedImported));
      const pl = updatedImported.find(p => p.id === playlistId);
      if (pl && session?.id) persistPlaylist(session.id, pl).catch(() => {});
    }
    return true;
  } catch { return false; }
}

// ════════════════════════════════════════════════════════════════════════════
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
      id:        song.id || song.videoId || null,
      ytId:      song.ytId || song.videoId || null,
      name:      song.name || song.title || "Unknown",
      artist:    song.artist || song.artists || "",
      image:     song.image || song.thumbnail || null,
      thumbnail: song.thumbnail || song.image || null,
      duration:  song.duration || "",
      source:    song.source || "saavn",
    };
    const ok = saveSongToPlaylist(pl.id, songToAdd);
    if (ok) toast.success(`Added to "${pl.name}"`);
    else    toast.error("Song already in playlist");
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
    // Save to localStorage
    const existing = (() => { try { return JSON.parse(localStorage.getItem("arise:imported-playlists") || "[]"); } catch { return []; } })();
    localStorage.setItem("arise:imported-playlists", JSON.stringify([newPl, ...existing]));
    if (session?.id) {
      const updated = [newPl, ...(session.playlists || [])];
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
          color:      open ? "#9D4EDD" : "#44445a",
          background: open ? "rgba(157,78,221,0.12)" : "transparent",
          border:     open ? "1px solid rgba(157,78,221,0.3)" : "1px solid rgba(255,255,255,0.06)",
        }}
        title="Add to playlist"
      >
        <ListMusic className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-52 rounded-2xl overflow-hidden z-50"
          style={{ background: "rgba(12,12,22,0.98)", border: "1px solid rgba(157,78,221,0.2)", boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(157,78,221,0.08)", backdropFilter: "blur(20px)" }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "#666688", fontFamily: "Orbitron, sans-serif" }}>
              Add to Playlist
            </p>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {playlists.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "#44445a" }}>No playlists yet</p>
            ) : (
              playlists.map(pl => (
                <button key={pl.id} onClick={() => addToPlaylist(pl)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all"
                  style={{ color: "#ccccee" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(157,78,221,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: "rgba(18,18,32,0.8)" }}>
                    {pl.songs?.[0]?.thumbnail || pl.songs?.[0]?.image
                      ? <img src={pl.songs[0].thumbnail || pl.songs[0].image} alt="" className="w-full h-full object-cover" />
                      : <ListMusic className="w-3.5 h-3.5" style={{ color: "#44445a" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ fontFamily: "Rajdhani, sans-serif" }}>{pl.name}</p>
                    <p className="text-[10px]" style={{ color: "#44445a" }}>{pl.count || pl.songs?.length || 0} tracks</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Create new playlist */}
          <div className="border-t p-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {creating ? (
              <div className="flex items-center gap-1.5">
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") createAndAdd(); if (e.key === "Escape") setCreating(false); }}
                  placeholder="Playlist name…"
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(157,78,221,0.3)", color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }} />
                <button onClick={createAndAdd} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(157,78,221,0.15)", color: "#9D4EDD" }}><Check className="w-3 h-3" /></button>
                <button onClick={() => setCreating(false)} style={{ color: "#44445a" }}><ChevronDown className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{ color: "#9D4EDD", fontFamily: "Rajdhani, sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(157,78,221,0.08)"; }}
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
