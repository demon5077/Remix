"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Music2, Youtube, PlayCircle, LogIn, Upload, X, RefreshCw,
  ListMusic, Plus, Search as SearchIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useYT } from "@/hooks/use-youtube";
import { useMusicProvider } from "@/hooks/use-context";
import PlaylistManager from "@/components/playlist/playlist-manager";
import { parsePlaylistJSON, parseM3U } from "@/lib/playlist-parser";
import {
  getSession, getGoogleProfile, getSpotifyProfile, getImportedPlaylists,
  addImportedPlaylist, fetchYTPlaylists, fetchYTPlaylistItems,
  fetchSpotifyPlaylists, fetchSpotifyTracks, isGoogleConnected, isSpotifyConnected,
  saveImportedPlaylists, removeImportedPlaylist,
} from "@/lib/session";
import { persistPlaylist, savePlaylistsToAccount } from "@/lib/arise-auth";

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text, filename = "") {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { songs: [], playlistName: filename.replace(/\.csv$/i, "") || "Imported Playlist" };
  const header = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());
  const songs = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].match(/("(?:[^"]|"")*"|[^,]*)/g)?.map(v => v.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) || [];
    if (!values.length) continue;
    const obj = {};
    header.forEach((h, idx) => { obj[h] = values[idx] || ""; });
    const name   = obj.title || obj.name || obj.song || obj["track name"] || obj.track || "";
    const artist  = obj.artist || obj.artists || obj.channel || obj["artist name"] || "";
    const ytIdRaw = obj.url || obj["video url"] || obj.link || obj.id || "";
    const ytIdMatch = ytIdRaw.match(/(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{11})/);
    const ytId    = ytIdMatch?.[1] || (/^[A-Za-z0-9_-]{11}$/.test(ytIdRaw.trim()) ? ytIdRaw.trim() : null);
    if (name) songs.push({ id: ytId, ytId, name, artist, image: obj.thumbnail || obj.image || null, source: ytId ? "youtube" : "imported" });
  }
  const playlistName = filename.replace(/\.csv$/i, "") || "Imported Playlist";
  return { songs, playlistName, total: songs.length, source: songs.some(s => s.ytId) ? "youtube" : "imported" };
}

