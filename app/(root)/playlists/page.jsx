"use client";
export const dynamic = "force-dynamic";

import { useAuth } from "@/hooks/use-auth";
import { useYT } from "@/hooks/use-youtube";
import { useMusicProvider } from "@/hooks/use-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Music2, Youtube, PlayCircle, Import, LogIn, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import PlaylistManager from "@/components/playlist/playlist-manager";
import { getSession, saveSession, persistPlaylist } from "@/lib/arise-auth";

export default function PlaylistsPage() {
  const auth   = useAuth();
  const yt     = useYT() || {};
  const saavn  = useMusicProvider() || {};
  const router = useRouter();

  const [activePlaylist, setActivePlaylist] = useState(null);
  const [tracks,         setTracks]         = useState([]);
  const [loadingTracks,  setLoadingTracks]  = useState(false);
  const [activeSource,   setActiveSource]   = useState("all");
  const [importedPls,    setImportedPls]    = useState([]);

  useEffect(() => {
    if (auth.googleUser)  auth.importGooglePlaylists();
    if (auth.spotifyUser) auth.importSpotifyPlaylists();
    // Load imported playlists from localStorage
    try {
      const imp = JSON.parse(localStorage.getItem("arise:imported-playlists") || "[]");
      setImportedPls(imp);
    } catch {}
  }, [auth.googleUser, auth.spotifyUser]);

  const openPlaylist = async (playlist) => {
    setActivePlaylist(playlist);
    setTracks([]);
    setLoadingTracks(true);
    try {
      if (playlist.source === "imported") {
        // Imported playlists store songs inline
        setTracks(playlist.songs || []);
        setLoadingTracks(false);
        return;
      }
      if (playlist.source === "youtube") {
        const items = await auth.getYouTubePlaylistTracks(playlist.id);
        setTracks(items.filter(t => t.id));
      } else {
        const items = await auth.getSpotifyPlaylistTracks(playlist.id);
        setTracks(items);
      }
    } catch (e) { toast.error("Failed to load tracks"); }
    finally { setLoadingTracks(false); }
  };

  const playYouTubeTrack = (track) => {
    if (!track.id) return;
    yt.playVideo({ id: track.id, title: track.title, thumbnail: track.thumbnail, channelTitle: track.channelTitle });
    toast(`🔴 Playing: ${track.title?.slice(0,40)}`);
  };

  const playSpotifyOnSaavn = async (track) => {
    // Search JioSaavn for the same song and play
    const { getSongsByQuery } = await import("@/lib/fetch");
    const q = `${track.name} ${track.artists}`;
    toast("Searching JioSaavn for this track…");
    const res  = await getSongsByQuery(q, 1, 1);
    const data = await res.json();
    const song = data?.data?.results?.[0];
    if (song) {
      saavn.playSong(song.id);
      toast.success(`Playing: ${song.name}`);
    } else {
      toast.error("Not found on JioSaavn");
    }
  };

  // Merge OAuth playlists + locally imported playlists
  const importedForDisplay = importedPls.map(p => ({ ...p, source: "imported" }));
  const allCombined = [...(auth.allPlaylists || []), ...importedForDisplay];
  const filtered = allCombined.filter(p =>
    activeSource === "all" || p.source === activeSource
  );

  if (!auth.isLoggedIn && importedPls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-5 text-center">
        <LogIn className="w-12 h-12 mb-4" style={{ color: "#44445a" }} />
        <h2 className="text-xl font-black mb-2" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
          No Soul Connected
        </h2>
        <p className="text-sm mb-6" style={{ color: "#8888aa" }}>
          Login with Google or Spotify to import your playlists from the mortal realm.
        </p>
        <button onClick={() => router.push("/login")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{
            background:  "linear-gradient(135deg, #8B0000, #FF003C)",
            color:       "white",
            fontFamily:  "Orbitron, sans-serif",
            letterSpacing: "0.08em",
            boxShadow:   "0 0 20px rgba(255,0,60,0.35)",
          }}>
          <LogIn className="w-4 h-4" /> ENTER THE GATE
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
            Your Playlists
          </h1>
          <p className="remix-section-title mt-1">Grimoires imported from your connected realms</p>
        </div>
        <div className="flex gap-2">
          {auth.googleUser && (
            <button onClick={auth.importGooglePlaylists} disabled={auth.importing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background:  "rgba(66,133,244,0.12)",
                border:      "1px solid rgba(66,133,244,0.25)",
                color:       "#4285F4",
                fontFamily:  "Rajdhani, sans-serif",
              }}>
              <Youtube className="w-3.5 h-3.5" />
              {auth.importing ? "Importing…" : "Sync YouTube"}
            </button>
          )}
          {auth.spotifyUser && (
            <button onClick={auth.importSpotifyPlaylists} disabled={auth.importing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: "rgba(29,185,84,0.12)",
                border:     "1px solid rgba(29,185,84,0.25)",
                color:      "#1DB954",
                fontFamily: "Rajdhani, sans-serif",
              }}>
              <Import className="w-3.5 h-3.5" />
              {auth.importing ? "Importing…" : "Sync Spotify"}
            </button>
          )}
          <button onClick={() => router.push("/login")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: "rgba(255,0,60,0.08)", border: "1px solid rgba(255,0,60,0.2)", color: "#FF003C", fontFamily: "Rajdhani, sans-serif" }}>
            Manage Accounts
          </button>
        </div>
      </div>

      {/* Source filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all","youtube","spotify","imported"].map(s => (
          <button key={s} onClick={() => setActiveSource(s)}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              fontFamily:  "Rajdhani, sans-serif", letterSpacing: "0.06em",
              background:  activeSource === s ? "rgba(255,0,60,0.15)" : "rgba(18,18,32,0.8)",
              border:      activeSource === s ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.06)",
              color:       activeSource === s ? "#FF003C" : "#8888aa",
            }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Playlist grid */}
        <div className="lg:w-[360px] flex-shrink-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 rounded-2xl"
              style={{ background: "rgba(18,18,32,0.5)", border: "1px solid rgba(255,0,60,0.07)" }}>
              <p className="text-sm" style={{ color: "#44445a" }}>No playlists found — sync above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {filtered.map(pl => (
                <button key={pl.id} onClick={() => openPlaylist(pl)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200"
                  style={{
                    background: activePlaylist?.id === pl.id ? "rgba(255,0,60,0.1)" : "rgba(18,18,32,0.7)",
                    border:     activePlaylist?.id === pl.id ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.05)",
                  }}
                  onMouseEnter={e => { if (activePlaylist?.id !== pl.id) e.currentTarget.style.background = "rgba(24,24,40,0.9)"; }}
                  onMouseLeave={e => { if (activePlaylist?.id !== pl.id) e.currentTarget.style.background = "rgba(18,18,32,0.7)"; }}>
                  {pl.thumbnail ? (
                    <img src={pl.thumbnail} alt={pl.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      style={{ background: "rgba(18,18,32,0.8)" }} />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ background: pl.source === "youtube" ? "rgba(66,133,244,0.15)" : "rgba(29,185,84,0.15)" }}>
                      {pl.source === "youtube"
                        ? <Youtube className="w-5 h-5" style={{ color: "#4285F4" }} />
                        : <Music2  className="w-5 h-5" style={{ color: "#1DB954" }} />}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>
                      {pl.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8888aa" }}>
                      {pl.count} tracks · {pl.source === "youtube" ? "YouTube" : "Spotify"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Track list / Manager */}
        <div className="flex-1 min-w-0 min-h-0">
          {!activePlaylist ? (
            <div className="flex flex-col items-center justify-center h-48 rounded-2xl"
              style={{ background: "rgba(18,18,32,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <PlayCircle className="w-10 h-10 mb-3" style={{ color: "#44445a" }} />
              <p className="text-sm" style={{ color: "#8888aa" }}>Select a playlist to view and manage its tracks</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden h-full"
              style={{ background: "rgba(10,10,20,0.8)", border: "1px solid rgba(255,0,60,0.08)" }}>
              <PlaylistManager
                playlist={activePlaylist}
                onUpdate={(updated) => {
                  // Update in all stores
                  setActivePlaylist(updated);
                  setImportedPls(prev => prev.map(p => p.id === updated.id ? updated : p));
                  const existing = (() => { try { return JSON.parse(localStorage.getItem("arise:imported-playlists") || "[]"); } catch { return []; } })();
                  const wasImported = existing.find(p => p.id === updated.id);
                  if (wasImported) {
                    localStorage.setItem("arise:imported-playlists", JSON.stringify(existing.map(p => p.id === updated.id ? updated : p)));
                  }
                  const session = getSession();
                  if (session?.id) {
                    const updatedUser = (session.playlists || []).map(p => p.id === updated.id ? updated : p);
                    saveSession({ ...session, playlists: updatedUser });
                    persistPlaylist(session.id, updated).catch(() => {});
                  }
                  toast("Playlist saved ✓");
                }}
                onDelete={(playlistId) => {
                  setActivePlaylist(null);
                  setImportedPls(prev => prev.filter(p => p.id !== playlistId));
                  const existing = (() => { try { return JSON.parse(localStorage.getItem("arise:imported-playlists") || "[]"); } catch { return []; } })();
                  localStorage.setItem("arise:imported-playlists", JSON.stringify(existing.filter(p => p.id !== playlistId)));
                  const session = getSession();
                  if (session?.id) {
                    const updatedUser = (session.playlists || []).filter(p => p.id !== playlistId);
                    saveSession({ ...session, playlists: updatedUser });
                    import("@/lib/arise-auth").then(({ savePlaylistsToAccount }) => {
                      savePlaylistsToAccount({ userId: session.id, playlists: updatedUser }).catch(() => {});
                    });
                  }
                }}
                onClose={() => setActivePlaylist(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
