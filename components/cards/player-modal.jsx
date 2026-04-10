"use client";
/**
 * PlayerModal — full-screen player that slides up from the mini bar.
 * Reads entirely from MusicContext. No local audio state.
 */
import { useState, useEffect, useCallback } from "react";
import { useMusicProvider } from "@/hooks/use-context";
import { getSongsSuggestions } from "@/lib/fetch";
import {
  ChevronDown, Repeat, Repeat1, Volume2, VolumeX,
  Download, Share2, ListMusic, Heart,
} from "lucide-react";
import { IoPause, IoPlay, IoPlaySkipBack, IoPlaySkipForward } from "react-icons/io5";
import Link from "next/link";
import { toast } from "sonner";

export default function PlayerModal({ open, onClose }) {
  const {
    music, songData, playing,
    togglePlay, toggleLoop, isLooping,
    toggleMute, muted, volume, changeVolume,
    currentTime, duration, progress, formatTime, seek,
    queue, setQueue, recentlyPlayed, isLoading, audioURL,
    setMusic,
  } = useMusicProvider();

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSugg, setLoadingSugg]  = useState(false);
  const [activeTab, setActiveTab]       = useState("queue"); // queue | related | recent
  const [liked, setLiked]               = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const [dragProgress, setDragProgress] = useState(null);

  // Fetch suggestions when song changes
  useEffect(() => {
    if (!music) return;
    setSuggestions([]);
    setLoadingSugg(true);
    getSongsSuggestions(music, 20)
      .then(r => r.json())
      .then(d => {
        const songs = d?.data || [];
        setSuggestions(songs);
        // Auto-fill queue if empty
        if (songs.length > 0) {
          setQueue(prev => prev.length === 0 ? songs.slice(0, 10).map(s => s.id) : prev);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSugg(false));
  }, [music]);

  // Like state persisted in localStorage
  useEffect(() => {
    try {
      const likes = JSON.parse(localStorage.getItem("remix:likes") || "[]");
      setLiked(likes.includes(music));
    } catch {}
  }, [music]);

  const toggleLike = () => {
    try {
      const likes = JSON.parse(localStorage.getItem("remix:likes") || "[]");
      const next  = liked ? likes.filter(id => id !== music) : [...likes, music];
      localStorage.setItem("remix:likes", JSON.stringify(next));
      setLiked(!liked);
      toast(liked ? "Removed from Favourites" : "❤️ Added to Favourites");
    } catch {}
  };

  const handleShare = () => {
    try {
      navigator.share({ url: `${window.location.origin}/${music}` });
    } catch {
      navigator.clipboard?.writeText(`${window.location.origin}/${music}`);
      toast("Link copied!");
    }
  };

  const downloadSong = async () => {
    if (!audioURL) return;
    try {
      toast("Starting download…");
      const res   = await fetch(audioURL);
      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      a.href = url; a.download = `${songData?.name || "song"}.mp3`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch { toast.error("Download failed."); }
  };

  const playNext = () => {
    if (queue.length === 0 && suggestions.length > 0) {
      setMusic(suggestions[0].id);
    } else if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      setMusic(next);
    }
  };

  const playPrev = () => {
    if (currentTime > 3) { seek(0); return; }
    const recent = recentlyPlayed;
    if (recent.length > 1) setMusic(recent[1].id);
  };

  // Seek drag on progress bar
  const handleBarClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * (duration || 0));
  }, [seek, duration]);

  if (!open) return null;

  const coverImg  = songData?.image?.[2]?.url || songData?.image?.[1]?.url || "";
  const title     = songData?.name || "Loading…";
  const artist    = songData?.artists?.primary?.[0]?.name || "";
  const albumName = songData?.album?.name || "";

  const TABS = [
    { id: "queue",   label: "Queue",   icon: ListMusic },
    { id: "related", label: "Related" },
    { id: "recent",  label: "Recent" },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(30px)" }}
    >
      {/* Blurred cover bg */}
      {coverImg && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `url(${coverImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(60px) saturate(1.5)",
          }}
        />
      )}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)" }} />

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full px-6 pt-4 pb-6 overflow-hidden">

        {/* ── Top bar ───────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,0,60,0.1)", border: "1px solid rgba(255,0,60,0.2)", color: "#FF003C" }}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif" }}>
            Now Playing
          </p>
          <button
            onClick={toggleLike}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: liked ? "rgba(255,0,60,0.15)" : "rgba(255,255,255,0.05)",
              border:     liked ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color:      liked ? "#FF003C" : "#44445a",
            }}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* ── Album art ─────────────────────────────────── */}
        <div className="flex justify-center mb-6 flex-shrink-0">
          <div
            className="relative w-56 h-56 sm:w-64 sm:h-64"
            style={{ filter: playing ? "drop-shadow(0 0 30px rgba(255,0,60,0.45))" : "none", transition: "filter 0.5s" }}
          >
            <img
              src={coverImg}
              alt={title}
              className="w-full h-full rounded-2xl object-cover"
              style={{
                border: "2px solid rgba(255,0,60,0.2)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
              }}
            />
            {isLoading && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(255,0,60,0.8) rgba(255,0,60,0.2) rgba(255,0,60,0.2) rgba(255,0,60,0.2)" }} />
              </div>
            )}
          </div>
        </div>

        {/* ── Song info ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2
              className="text-xl font-black truncate leading-tight"
              style={{ color: "#f0f0ff", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.02em" }}
            >
              {title}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Link
                href={`/search/${encodeURIComponent(artist)}`}
                className="text-sm truncate transition-colors hover:text-hellfire"
                style={{ color: "#FF003C", fontFamily: "Rajdhani, sans-serif" }}
                onClick={onClose}
              >
                {artist}
              </Link>
              {albumName && (
                <><span style={{ color: "#44445a" }}>·</span>
                <span className="text-sm truncate" style={{ color: "#8888aa" }}>{albumName}</span></>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
            <button onClick={downloadSong} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ color: "#44445a", border: "1px solid rgba(255,255,255,0.06)" }} title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={handleShare} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ color: "#44445a", border: "1px solid rgba(255,255,255,0.06)" }} title="Share">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Seek bar ──────────────────────────────────── */}
        <div className="mb-3 flex-shrink-0">
          <div
            className="relative w-full h-1 rounded-full cursor-pointer group"
            style={{ background: "rgba(255,255,255,0.08)" }}
            onClick={handleBarClick}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{
                width: `${dragProgress !== null ? dragProgress : progress}%`,
                background: "linear-gradient(to right, #8B0000, #FF003C, #9D4EDD)",
                boxShadow: "0 0 8px rgba(255,0,60,0.6)",
                transition: isDragging ? "none" : "width 0.1s linear",
              }}
            />
            <div
              className="absolute top-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                left: `calc(${progress}% - 7px)`,
                transform: "translateY(-50%)",
                background: "#FF003C",
                boxShadow: "0 0 10px rgba(255,0,60,0.9)",
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", fontSize: "0.6rem" }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", fontSize: "0.6rem" }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* ── Playback controls ─────────────────────────── */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          {/* Loop */}
          <button
            onClick={toggleLoop}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              color:      isLooping ? "#FF003C" : "#44445a",
              background: isLooping ? "rgba(255,0,60,0.1)" : "transparent",
              border:     isLooping ? "1px solid rgba(255,0,60,0.25)" : "1px solid transparent",
            }}
          >
            {isLooping ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>

          {/* Prev */}
          <button
            onClick={playPrev}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ color: "#8888aa" }}
          >
            <IoPlaySkipBack className="w-5 h-5" />
          </button>

          {/* Play/Pause — big */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{
              background: "linear-gradient(135deg, #8B0000, #FF003C)",
              boxShadow:  playing
                ? "0 0 30px rgba(255,0,60,0.7), 0 0 60px rgba(255,0,60,0.3)"
                : "0 0 15px rgba(255,0,60,0.3)",
              transition: "box-shadow 0.3s ease",
            }}
          >
            {playing
              ? <IoPause className="w-7 h-7 text-white" />
              : <IoPlay  className="w-7 h-7 text-white ml-1" />}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ color: "#8888aa" }}
          >
            <IoPlaySkipForward className="w-5 h-5" />
          </button>

          {/* Mute */}
          <button
            onClick={toggleMute}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ color: muted ? "#44445a" : "#8888aa" }}
          >
            {muted || volume === 0
              ? <VolumeX className="w-4 h-4" />
              : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* ── Volume slider ─────────────────────────────── */}
        <div className="mb-5 flex-shrink-0">
          <div
            className="relative w-full h-1 rounded-full cursor-pointer"
            style={{ background: "rgba(255,255,255,0.08)" }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              changeVolume((e.clientX - rect.left) / rect.width);
            }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${(muted ? 0 : volume) * 100}%`,
                background: "linear-gradient(to right, #7C3AED, #9D4EDD)",
                boxShadow: "0 0 6px rgba(124,58,237,0.5)",
                transition: "width 0.1s",
              }}
            />
          </div>
        </div>

        {/* ── Queue / Related / Recent tabs ─────────────── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Tab bar */}
          <div className="flex gap-1 mb-3 flex-shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                style={{
                  fontFamily: "Orbitron, sans-serif",
                  fontSize:   "0.58rem",
                  background: activeTab === tab.id ? "rgba(255,0,60,0.15)" : "transparent",
                  border:     activeTab === tab.id ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  color:      activeTab === tab.id ? "#FF003C" : "#44445a",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content — scrollable */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">

            {/* Queue tab */}
            {activeTab === "queue" && (
              <>
                {queue.length === 0 && !loadingSugg && (
                  <p className="text-xs text-center py-8" style={{ color: "#44445a" }}>Queue is empty</p>
                )}
                {queue.map((id, i) => {
                  const sugg = suggestions.find(s => s.id === id);
                  if (!sugg) return null;
                  return (
                    <SongRow
                      key={id}
                      song={sugg}
                      index={i + 1}
                      onPlay={() => { setQueue(queue.slice(i + 1)); setMusic(id); }}
                      isCurrent={id === music}
                    />
                  );
                })}
              </>
            )}

            {/* Related tab */}
            {activeTab === "related" && (
              <>
                {loadingSugg && <ShimmerRows />}
                {!loadingSugg && suggestions.map(song => (
                  <SongRow
                    key={song.id}
                    song={song}
                    onPlay={() => setMusic(song.id)}
                    isCurrent={song.id === music}
                  />
                ))}
              </>
            )}

            {/* Recent tab */}
            {activeTab === "recent" && (
              <>
                {recentlyPlayed.length === 0 && (
                  <p className="text-xs text-center py-8" style={{ color: "#44445a" }}>Nothing played yet</p>
                )}
                {recentlyPlayed.slice(0, 20).map(({ id }) => {
                  const sugg = suggestions.find(s => s.id === id);
                  return (
                    <SongRow
                      key={id}
                      song={sugg || { id, name: id, artists: { primary: [{ name: "…" }] }, image: [] }}
                      onPlay={() => setMusic(id)}
                      isCurrent={id === music}
                    />
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SongRow({ song, index, onPlay, isCurrent }) {
  return (
    <button
      onClick={onPlay}
      className="w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all duration-200"
      style={{
        background:   isCurrent ? "rgba(255,0,60,0.1)"  : "rgba(18,18,32,0.5)",
        border:       isCurrent ? "1px solid rgba(255,0,60,0.25)" : "1px solid rgba(255,255,255,0.04)",
      }}
      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = "rgba(24,24,40,0.9)"; }}
      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "rgba(18,18,32,0.5)"; }}
    >
      {index !== undefined && (
        <span className="w-5 text-center text-xs flex-shrink-0" style={{ color: "#44445a", fontFamily: "Orbitron, sans-serif", fontSize: "0.6rem" }}>
          {isCurrent ? (
            <span style={{ color: "#FF003C" }}>▶</span>
          ) : index}
        </span>
      )}
      <img
        src={song?.image?.[1]?.url || song?.image?.[0]?.url || ""}
        alt={song?.name}
        className="w-8 h-8 rounded-md object-cover flex-shrink-0"
        style={{ background: "rgba(18,18,32,0.8)" }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: isCurrent ? "#FF003C" : "#ccccee", fontFamily: "Rajdhani, sans-serif" }}
        >
          {song?.name || ""}
        </p>
        <p className="text-xs truncate" style={{ color: "#8888aa" }}>
          {song?.artists?.primary?.[0]?.name || ""}
        </p>
      </div>
    </button>
  );
}

function ShimmerRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: "rgba(18,18,32,0.4)" }}>
          <div className="remix-shimmer w-8 h-8 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="remix-shimmer h-3 w-3/4 rounded" />
            <div className="remix-shimmer h-2.5 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}