export default function PlaylistsPage() {
  const yt    = useYT() || {};
  const saavn = useMusicProvider() || {};
  const router = useRouter();

  const [session,        setSession]        = useState(null);
  const [googleProfile,  setGoogleProfile]  = useState(null);
  const [spotifyProfile, setSpotifyProfile] = useState(null);
  const [ytPlaylists,    setYtPlaylists]    = useState([]);
  const [spotifyPls,     setSpotifyPls]     = useState([]);
  const [importedPls,    setImportedPls]    = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [activeSource,   setActiveSource]   = useState("all");
  const [loadingYT,      setLoadingYT]      = useState(false);
  const [loadingSP,      setLoadingSP]      = useState(false);
  const fileRef = useRef(null);

  // Load all state from localStorage on mount — no auth context needed
  useEffect(() => {
    const s  = getSession();
    const gp = getGoogleProfile();
    const sp = getSpotifyProfile();
    setSession(s);
    setGoogleProfile(gp);
    setSpotifyProfile(sp);
    setImportedPls(getImportedPlaylists());

    // Auto-fetch if connected
    if (isGoogleConnected()) loadYTPlaylists();
    if (isSpotifyConnected()) loadSpotifyPls();
  }, []);

  const loadYTPlaylists = async () => {
    setLoadingYT(true);
    const { playlists, error } = await fetchYTPlaylists();
    setLoadingYT(false);
    if (error) { toast.error(error); return; }
    setYtPlaylists(playlists);
    toast.success(`${playlists.length} YouTube playlists loaded`);
  };

  const loadSpotifyPls = async () => {
    setLoadingSP(true);
    const { playlists, error } = await fetchSpotifyPlaylists();
    setLoadingSP(false);
    if (error) { toast.error(error); return; }
    setSpotifyPls(playlists);
    toast.success(`${playlists.length} Spotify playlists loaded`);
  };

  // ── Open a playlist — fetch items for OAuth playlists ────────────────────
  const openPlaylist = async (playlist) => {
    // For imported/local playlists with inline songs
    if (playlist.songs?.length) {
      setActivePlaylist(playlist);
      return;
    }

    const loading = { ...playlist, songs: [], _loading: true };
    setActivePlaylist(loading);

    try {
      if (playlist.source === "youtube") {
        const { items, error } = await fetchYTPlaylistItems(playlist.id);
        if (error) { toast.error(error); return; }
        setActivePlaylist({ ...playlist, songs: items });
      } else if (playlist.source === "spotify") {
        const { items, error } = await fetchSpotifyTracks(playlist.id);
        if (error) { toast.error(error); return; }
        setActivePlaylist({ ...playlist, songs: items });
      }
    } catch (e) {
      toast.error("Failed to load playlist tracks");
    }
  };

  // ── Handle playlist update (from PlaylistManager) ─────────────────────────
  const handleUpdate = (updated) => {
    // Update imported playlists
    const existingImported = getImportedPlaylists();
    if (existingImported.find(p => p.id === updated.id)) {
      saveImportedPlaylists(existingImported.map(p => p.id === updated.id ? updated : p));
      setImportedPls(getImportedPlaylists());
    }
    setActivePlaylist(updated);
    // Persist to server
    const s = getSession();
    if (s?.id) persistPlaylist(s.id, updated).catch(() => {});
    toast("Playlist saved ✓");
  };

  // ── Handle playlist delete ────────────────────────────────────────────────
  const handleDelete = (playlistId) => {
    removeImportedPlaylist(playlistId);
    setImportedPls(getImportedPlaylists());
    setActivePlaylist(null);
    // Persist to server
    const s = getSession();
    if (s?.id) {
      const remaining = (s.playlists || []).filter(p => p.id !== playlistId);
      savePlaylistsToAccount({ userId: s.id, playlists: remaining }).catch(() => {});
    }
    toast("Playlist deleted");
  };

  // ── File import (JSON / M3U / CSV) ────────────────────────────────────────
  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target.result;
        let parsed;
        if (file.name.match(/\.csv$/i))       parsed = parseCSV(text, file.name);
        else if (file.name.match(/\.m3u8?$/i)) parsed = parseM3U(text, file.name);
        else                                   parsed = parsePlaylistJSON(text, file.name);

        if (!parsed.songs?.length) { toast.error("No songs found in file"); return; }

        const pl = {
          id:         Date.now().toString(),
          name:       parsed.playlistName,
          songs:      parsed.songs,
          count:      parsed.songs.length,
          source:     parsed.source || "imported",
          importedAt: Date.now(),
        };
        addImportedPlaylist(pl);
        setImportedPls(getImportedPlaylists());

        // Persist to server
        const s = getSession();
        if (s?.id) persistPlaylist(s.id, pl).catch(() => {});
        toast.success(`Imported "${pl.name}" — ${pl.songs.length} tracks ✓`);
      } catch (err) {
        toast.error(`Parse failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Build combined playlist list ─────────────────────────────────────────
  const allPlaylists = [
    ...ytPlaylists.map(p => ({ ...p, _type: "youtube" })),
    ...spotifyPls.map(p => ({ ...p, _type: "spotify" })),
    ...importedPls.map(p => ({ ...p, _type: "imported" })),
  ];
  const filtered = activeSource === "all"
    ? allPlaylists
    : allPlaylists.filter(p => p._type === activeSource || p.source === activeSource);

  const hasAny = isGoogleConnected() || isSpotifyConnected() || importedPls.length > 0 || session;
  const isLoggedIn = !!(session || googleProfile || spotifyProfile);

  // ── No auth at all ────────────────────────────────────────────────────────
  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-5 text-center">
        <LogIn className="w-12 h-12 mb-4" style={{ color: "#44445a" }} />
        <h2 className="text-xl font-black mb-2" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
          No playlists yet
        </h2>
        <p className="text-sm mb-6" style={{ color: "#8888aa" }}>
          Sign in or connect Google/Spotify to load your playlists, or import a local file.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/login"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #8B0000, #FF003C)", color: "white", fontFamily: "Orbitron, sans-serif", boxShadow: "0 0 20px rgba(255,0,60,0.3)" }}>
            Sign In
          </Link>
          <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
            style={{ background: "rgba(157,78,221,0.1)", border: "1px solid rgba(157,78,221,0.3)", color: "#9D4EDD", fontFamily: "Rajdhani, sans-serif" }}>
            <Upload className="w-4 h-4" /> Import File
            <input ref={fileRef} type="file" accept=".json,.m3u,.m3u8,.csv" className="hidden" onChange={handleFileImport} />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-8 min-h-screen" style={{ color: "#e8e8f8" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
            Playlists
          </h1>
          <p className="remix-section-title mt-1">{allPlaylists.length} total playlists</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isGoogleConnected() && (
            <button onClick={loadYTPlaylists} disabled={loadingYT}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: "rgba(66,133,244,0.12)", border: "1px solid rgba(66,133,244,0.25)", color: "#4285F4", fontFamily: "Rajdhani, sans-serif" }}>
              <RefreshCw className={`w-3.5 h-3.5 ${loadingYT ? "animate-spin" : ""}`} />
              {loadingYT ? "Loading…" : "Sync YouTube"}
            </button>
          )}
          {isSpotifyConnected() && (
            <button onClick={loadSpotifyPls} disabled={loadingSP}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: "rgba(29,185,84,0.12)", border: "1px solid rgba(29,185,84,0.25)", color: "#1DB954", fontFamily: "Rajdhani, sans-serif" }}>
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSP ? "animate-spin" : ""}`} />
              {loadingSP ? "Loading…" : "Sync Spotify"}
            </button>
          )}
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
            style={{ background: "rgba(157,78,221,0.1)", border: "1px solid rgba(157,78,221,0.25)", color: "#9D4EDD", fontFamily: "Rajdhani, sans-serif" }}>
            <Upload className="w-3.5 h-3.5" /> Import (.json/.m3u/.csv)
            <input type="file" accept=".json,.m3u,.m3u8,.csv" className="hidden" onChange={handleFileImport} />
          </label>
          {!isGoogleConnected() && !isSpotifyConnected() && (
            <Link href="/login"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: "rgba(255,0,60,0.08)", border: "1px solid rgba(255,0,60,0.2)", color: "#FF003C", fontFamily: "Rajdhani, sans-serif" }}>
              Connect Accounts
            </Link>
          )}
        </div>
      </div>

      {/* ── Source filter ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", "youtube", "spotify", "imported"].map(s => (
          <button key={s} onClick={() => setActiveSource(s)}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.06em",
              background: activeSource === s ? "rgba(255,0,60,0.15)" : "rgba(255,255,255,0.04)",
              border:     activeSource === s ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.06)",
              color:      activeSource === s ? "#FF003C" : "#ccccee",
            }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}{s !== "all" ? ` (${allPlaylists.filter(p => p._type === s || p.source === s).length})` : ` (${allPlaylists.length})`}
          </button>
        ))}
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="flex gap-5 flex-col lg:flex-row min-h-[500px]">

        {/* LEFT: Playlist list */}
        <div className="lg:w-[300px] flex-shrink-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 rounded-2xl text-center"
              style={{ background: "rgba(18,18,32,0.5)", border: "1px solid rgba(255,0,60,0.07)" }}>
              <ListMusic className="w-8 h-8 mb-2" style={{ color: "#44445a" }} />
              <p className="text-sm" style={{ color: "#8888aa" }}>
                {activeSource === "youtube" && !isGoogleConnected() ? "Connect Google to load YouTube playlists"
                : activeSource === "spotify" && !isSpotifyConnected() ? "Connect Spotify to load playlists"
                : "No playlists found"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {filtered.map(pl => {
                const isActive = activePlaylist?.id === pl.id;
                const srcColor = pl._type === "youtube" || pl.source === "youtube" ? "#4285F4"
                               : pl._type === "spotify" || pl.source === "spotify" ? "#1DB954" : "#9D4EDD";
                return (
                  <button key={pl.id} onClick={() => openPlaylist(pl)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: isActive ? "rgba(255,0,60,0.1)" : "rgba(18,18,32,0.7)",
                      border:     isActive ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.05)",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(28,28,48,0.9)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "rgba(18,18,32,0.7)"; }}>
                    {pl.thumbnail
                      ? <img src={pl.thumbnail} alt={pl.name || pl.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          style={{ background: "rgba(18,18,32,0.8)" }} />
                      : <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                          style={{ background: `${srcColor}18` }}>
                          <Music2 className="w-5 h-5" style={{ color: srcColor }} />
                        </div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate"
                        style={{ color: isActive ? "#FF003C" : "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>
                        {pl.name || pl.title || "Untitled"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#666688" }}>
                        {pl.count || pl.songs?.length || 0} tracks ·{" "}
                        <span style={{ color: srcColor }}>
                          {pl._type === "youtube" || pl.source === "youtube" ? "YouTube"
                          : pl._type === "spotify" || pl.source === "spotify" ? "Spotify" : "Imported"}
                        </span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Playlist Manager */}
        <div className="flex-1 min-w-0">
          {!activePlaylist ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-2xl"
              style={{ background: "rgba(18,18,32,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <PlayCircle className="w-10 h-10 mb-3" style={{ color: "#44445a" }} />
              <p className="text-sm" style={{ color: "#8888aa" }}>Select a playlist to manage it</p>
              <p className="text-xs mt-1" style={{ color: "#44445a" }}>Play, rename, delete, or add songs</p>
            </div>
          ) : activePlaylist._loading ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-2xl"
              style={{ background: "rgba(18,18,32,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <RefreshCw className="w-8 h-8 mb-3 animate-spin" style={{ color: "#FF003C" }} />
              <p className="text-sm" style={{ color: "#8888aa" }}>Loading playlist tracks…</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,10,20,0.85)", border: "1px solid rgba(255,0,60,0.08)", minHeight: "400px" }}>
              <PlaylistManager
                playlist={activePlaylist}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onClose={() => setActivePlaylist(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
