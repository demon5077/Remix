"use client";
/**
 * PlayerModal — full-screen player slide-up.
 * 100% reads from MusicContext. No local audio.
 */
import { useState, useEffect, useCallback } from "react";
import { useMusicProvider } from "@/hooks/use-context";
import { getSongsSuggestions } from "@/lib/fetch";
import {
  ChevronDown, Repeat, Repeat1, Volume2, VolumeX,
  Download, Share2, Heart, X, Plus,
} from "lucide-react";
import { IoPause, IoPlay, IoPlaySkipBack, IoPlaySkipForward } from "react-icons/io5";
import Link from "next/link";
import { toast } from "sonner";

export default function PlayerModal({ open, onClose }) {
  const {
    music, songData, playing, audioURL,
    togglePlay, toggleLoop, isLooping,
    toggleMute, muted, volume, changeVolume,
    currentTime, duration, progress, formatTime, seek,
    queue, setQueue, recentlyPlayed, isLoading,
    playSong,
  } = useMusicProvider();

  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [activeTab,   setActiveTab]   = useState("queue");
  const [liked,       setLiked]       = useState(false);

  // Load suggestions when song changes
  useEffect(() => {
    if (!music) return;
    setSuggestions([]);
    setLoading(true);
    getSongsSuggestions(music, 20)
      .then(r => r.json())
      .then(d => {
        const songs = d?.data || [];
        setSuggestions(songs);
        // Auto-seed queue if empty — store full song objects
        setQueue(prev =>
          prev.length === 0
            ? songs.slice(0, 10)
            : prev
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [music]);

  // Sync liked state
  useEffect(() => {
    if (!music) return;
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

  const playNext = () => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      // queue items are full song objects from suggestions
      const id = next?.id || next;
      playSong(id);
    } else if (suggestions.length > 0) {
      playSong(suggestions[0].id);
    }
  };

  const playPrev = () => {
    if (currentTime > 3) { seek(0); return; }
    if (recentlyPlayed.length > 1) playSong(recentlyPlayed[1].id);
  };

  const handleBarClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * (duration || 0));
  }, [seek, duration]);

  const downloadSong = async () => {
    if (!audioURL) return;
    try {
      toast("Starting download…");
      const res  = await fetch(audioURL);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), {
        href: url, download: `${songData?.name || "song"}.mp3`,
      });
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch { toast.error("Download failed."); }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/${music}`;
    navigator.share?.({ url }) ?? navigator.clipboard?.writeText(url);
    toast("Link copied!");
  };

  if (!open) return null;

  const coverImg  = songData?.image?.[2]?.url || songData?.image?.[1]?.url || "";
  const title     = songData?.name || "";
  const artist    = songData?.artists?.primary?.[0]?.name || "";
  const albumName = songData?.album?.name || "";

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "rgba(0,0,0,0.96)", backdropFilter: "blur(30px)" }}
    >
      {/* Blurred bg from cover */}
      {coverImg && (
        <div className="absolute inset-0 pointer-events-none opacity-15"
          style={{
            backgroundImage:    `url(${coverImg})`,
            backgroundSize:     "cover",
            backgroundPosition: "center",
            filter:             "blur(60px) saturate(1.4)",
          }} />
      )}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.9) 100%)" }} />

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full px-5 pt-4 pb-6 overflow-hidden">

        {/* ── Top bar ─────────────────────────────── */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,0,60,0.1)", border: "1px solid rgba(255,0,60,0.2)", color: "#FF003C" }}>
            <ChevronDown className="w-5 h-5" />
          </button>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em]"
            style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif" }}>
            Now Playing
          </p>
          <button onClick={toggleLike}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: liked ? "rgba(255,0,60,0.15)" : "rgba(255,255,255,0.05)",
              border:     liked ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color:      liked ? "#FF003C" : "#44445a",
            }}>
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* ── Album art ───────────────────────────── */}
        <div className="flex justify-center mb-5 flex-shrink-0">
          <div
            className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden"
            style={{
              boxShadow: playing
                ? "0 0 50px rgba(255,0,60,0.4), 0 8px 40px rgba(0,0,0,0.7)"
                : "0 8px 40px rgba(0,0,0,0.7)",
              transition: "box-shadow 0.5s ease",
            }}
          >
            {isLoading ? (
              <div className="remix-shimmer w-full h-full" />
            ) : (
              <img src={coverImg} alt={title}
                className="w-full h-full object-cover"
                style={{ border: "1px solid rgba(255,0,60,0.15)" }} />
            )}
          </div>
        </div>

        {/* ── Song info ───────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black truncate"
              style={{ color: "#f0f0ff", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.02em" }}>
              {title || "Loading…"}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {artist && (
                <Link href={`/search/${encodeURIComponent(artist)}`}
                  className="text-sm font-semibold transition-colors hover:text-hellfire"
                  style={{ color: "#FF003C" }}
                  onClick={onClose}>
                  {artist}
                </Link>
              )}
              {albumName && (
                <><span style={{ color: "#44445a" }}>·</span>
                <span className="text-xs truncate" style={{ color: "#8888aa" }}>{albumName}</span></>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={downloadSong}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ color: "#44445a", border: "1px solid rgba(255,255,255,0.06)" }}
              title="Download">
              <Download className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleShare}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ color: "#44445a", border: "1px solid rgba(255,255,255,0.06)" }}
              title="Share">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Seek bar ────────────────────────────── */}
        <div className="mb-3 flex-shrink-0">
          <div
            className="relative w-full h-1 rounded-full cursor-pointer group"
            style={{ background: "rgba(255,255,255,0.08)" }}
            onClick={handleBarClick}
          >
            <div className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
              style={{
                width:      `${progress}%`,
                background: "linear-gradient(to right, #8B0000, #FF003C, #9D4EDD)",
                boxShadow:  "0 0 8px rgba(255,0,60,0.6)",
                transition: "width 0.1s linear",
              }} />
            <div className="absolute top-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                left:       `calc(${progress}% - 7px)`,
                transform:  "translateY(-50%)",
                background: "#FF003C",
                boxShadow:  "0 0 10px rgba(255,0,60,0.9)",
              }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", fontSize: "0.58rem" }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", fontSize: "0.58rem" }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* ── Transport ───────────────────────────── */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <button onClick={toggleLoop}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              color:      isLooping ? "#FF003C" : "#44445a",
              background: isLooping ? "rgba(255,0,60,0.1)" : "transparent",
              border:     isLooping ? "1px solid rgba(255,0,60,0.25)" : "1px solid transparent",
            }}>
            {isLooping ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>

          <button onClick={playPrev}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ color: "#8888aa" }}>
            <IoPlaySkipBack className="w-5 h-5" />
          </button>

          {/* Big play/pause */}
          <button onClick={togglePlay}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{
              background: "linear-gradient(135deg, #8B0000, #FF003C)",
              boxShadow:  playing
                ? "0 0 30px rgba(255,0,60,0.7), 0 0 60px rgba(255,0,60,0.3)"
                : "0 0 15px rgba(255,0,60,0.3)",
            }}>
            {playing
              ? <IoPause className="w-7 h-7 text-white" />
              : <IoPlay  className="w-7 h-7 text-white ml-1" />}
          </button>

          <button onClick={playNext}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ color: (queue.length > 0 || suggestions.length > 0) ? "#8888aa" : "#2a2a3a" }}>
            <IoPlaySkipForward className="w-5 h-5" />
          </button>

          {/* Mute */}
          <button onClick={toggleMute}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ color: muted ? "#44445a" : "#8888aa" }}>
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* ── Volume ──────────────────────────────── */}
        <div className="mb-4 flex-shrink-0">
          <div
            className="relative w-full h-1 rounded-full cursor-pointer"
            style={{ background: "rgba(255,255,255,0.08)" }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              changeVolume((e.clientX - rect.left) / rect.width);
            }}
          >
            <div className="h-full rounded-full pointer-events-none"
              style={{
                width:      `${(muted ? 0 : volume) * 100}%`,
                background: "linear-gradient(to right, #7C3AED, #9D4EDD)",
                boxShadow:  "0 0 6px rgba(124,58,237,0.5)",
              }} />
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────── */}
        <div className="flex gap-1.5 mb-3 flex-shrink-0">
          {["queue", "related", "recent"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-3 py-1 rounded-full transition-all"
              style={{
                fontFamily:    "Orbitron, sans-serif",
                fontSize:      "0.55rem",
                fontWeight:    700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                background:    activeTab === tab ? "rgba(255,0,60,0.15)" : "transparent",
                border:        activeTab === tab ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.06)",
                color:         activeTab === tab ? "#FF003C" : "#44445a",
              }}>
              {tab === "queue" ? `Queue (${queue.length})` : tab}
            </button>
          ))}
        </div>

        {/* ── Tab content ─────────────────────────── */}
        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-0.5">

          {/* Queue */}
          {activeTab === "queue" && (
            <>
              {queue.length === 0 && (
                <p className="text-xs text-center py-8" style={{ color: "#44445a" }}>
                  Queue is empty
                </p>
              )}
              {queue.map((item, i) => {
                const id    = item?.id || item;
                const sugg  = suggestions.find(s => s.id === id);
                const name  = sugg?.name  || item?.name  || id;
                const image = sugg?.image?.[1]?.url || item?.image?.[1]?.url || "";
                const art   = sugg?.artists?.primary?.[0]?.name || item?.artists?.primary?.[0]?.name || "";
                return (
                  <SongRow
                    key={`q-${id}-${i}`}
                    image={image}
                    name={name}
                    artist={art}
                    isCurrent={id === music}
                    index={i + 1}
                    onPlay={() => {
                      const rest = [...queue];
                      rest.splice(i, 1);
                      setQueue(rest);
                      playSong(id);
                    }}
                  />
                );
              })}
            </>
          )}

          {/* Related */}
          {activeTab === "related" && (
            <>
              {loading && <ShimmerRows />}
              {!loading && suggestions.map(s => (
                <SongRow
                  key={`r-${s.id}`}
                  image={s.image?.[1]?.url}
                  name={s.name}
                  artist={s.artists?.primary?.[0]?.name}
                  isCurrent={s.id === music}
                  onPlay={() => playSong(s.id)}
                  onQueue={() => setQueue(prev => prev.find(q => (q?.id || q) === s.id) ? prev : [...prev, s])}
                />
              ))}
            </>
          )}

          {/* Recent */}
          {activeTab === "recent" && (
            <>
              {recentlyPlayed.length === 0 && (
                <p className="text-xs text-center py-8" style={{ color: "#44445a" }}>
                  Nothing played yet
                </p>
              )}
              {recentlyPlayed.slice(0, 25).map(({ id }) => {
                const s = suggestions.find(x => x.id === id);
                return (
                  <SongRow
                    key={`rec-${id}`}
                    image={s?.image?.[1]?.url}
                    name={s?.name || id}
                    artist={s?.artists?.primary?.[0]?.name}
                    isCurrent={id === music}
                    onPlay={() => playSong(id)}
                  />
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SongRow({ image, name, artist, isCurrent, index, onPlay, onQueue }) {
  return (
    <button onClick={onPlay}
      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all duration-200"
      style={{
        background: isCurrent ? "rgba(255,0,60,0.1)"  : "rgba(18,18,32,0.5)",
        border:     isCurrent ? "1px solid rgba(255,0,60,0.25)" : "1px solid rgba(255,255,255,0.04)",
      }}
      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = "rgba(24,24,40,0.9)"; }}
      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "rgba(18,18,32,0.5)"; }}
    >
      {index !== undefined && (
        <span className="w-5 text-center text-[0.55rem] flex-shrink-0"
          style={{ color: isCurrent ? "#FF003C" : "#44445a", fontFamily: "Orbitron, sans-serif" }}>
          {isCurrent ? "▶" : index}
        </span>
      )}
      <img src={image || ""} alt={name}
        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
        style={{ background: "rgba(18,18,32,0.8)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate"
          style={{ color: isCurrent ? "#FF003C" : "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>
          {name}
        </p>
        {artist && <p className="text-xs truncate" style={{ color: "#8888aa" }}>{artist}</p>}
      </div>
      {onQueue && (
        <button onClick={e => { e.stopPropagation(); onQueue(); }}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "#9D4EDD" }}>
          <Plus className="w-3 h-3" />
        </button>
      )}
    </button>
  );
}

function ShimmerRows() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl"
          style={{ background: "rgba(18,18,32,0.4)" }}>
          <div className="remix-shimmer w-9 h-9 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="remix-shimmer h-3 w-4/5 rounded" />
            <div className="remix-shimmer h-2.5 w-3/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
