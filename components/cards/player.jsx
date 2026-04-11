"use client";
/**
 * UnifiedMiniPlayer — single bottom bar for Saavn + YouTube.
 *
 * Layout (3 equal columns):
 * ┌────────────────┬──────────────────────┬────────────────────┐
 * │ LEFT           │ CENTER (controls)    │ RIGHT              │
 * │ art + title    │ loop/next · ▶ · ✕   │ time · vol · mute  │
 * └────────────────┴──────────────────────┴────────────────────┘
 *
 * On mobile: LEFT + CENTER only (RIGHT hidden), layout still balanced.
 */
import { useState, useEffect } from "react";
import { useMusicProvider } from "@/hooks/use-context";
import { useYT, hideIframeToBackground } from "@/hooks/use-youtube";
import { IoPause, IoPlay } from "react-icons/io5";
import { Repeat, Repeat1, SkipForward, Volume2, VolumeX, X, ChevronUp } from "lucide-react";
import UnifiedModal from "./unified-modal";

export default function Player() {
  const saavn = useMusicProvider();
  const yt    = useYT();

  const [activeSource, setActiveSource] = useState(null);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [showVol,      setShowVol]      = useState(false);

  useEffect(() => { if (saavn.music)     setActiveSource("saavn"); }, [saavn.music]);
  useEffect(() => { if (yt.currentVideo) setActiveSource("yt");    }, [yt.currentVideo]);

  const hasAnything = !!saavn.music || !!yt.currentVideo;
  if (!hasAnything) return null;

  const isSaavn   = activeSource === "saavn" && !!saavn.music;
  const isYT      = !isSaavn && !!yt.currentVideo;
  const isPlaying = isSaavn ? saavn.playing : yt.playing;

  const thumbnail = isSaavn
    ? (saavn.songData?.image?.[1]?.url || saavn.songData?.image?.[0]?.url || "")
    : (yt.currentVideo?.thumbnail || "");
  const title = isSaavn ? (saavn.songData?.name || "") : (yt.currentVideo?.title || "");
  const sub   = isSaavn
    ? (saavn.songData?.artists?.primary?.[0]?.name || "")
    : (yt.currentVideo?.channelTitle || "");

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (isSaavn) saavn.togglePlay();
    else         yt.togglePlay();
  };

  const handleClose = (e) => {
    e.stopPropagation();
    if (isSaavn) {
      saavn.stopPlayback();
      if (yt.currentVideo) setActiveSource("yt");
    } else {
      yt.stop();
      hideIframeToBackground();
      if (saavn.music) setActiveSource("saavn");
    }
  };

  const progress = isSaavn ? saavn.progress : 0;

  return (
    <>
      <UnifiedModal open={modalOpen} onClose={() => setModalOpen(false)} activeSource={activeSource} />

      <div className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background:           "rgba(5,5,10,0.97)",
          backdropFilter:       "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          borderTop:            "1px solid rgba(255,0,60,0.1)",
          boxShadow:            "0 -8px 40px rgba(0,0,0,0.7)",
        }}>

        {/* ── Seek line (top edge) ─────────────────── */}
        {isSaavn && (
          <div className="relative w-full h-[3px] cursor-pointer group"
            style={{ background: "rgba(255,255,255,0.05)" }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              saavn.seek(((e.clientX - rect.left) / rect.width) * (saavn.duration || 0));
            }}>
            <div className="h-full transition-[width] duration-100 ease-linear"
              style={{
                width:      `${progress}%`,
                background: "linear-gradient(to right, #8B0000, #FF003C, #9D4EDD)",
                boxShadow:  "0 0 6px rgba(255,0,60,0.5)",
              }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)`, background: "#FF003C", boxShadow: "0 0 8px rgba(255,0,60,0.9)" }} />
          </div>
        )}
        {isYT && (
          <div className="w-full h-[3px]"
            style={{ background: "linear-gradient(to right, #8B0000, #FF003C)", opacity: 0.8 }} />
        )}

        {/* ── 3-column main row ───────────────────── */}
        <div className="grid h-[68px] px-3 sm:px-5"
          style={{ gridTemplateColumns: "1fr auto 1fr" }}>

          {/* ─ LEFT: art + info ─ */}
          <button
            className="flex items-center gap-2.5 min-w-0 text-left"
            onClick={() => setModalOpen(true)}
          >
            <div className="relative flex-shrink-0">
              {isPlaying && (
                <div className="absolute -inset-1 rounded-lg"
                  style={{ background: "rgba(255,0,60,0.18)", animation: "pulseRing 2s ease-in-out infinite" }} />
              )}
              <img src={thumbnail} alt={title}
                className="w-10 h-10 rounded-lg object-cover relative z-10 flex-shrink-0"
                style={{
                  border: isPlaying ? "1.5px solid rgba(255,0,60,0.6)" : "1.5px solid rgba(255,255,255,0.07)",
                  transition: "border-color 0.3s",
                }} />
              <span className="absolute -bottom-1 -right-1 z-20 rounded-full w-[16px] h-[16px] flex items-center justify-center font-black"
                style={{
                  background: isYT ? "#FF0000" : "#FF003C",
                  color: "white", border: "1.5px solid rgba(0,0,0,0.6)",
                  fontFamily: "Orbitron, sans-serif", fontSize: "5px",
                }}>
                {isYT ? "YT" : "♪"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight"
                style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif", maxWidth: "140px" }}>
                {title}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: "#8888aa" }}>{sub}</p>
            </div>
          </button>

          {/* ─ CENTER: controls (always centered) ─ */}
          <div className="flex items-center justify-center gap-2">

            {/* Loop (Saavn) / Next (YT) */}
            {isSaavn && (
              <button
                onClick={e => { e.stopPropagation(); saavn.toggleLoop(); }}
                className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all hover:scale-110"
                style={{
                  color:      saavn.isLooping ? "#FF003C" : "#44445a",
                  background: saavn.isLooping ? "rgba(255,0,60,0.12)" : "transparent",
                  border:     saavn.isLooping ? "1px solid rgba(255,0,60,0.3)" : "1px solid transparent",
                }} title="Loop (L)">
                {saavn.isLooping ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
              </button>
            )}
            {isYT && (
              <button
                onClick={e => { e.stopPropagation(); yt.next(); }}
                className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all hover:scale-110"
                style={{ color: yt.queue.length > 0 ? "#8888aa" : "#2a2a3a" }}>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Play / Pause */}
            <button onClick={handlePlayPause}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
              style={{
                background: isPlaying ? "linear-gradient(135deg, #8B0000, #FF003C)" : "rgba(255,0,60,0.15)",
                border:     isPlaying ? "none" : "1px solid rgba(255,0,60,0.3)",
                boxShadow:  isPlaying
                  ? "0 0 22px rgba(255,0,60,0.6), 0 0 44px rgba(255,0,60,0.2)"
                  : "0 0 10px rgba(255,0,60,0.2)",
              }} title="Play / Pause (Space)">
              {isPlaying
                ? <IoPause className="w-4 h-4 text-white" />
                : <IoPlay  className="w-4 h-4 text-white ml-0.5" />}
            </button>

            {/* Close */}
            <button onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ color: "#44445a" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; e.currentTarget.style.background = "rgba(255,0,60,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#44445a";  e.currentTarget.style.background = "transparent"; }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ─ RIGHT: time + volume ─ */}
          <div className="hidden sm:flex items-center justify-end gap-2.5">
            {isSaavn && (
              <>
                <span style={{ color: "#44445a", fontFamily: "Orbitron, sans-serif", fontSize: "0.55rem" }}>
                  {saavn.formatTime(saavn.currentTime)} / {saavn.formatTime(saavn.duration)}
                </span>
              </>
            )}

            {/* Volume — always show icon, slider on hover */}
            <div className="flex items-center gap-2"
              onMouseEnter={() => setShowVol(true)}
              onMouseLeave={() => setShowVol(false)}>
              <button
                onClick={e => { e.stopPropagation(); if (isSaavn) saavn.toggleMute(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
                style={{
                  color:      (isSaavn ? saavn.muted : false) ? "#44445a" : "#8888aa",
                  border:     "1px solid rgba(255,255,255,0.06)",
                }}>
                {(isSaavn && saavn.muted)
                  ? <VolumeX className="w-4 h-4" />
                  : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Volume slider — expands on hover */}
              <div className="overflow-hidden transition-all duration-300 flex items-center"
                style={{ width: showVol ? "72px" : "0px", opacity: showVol ? 1 : 0 }}>
                {isSaavn && (
                  <div className="w-[72px] relative h-1.5 rounded-full cursor-pointer group flex-shrink-0"
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
                )}
              </div>
            </div>

            {/* Expand chevron */}
            <button onClick={() => setModalOpen(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ color: "#44445a" }}>
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
