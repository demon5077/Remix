"use client";
/**
 * UnifiedPlayer — single bottom bar for BOTH Saavn audio + YouTube video.
 * 
 * - If a Saavn song is active → shows audio controls
 * - If a YT video is active → shows YT thumbnail + iframe embed on expand
 * - Whichever was played LAST takes the bar
 * - Clicking the bar opens the UnifiedPlayerModal
 */
import { useState, useEffect } from "react";
import { useMusicProvider } from "@/hooks/use-context";
import { useYT } from "@/hooks/use-youtube";
import { IoPause, IoPlay } from "react-icons/io5";
import { Repeat, Repeat1, SkipForward, Volume2, VolumeX, X, ChevronUp } from "lucide-react";
import UnifiedModal from "./unified-modal";

export default function Player() {
  const saavn = useMusicProvider();
  const yt    = useYT();

  // "last" decides which source owns the bar
  // We track whichever was activated most recently
  const [activeSource, setActiveSource] = useState(null); // "saavn" | "yt"
  const [modalOpen,    setModalOpen]    = useState(false);

  useEffect(() => {
    if (saavn.music)         setActiveSource("saavn");
  }, [saavn.music]);

  useEffect(() => {
    if (yt.currentVideo)     setActiveSource("yt");
  }, [yt.currentVideo]);

  const hasAnything = !!saavn.music || !!yt.currentVideo;
  if (!hasAnything) return null;

  // Determine which data to show
  const isSaavn = activeSource === "saavn" && !!saavn.music;
  const isYT    = activeSource === "yt"    && !!yt.currentVideo;

  const thumbnail = isSaavn
    ? (saavn.songData?.image?.[1]?.url || saavn.songData?.image?.[0]?.url || "")
    : (yt.currentVideo?.thumbnail || "");
  const title  = isSaavn ? (saavn.songData?.name || "") : (yt.currentVideo?.title || "");
  const sub    = isSaavn
    ? (saavn.songData?.artists?.primary?.[0]?.name || "")
    : (yt.currentVideo?.channelTitle || "");
  const playing = isSaavn ? saavn.playing : false; // YT iframe controls itself

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (isSaavn) saavn.togglePlay();
  };

  const handleClose = (e) => {
    e.stopPropagation();
    if (isSaavn) saavn.stopPlayback();
    if (isYT)   { yt.stop(); setActiveSource(saavn.music ? "saavn" : null); }
  };

  const progress = isSaavn ? saavn.progress : 0;

  return (
    <>
      <UnifiedModal open={modalOpen} onClose={() => setModalOpen(false)} activeSource={activeSource} />

      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background:           "rgba(5,5,10,0.97)",
          backdropFilter:       "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          borderTop:            "1px solid rgba(255,0,60,0.1)",
          boxShadow:            "0 -8px 40px rgba(0,0,0,0.7)",
        }}
      >
        {/* Progress bar — top edge (Saavn only) */}
        {isSaavn && (
          <div
            className="relative w-full h-[3px] cursor-pointer group"
            style={{ background: "rgba(255,255,255,0.05)" }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              saavn.seek(((e.clientX - rect.left) / rect.width) * (saavn.duration || 0));
            }}
          >
            <div
              className="h-full"
              style={{
                width:      `${progress}%`,
                background: "linear-gradient(to right, #8B0000, #FF003C, #9D4EDD)",
                boxShadow:  "0 0 6px rgba(255,0,60,0.5)",
                transition: "width 0.1s linear",
              }}
            />
            <div
              className="absolute top-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                left:       `calc(${progress}% - 6px)`,
                transform:  "translateY(-50%)",
                background: "#FF003C",
                boxShadow:  "0 0 8px rgba(255,0,60,0.9)",
              }}
            />
          </div>
        )}
        {/* YT progress placeholder — flat accent line */}
        {isYT && (
          <div className="w-full h-[3px]"
            style={{ background: "linear-gradient(to right, #8B0000, #FF003C)" }} />
        )}

        {/* ── Main row ──────────────────────────────────── */}
        <div className="flex items-center px-3 sm:px-5 h-[68px] gap-3">

          {/* Left: thumbnail + title — click opens modal */}
          <button
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            onClick={() => setModalOpen(true)}
          >
            <div className="relative flex-shrink-0">
              {isSaavn && playing && (
                <div className="absolute -inset-1 rounded-lg"
                  style={{ background: "rgba(255,0,60,0.18)", animation: "pulseRing 2s ease-in-out infinite" }} />
              )}
              {isYT && (
                <div className="absolute -inset-1 rounded-lg"
                  style={{ background: "rgba(255,0,0,0.15)", animation: "pulseRing 2s ease-in-out infinite" }} />
              )}
              <img
                src={thumbnail}
                alt={title}
                className="w-10 h-10 rounded-lg object-cover relative z-10 flex-shrink-0"
                style={{
                  border: (playing || isYT)
                    ? "1.5px solid rgba(255,0,60,0.55)"
                    : "1.5px solid rgba(255,255,255,0.07)",
                }}
              />
              {/* Source badge */}
              <div
                className="absolute -bottom-1 -right-1 z-20 rounded-full w-4 h-4 flex items-center justify-center text-[6px] font-black"
                style={{
                  background: isYT ? "#FF0000" : "#FF003C",
                  color:      "white",
                  fontFamily: "Orbitron, sans-serif",
                  border:     "1px solid rgba(0,0,0,0.5)",
                }}
              >
                {isYT ? "YT" : "♪"}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-tight"
                style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif", maxWidth: "160px" }}>
                {title}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: "#8888aa" }}>{sub}</p>
            </div>

            <ChevronUp className="w-4 h-4 flex-shrink-0 hidden sm:block" style={{ color: "#44445a" }} />
          </button>

          {/* Center: controls */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Loop (Saavn only) */}
            {isSaavn && (
              <button
                onClick={e => { e.stopPropagation(); saavn.toggleLoop(); }}
                className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all hover:scale-110"
                style={{
                  color:      saavn.isLooping ? "#FF003C" : "#44445a",
                  background: saavn.isLooping ? "rgba(255,0,60,0.12)" : "transparent",
                  border:     saavn.isLooping ? "1px solid rgba(255,0,60,0.3)" : "1px solid transparent",
                }}
              >
                {saavn.isLooping ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* YT next (YT only) */}
            {isYT && (
              <button
                onClick={e => { e.stopPropagation(); yt.next(); }}
                className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all hover:scale-110"
                style={{ color: yt.queue.length > 0 ? "#8888aa" : "#2a2a3a" }}
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
              style={{
                background: (playing || isYT)
                  ? "linear-gradient(135deg, #8B0000, #FF003C)"
                  : "rgba(255,0,60,0.15)",
                border:     (playing || isYT) ? "none" : "1px solid rgba(255,0,60,0.3)",
                boxShadow:  (playing || isYT)
                  ? "0 0 22px rgba(255,0,60,0.6), 0 0 44px rgba(255,0,60,0.2)"
                  : "0 0 10px rgba(255,0,60,0.2)",
              }}
            >
              {/* YT always shows play icon since iframe controls itself */}
              {isYT
                ? <IoPlay className="w-4 h-4 text-white ml-0.5" />
                : playing
                  ? <IoPause className="w-4 h-4 text-white" />
                  : <IoPlay  className="w-4 h-4 text-white ml-0.5" />}
            </button>

            {/* Close */}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ color: "#44445a" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; e.currentTarget.style.background = "rgba(255,0,60,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#44445a";  e.currentTarget.style.background = "transparent"; }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: time + volume (Saavn, desktop) */}
          {isSaavn && (
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <span style={{ color: "#44445a", fontFamily: "Orbitron, sans-serif", fontSize: "0.58rem" }}>
                {saavn.formatTime(saavn.currentTime)} / {saavn.formatTime(saavn.duration)}
              </span>
              <button
                onClick={e => { e.stopPropagation(); saavn.toggleMute(); }}
                style={{ color: saavn.muted ? "#44445a" : "#8888aa" }}
              >
                {saavn.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
