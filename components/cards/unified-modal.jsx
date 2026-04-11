"use client";
/**
 * UnifiedModal — single full-screen player for BOTH sources.
 * Saavn tab: audio controls + seek bar + queue/related
 * YouTube tab: iframe embed + queue/related
 * Audio/Video toggle for YT: audio-only mode uses ytdl audio stream workaround
 */
import { useState, useEffect, useCallback } from "react";
import { useMusicProvider } from "@/hooks/use-context";
import { useYT } from "@/hooks/use-youtube";
import { getSongsSuggestions } from "@/lib/fetch";
import { getRelatedVideos } from "@/lib/youtube";
import {
  ChevronDown, Repeat, Repeat1, Volume2, VolumeX,
  Download, Share2, Heart, Plus, X,
  SkipBack, SkipForward, Shuffle,
  Music, Video,
} from "lucide-react";
import { IoPause, IoPlay } from "react-icons/io5";
import Link from "next/link";
import { toast } from "sonner";

export default function UnifiedModal({ open, onClose, activeSource }) {
  const saavn = useMusicProvider();
  const yt    = useYT();

  // Which source tab is shown in the modal
  const [tab,          setTab]        = useState(activeSource || "saavn");
  const [ytMode,       setYtMode]     = useState("video"); // "video" | "audio"

  // Saavn data
  const [saavnSugg,    setSaavnSugg]  = useState([]);
  const [saavnLoading, setSaavnLoad]  = useState(false);
  const [saavnLiked,   setSaavnLiked] = useState(false);
  const [saavnTab,     setSaavnTab]   = useState("related");

  // YT data
  const [ytRelated,    setYtRelated]  = useState([]);
  const [ytLoading,    setYtLoad]     = useState(false);
  const [ytLiked,      setYtLiked]    = useState(false);
  const [ytTab,        setYtTab]      = useState("queue");

  // Sync tab to active source when it changes
  useEffect(() => {
    if (activeSource) setTab(activeSource);
  }, [activeSource]);

  // Load Saavn suggestions
  useEffect(() => {
    if (!saavn.music) return;
    setSaavnLoad(true);
    getSongsSuggestions(saavn.music, 20)
      .then(r => r.json())
      .then(d => {
        const songs = d?.data || [];
        setSaavnSugg(songs);
        saavn.setQueue(prev => prev.length === 0 ? songs.slice(0, 10) : prev);
      })
      .catch(() => {})
      .finally(() => setSaavnLoad(false));
    try {
      const likes = JSON.parse(localStorage.getItem("remix:likes") || "[]");
      setSaavnLiked(likes.includes(saavn.music));
    } catch {}
  }, [saavn.music]);

  // Load YT related
  useEffect(() => {
    if (!yt.currentVideo) return;
    setYtLoad(true);
    setYtRelated([]);
    getRelatedVideos(yt.currentVideo.id).then(({ items }) => {
      const valid = items.filter(Boolean).slice(0, 20);
      setYtRelated(valid);
      if (valid.length > 0 && yt.queue.length === 0) yt.setQueue(valid.slice(0, 8));
      setYtLoad(false);
    });
    setYtLiked(yt.isLiked(yt.currentVideo.id));
  }, [yt.currentVideo?.id]);

  const toggleSaavnLike = () => {
    try {
      const likes = JSON.parse(localStorage.getItem("remix:likes") || "[]");
      const next  = saavnLiked ? likes.filter(id => id !== saavn.music) : [...likes, saavn.music];
      localStorage.setItem("remix:likes", JSON.stringify(next));
      setSaavnLiked(!saavnLiked);
      toast(saavnLiked ? "Removed from Liked" : "❤️ Added to Liked");
    } catch {}
  };

  const toggleYtLike = () => {
    if (!yt.currentVideo) return;
    yt.toggleLike(yt.currentVideo);
    setYtLiked(!ytLiked);
    toast(!ytLiked ? "❤️ Added to Liked" : "Removed from Liked");
  };

  const downloadSaavn = async () => {
    if (!saavn.audioURL) return;
    try {
      toast("Downloading…");
      const blob = await fetch(saavn.audioURL).then(r => r.blob());
      const a    = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `${saavn.songData?.name || "song"}.mp3`,
      });
      a.click();
      toast.success("Downloaded!");
    } catch { toast.error("Download failed"); }
  };

  const shareSaavn = () => {
    const url = `${window.location.origin}/${saavn.music}`;
    navigator.share?.({ url }) || navigator.clipboard?.writeText(url);
    toast("Link copied!");
  };

  const handleSaavnSeek = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    saavn.seek(((e.clientX - rect.left) / rect.width) * (saavn.duration || 0));
  }, [saavn.seek, saavn.duration]);

  const playSaavnNext = () => {
    const q = saavn.queue;
    if (q.length > 0) {
      const [next, ...rest] = q;
      saavn.setQueue(rest);
      saavn.playSong(next?.id || next);
    } else if (saavnSugg.length > 0) {
      saavn.playSong(saavnSugg[0].id);
    }
  };

  const playSaavnPrev = () => {
    if (saavn.currentTime > 3) { saavn.seek(0); return; }
    if (saavn.recentlyPlayed.length > 1) saavn.playSong(saavn.recentlyPlayed[1].id);
  };

  if (!open) return null;

  const hasSaavn = !!saavn.music;
  const hasYT    = !!yt.currentVideo;

  // Cover bg
  const bgImage = tab === "saavn"
    ? (saavn.songData?.image?.[2]?.url || "")
    : (yt.currentVideo?.thumbnail || "");

  return (
    <div className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "rgba(0,0,0,0.97)", backdropFilter: "blur(30px)" }}>

      {/* Ambient blurred bg */}
      {bgImage && (
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:    `url(${bgImage})`,
            backgroundSize:     "cover",
            backgroundPosition: "center",
            filter:             "blur(60px) saturate(1.5)",
          }} />
      )}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.92) 100%)" }} />

      <div className="relative z-10 flex flex-col h-full max-w-lg mx-auto w-full">

        {/* ── Top bar ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,0,60,0.1)", border: "1px solid rgba(255,0,60,0.2)", color: "#FF003C" }}>
            <ChevronDown className="w-5 h-5" />
          </button>

          {/* Source tabs */}
          <div className="flex gap-1 rounded-xl p-1"
            style={{ background: "rgba(18,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {hasSaavn && (
              <button onClick={() => setTab("saavn")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  fontFamily:    "Orbitron, sans-serif",
                  letterSpacing: "0.06em",
                  background:    tab === "saavn" ? "rgba(255,0,60,0.2)" : "transparent",
                  color:         tab === "saavn" ? "#FF003C" : "#44445a",
                  border:        tab === "saavn" ? "1px solid rgba(255,0,60,0.3)" : "1px solid transparent",
                }}>
                <Music className="w-3 h-3" /> Audio
              </button>
            )}
            {hasYT && (
              <button onClick={() => setTab("yt")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  fontFamily:    "Orbitron, sans-serif",
                  letterSpacing: "0.06em",
                  background:    tab === "yt" ? "rgba(255,0,0,0.2)" : "transparent",
                  color:         tab === "yt" ? "#FF4444" : "#44445a",
                  border:        tab === "yt" ? "1px solid rgba(255,0,0,0.3)" : "1px solid transparent",
                }}>
                <Video className="w-3 h-3" /> Video
              </button>
            )}
          </div>

          {/* Like button */}
          <button
            onClick={tab === "saavn" ? toggleSaavnLike : toggleYtLike}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: (tab === "saavn" ? saavnLiked : ytLiked) ? "rgba(255,0,60,0.15)" : "rgba(255,255,255,0.05)",
              border:     (tab === "saavn" ? saavnLiked : ytLiked) ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color:      (tab === "saavn" ? saavnLiked : ytLiked) ? "#FF003C" : "#44445a",
            }}>
            <Heart className={`w-4 h-4 ${(tab === "saavn" ? saavnLiked : ytLiked) ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* ══════════════ SAAVN TAB ══════════════ */}
        {tab === "saavn" && (
          <div className="flex flex-col flex-1 min-h-0 px-5 pb-5">
            {/* Album art */}
            <div className="flex justify-center mb-5 flex-shrink-0">
              <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-2xl overflow-hidden"
                style={{
                  boxShadow: saavn.playing
                    ? "0 0 50px rgba(255,0,60,0.4), 0 8px 40px rgba(0,0,0,0.7)"
                    : "0 8px 40px rgba(0,0,0,0.7)",
                  transition: "box-shadow 0.5s",
                }}>
                {saavn.isLoading
                  ? <div className="remix-shimmer w-full h-full" />
                  : <img src={saavn.songData?.image?.[2]?.url || ""} alt={saavn.songData?.name}
                      className="w-full h-full object-cover"
                      style={{ border: "1px solid rgba(255,0,60,0.15)" }} />
                }
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start justify-between gap-2 mb-3 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black truncate"
                  style={{ color: "#f0f0ff", fontFamily: "Rajdhani, sans-serif" }}>
                  {saavn.songData?.name || "Loading…"}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Link href={`/search/${encodeURIComponent(saavn.songData?.artists?.primary?.[0]?.name || "")}`}
                    className="text-sm font-semibold" style={{ color: "#FF003C" }} onClick={onClose}>
                    {saavn.songData?.artists?.primary?.[0]?.name || ""}
                  </Link>
                  {saavn.songData?.album?.name && (
                    <><span style={{ color: "#44445a" }}>·</span>
                    <span className="text-xs truncate" style={{ color: "#8888aa" }}>{saavn.songData.album.name}</span></>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={downloadSaavn}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ color: "#44445a", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={shareSaavn}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ color: "#44445a", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Seek bar */}
            <div className="mb-2 flex-shrink-0">
              <div className="relative w-full h-1 rounded-full cursor-pointer group"
                style={{ background: "rgba(255,255,255,0.08)" }}
                onClick={handleSaavnSeek}>
                <div className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width:      `${saavn.progress}%`,
                    background: "linear-gradient(to right, #8B0000, #FF003C, #9D4EDD)",
                    boxShadow:  "0 0 8px rgba(255,0,60,0.6)",
                    transition: "width 0.1s linear",
                  }} />
                <div className="absolute top-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left:       `calc(${saavn.progress}% - 7px)`,
                    transform:  "translateY(-50%)",
                    background: "#FF003C",
                    boxShadow:  "0 0 10px rgba(255,0,60,0.9)",
                  }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", fontSize: "0.58rem" }}>
                  {saavn.formatTime(saavn.currentTime)}
                </span>
                <span style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", fontSize: "0.58rem" }}>
                  {saavn.formatTime(saavn.duration)}
                </span>
              </div>
            </div>

            {/* Transport controls */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <button onClick={saavn.toggleLoop}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  color:      saavn.isLooping ? "#FF003C" : "#44445a",
                  background: saavn.isLooping ? "rgba(255,0,60,0.1)" : "transparent",
                  border:     saavn.isLooping ? "1px solid rgba(255,0,60,0.25)" : "1px solid transparent",
                }}>
                {saavn.isLooping ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
              <button onClick={playSaavnPrev}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ color: "#8888aa" }}>
                <SkipBack className="w-5 h-5" />
              </button>
              {/* Big play */}
              <button onClick={saavn.togglePlay}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
                style={{
                  background: "linear-gradient(135deg, #8B0000, #FF003C)",
                  boxShadow:  saavn.playing
                    ? "0 0 30px rgba(255,0,60,0.7), 0 0 60px rgba(255,0,60,0.3)"
                    : "0 0 15px rgba(255,0,60,0.3)",
                }}>
                {saavn.playing
                  ? <IoPause className="w-7 h-7 text-white" />
                  : <IoPlay  className="w-7 h-7 text-white ml-1" />}
              </button>
              <button onClick={playSaavnNext}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ color: (saavn.queue.length > 0 || saavnSugg.length > 0) ? "#8888aa" : "#2a2a3a" }}>
                <SkipForward className="w-5 h-5" />
              </button>
              <button onClick={saavn.toggleMute}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ color: saavn.muted ? "#44445a" : "#8888aa" }}>
                {saavn.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Volume */}
            <div className="mb-4 flex-shrink-0">
              <div className="relative w-full h-1 rounded-full cursor-pointer"
                style={{ background: "rgba(255,255,255,0.08)" }}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  saavn.changeVolume((e.clientX - rect.left) / rect.width);
                }}>
                <div className="h-full rounded-full"
                  style={{
                    width:      `${(saavn.muted ? 0 : saavn.volume) * 100}%`,
                    background: "linear-gradient(to right, #7C3AED, #9D4EDD)",
                  }} />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 mb-3 flex-shrink-0">
              {["related", "queue", "recent"].map(t => (
                <button key={t} onClick={() => setSaavnTab(t)}
                  className="px-3 py-1 rounded-full transition-all"
                  style={{
                    fontFamily:    "Orbitron, sans-serif", fontSize: "0.55rem",
                    fontWeight:    700, letterSpacing: "0.12em", textTransform: "uppercase",
                    background:    saavnTab === t ? "rgba(255,0,60,0.15)" : "transparent",
                    border:        saavnTab === t ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    color:         saavnTab === t ? "#FF003C" : "#44445a",
                  }}>
                  {t === "queue" ? `Queue (${saavn.queue.length})` : t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
              {saavnTab === "related" && (
                <>
                  {saavnLoading && <ShimmerRows />}
                  {!saavnLoading && saavnSugg.map(s => (
                    <SongRow key={s.id}
                      image={s.image?.[1]?.url} name={s.name}
                      artist={s.artists?.primary?.[0]?.name}
                      isCurrent={s.id === saavn.music}
                      onPlay={() => saavn.playSong(s.id)}
                      onQueue={() => saavn.setQueue(prev =>
                        prev.find(q => (q?.id || q) === s.id) ? prev : [...prev, s]
                      )} />
                  ))}
                </>
              )}
              {saavnTab === "queue" && (
                <>
                  {saavn.queue.length === 0 && <Empty text="Queue is empty" />}
                  {saavn.queue.map((item, i) => {
                    const id   = item?.id || item;
                    const sugg = saavnSugg.find(s => s.id === id);
                    return (
                      <SongRow key={`q-${id}-${i}`}
                        image={sugg?.image?.[1]?.url || item?.image?.[1]?.url}
                        name={sugg?.name || item?.name || id}
                        artist={sugg?.artists?.primary?.[0]?.name || item?.artists?.primary?.[0]?.name}
                        isCurrent={id === saavn.music}
                        index={i + 1}
                        onPlay={() => {
                          const rest = [...saavn.queue]; rest.splice(i, 1);
                          saavn.setQueue(rest); saavn.playSong(id);
                        }} />
                    );
                  })}
                </>
              )}
              {saavnTab === "recent" && (
                <>
                  {saavn.recentlyPlayed.length === 0 && <Empty text="Nothing played yet" />}
                  {saavn.recentlyPlayed.slice(0, 20).map(({ id }) => {
                    const s = saavnSugg.find(x => x.id === id);
                    return (
                      <SongRow key={`rec-${id}`}
                        image={s?.image?.[1]?.url} name={s?.name || id}
                        artist={s?.artists?.primary?.[0]?.name}
                        isCurrent={id === saavn.music}
                        onPlay={() => saavn.playSong(id)} />
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ YOUTUBE TAB ══════════════ */}
        {tab === "yt" && yt.currentVideo && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Audio/Video mode toggle */}
            <div className="flex justify-center mb-2 px-5 flex-shrink-0">
              <div className="flex gap-1 rounded-lg p-1"
                style={{ background: "rgba(18,18,32,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {["video", "audio"].map(m => (
                  <button key={m} onClick={() => setYtMode(m)}
                    className="flex items-center gap-1 px-3 py-1 rounded text-xs font-bold transition-all"
                    style={{
                      fontFamily:    "Orbitron, sans-serif",
                      letterSpacing: "0.06em",
                      background:    ytMode === m ? "rgba(255,0,0,0.2)" : "transparent",
                      color:         ytMode === m ? "#FF4444" : "#44445a",
                      border:        ytMode === m ? "1px solid rgba(255,0,0,0.3)" : "1px solid transparent",
                    }}>
                    {m === "video" ? <Video className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                    {m === "video" ? "Video" : "Audio Only"}
                  </button>
                ))}
              </div>
            </div>

            {/* Video iframe */}
            {ytMode === "video" && (
              <div className="flex-shrink-0 w-full" style={{ aspectRatio: "16/9", background: "#000" }}>
                <iframe
                  key={yt.currentVideo.id}
                  src={`https://www.youtube.com/embed/${yt.currentVideo.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                  title={yt.currentVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  style={{ border: "none" }}
                />
              </div>
            )}

            {/* Audio-only thumbnail */}
            {ytMode === "audio" && (
              <div className="flex justify-center py-2 flex-shrink-0">
                <div className="w-44 h-44 rounded-2xl overflow-hidden relative"
                  style={{ boxShadow: "0 0 40px rgba(255,0,0,0.3)", border: "1px solid rgba(255,0,0,0.2)" }}>
                  <img src={yt.currentVideo.thumbnail} alt={yt.currentVideo.title}
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.4)" }}>
                    <Music className="w-10 h-10" style={{ color: "rgba(255,255,255,0.7)" }} />
                  </div>
                  {/* Hidden iframe for audio-only (still loads YT audio) */}
                  <iframe
                    key={`audio-${yt.currentVideo.id}`}
                    src={`https://www.youtube.com/embed/${yt.currentVideo.id}?autoplay=1&rel=0&controls=0`}
                    title="audio"
                    allow="autoplay"
                    className="absolute w-0 h-0 opacity-0 pointer-events-none"
                    style={{ border: "none" }}
                  />
                </div>
              </div>
            )}

            {/* Info + controls */}
            <div className="flex-shrink-0 px-5 pt-3 pb-2">
              <div className="flex items-start gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold leading-snug line-clamp-2"
                    style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>
                    {yt.currentVideo.title}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "#8888aa" }}>{yt.currentVideo.channelTitle}</p>
                </div>
              </div>
              {/* YT transport */}
              <div className="flex items-center justify-around">
                <button onClick={yt.toggleShuffle}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ color: yt.shuffle ? "#FF003C" : "#44445a", background: yt.shuffle ? "rgba(255,0,60,0.08)" : "transparent" }}>
                  <Shuffle className="w-4 h-4" />
                </button>
                <button onClick={yt.prev}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ color: yt.history.length > 0 ? "#8888aa" : "#2a2a3a" }}>
                  <SkipBack className="w-5 h-5" />
                </button>
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #8B0000, #FF003C)", boxShadow: "0 0 20px rgba(255,0,60,0.5)" }}>
                  <IoPlay className="w-6 h-6 text-white ml-0.5" />
                </div>
                <button onClick={yt.next}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ color: yt.queue.length > 0 ? "#8888aa" : "#2a2a3a" }}>
                  <SkipForward className="w-5 h-5" />
                </button>
                <button onClick={() => {
                  const modes = ["none","one","all"];
                  yt.setRepeat(modes[(modes.indexOf(yt.repeat) + 1) % modes.length]);
                }}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ color: yt.repeat !== "none" ? "#FF003C" : "#44445a", background: yt.repeat !== "none" ? "rgba(255,0,60,0.08)" : "transparent" }}>
                  {yt.repeat === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 px-5 mb-3 flex-shrink-0">
              {["queue","related"].map(t => (
                <button key={t} onClick={() => setYtTab(t)}
                  className="px-3 py-1 rounded-full transition-all"
                  style={{
                    fontFamily:    "Orbitron, sans-serif", fontSize: "0.55rem",
                    fontWeight:    700, letterSpacing: "0.12em", textTransform: "uppercase",
                    background:    ytTab === t ? "rgba(255,0,0,0.15)" : "transparent",
                    border:        ytTab === t ? "1px solid rgba(255,0,0,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    color:         ytTab === t ? "#FF4444" : "#44445a",
                  }}>
                  {t === "queue" ? `Queue (${yt.queue.length})` : "Related"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-5 space-y-1.5 pb-4 min-h-0">
              {ytTab === "queue" && (
                <>
                  {yt.queue.length === 0 && <Empty text="Queue empty — add videos with +" />}
                  {yt.queue.map((item, i) => item && (
                    <YTRow key={`ytq-${item.id}-${i}`} item={item}
                      isActive={yt.currentVideo.id === item.id}
                      index={i + 1}
                      onPlay={() => {
                        const rest = yt.queue.filter((_, j) => j !== i);
                        yt.setQueue(rest);
                        yt.playVideo(item);
                      }}
                      onRemove={() => yt.removeFromQueue(i)} />
                  ))}
                </>
              )}
              {ytTab === "related" && (
                <>
                  {ytLoading && <ShimmerRows />}
                  {!ytLoading && ytRelated.map(item => item && (
                    <YTRow key={`ytr-${item.id}`} item={item}
                      isActive={yt.currentVideo.id === item.id}
                      onPlay={() => yt.playVideo(item)}
                      onQueue={() => yt.addToQueue(item)} />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SongRow({ image, name, artist, isCurrent, index, onPlay, onQueue }) {
  return (
    <button onClick={onPlay}
      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all duration-200 group"
      style={{
        background: isCurrent ? "rgba(255,0,60,0.1)" : "rgba(18,18,32,0.5)",
        border:     isCurrent ? "1px solid rgba(255,0,60,0.25)" : "1px solid rgba(255,255,255,0.04)",
      }}
      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = "rgba(24,24,40,0.9)"; }}
      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "rgba(18,18,32,0.5)"; }}>
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

function YTRow({ item, isActive, index, onPlay, onQueue, onRemove }) {
  return (
    <button onClick={onPlay}
      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all duration-200 group"
      style={{
        background: isActive ? "rgba(255,0,0,0.1)" : "rgba(18,18,32,0.5)",
        border:     isActive ? "1px solid rgba(255,0,0,0.25)" : "1px solid rgba(255,255,255,0.04)",
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(24,24,40,0.9)"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "rgba(18,18,32,0.5)"; }}>
      {index !== undefined && (
        <span className="w-5 text-center text-[0.55rem] flex-shrink-0"
          style={{ color: isActive ? "#FF4444" : "#44445a", fontFamily: "Orbitron, sans-serif" }}>
          {isActive ? "▶" : index}
        </span>
      )}
      <img src={item.thumbnail || ""} alt={item.title}
        className="w-[52px] h-[29px] rounded-md object-cover flex-shrink-0"
        style={{ background: "rgba(18,18,32,0.8)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold line-clamp-1"
          style={{ color: isActive ? "#FF4444" : "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>
          {item.title}
        </p>
        <p className="text-[10px] truncate" style={{ color: "#8888aa" }}>{item.channelTitle}</p>
      </div>
      {onQueue && (
        <button onClick={e => { e.stopPropagation(); onQueue(); toast("Added to queue"); }}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "#9D4EDD" }}>
          <Plus className="w-3 h-3" />
        </button>
      )}
      {onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove(); }}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "#FF4444" }}>
          <X className="w-3 h-3" />
        </button>
      )}
    </button>
  );
}

function ShimmerRows() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
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

function Empty({ text }) {
  return <p className="text-xs text-center py-8" style={{ color: "#44445a" }}>{text}</p>;
}
