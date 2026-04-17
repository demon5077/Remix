"use client";
/**
 * Unified Mini-Player — single bottom bar for Saavn + YouTube.
 * - Real progress bar (seekable) for both sources
 * - Volume slider with mute
 * - Waveform visualizer when playing
 * - Add-to-playlist button
 * - Expand button → opens UnifiedModal
 */
import { useState, useEffect, useRef } from "react";
import { useMusicProvider } from "@/hooks/use-context";
import { useYT, hideIframeContainer } from "@/hooks/use-youtube";
import { IoPause, IoPlay } from "react-icons/io5";
import {
  Repeat, Repeat1, SkipForward, SkipBack,
  Volume2, VolumeX, X, ChevronUp, Shuffle,
} from "lucide-react";
import UnifiedModal from "./unified-modal";
import AddToPlaylist from "@/components/playlist/add-to-playlist";

function WaveViz({ playing, color = "#FF003C" }) {
  return (
    <div className="flex items-end gap-[2px] h-4 flex-shrink-0">
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{
          width: 2, minHeight: 3, borderRadius: 1, background: color,
          animation: playing ? `pw${i} ${0.4+i*0.1}s ease-in-out infinite alternate` : "none",
          height: playing ? undefined : 3, opacity: playing ? 0.9 : 0.3,
        }} />
      ))}
      <style>{`
        @keyframes pw1{from{height:3px}to{height:14px}}@keyframes pw2{from{height:7px}to{height:18px}}
        @keyframes pw3{from{height:12px}to{height:5px}}@keyframes pw4{from{height:5px}to{height:16px}}
        @keyframes pw5{from{height:9px}to{height:4px}}
        @keyframes pulseRing{0%,100%{transform:scale(1);opacity:0.3}50%{transform:scale(1.15);opacity:0.6}}
      `}</style>
    </div>
  );
}

export default function Player() {
  const saavn = useMusicProvider();
  const yt    = useYT();

  const [activeSource, setActiveSource] = useState(null);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [showVol,      setShowVol]      = useState(false);
  const volTimeout     = useRef(null);

  useEffect(() => { if (saavn?.music)       setActiveSource("saavn"); }, [saavn?.music]);
  useEffect(() => { if (yt?.currentVideo)   setActiveSource("yt");    }, [yt?.currentVideo]);

  if (!saavn?.music && !yt?.currentVideo) return null;

  const isSaavn   = activeSource === "saavn" && !!saavn?.music;
  const isYT      = !isSaavn && !!yt?.currentVideo;
  const isPlaying = isSaavn ? saavn.playing : yt.playing;
  const accent    = isYT ? "#FF4444" : "#FF003C";

  const thumbnail = isSaavn
    ? (saavn.songData?.image?.[1]?.url || saavn.songData?.image?.[0]?.url || "")
    : (yt.currentVideo?.thumbnail || "");
  const title = isSaavn ? (saavn.songData?.name || "") : (yt.currentVideo?.title || "");
  const sub   = isSaavn ? (saavn.songData?.artists?.primary?.[0]?.name || "") : (yt.currentVideo?.channelTitle || "");

  // Progress
  const progress    = isSaavn ? (saavn.progress || 0)      : (yt.ytProgress || 0);
  const currentTime = isSaavn ? (saavn.currentTime || 0)   : (yt.ytCurrentTime || 0);
  const duration    = isSaavn ? (saavn.duration || 0)      : (yt.ytDuration || 0);

  // Volume
  const isMuted = isSaavn ? saavn.muted    : yt.ytMuted;
  const vol     = isSaavn ? saavn.volume   : yt.ytVolume;

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    if (isSaavn && saavn.formatTime) return saavn.formatTime(s);
    if (isYT && yt.ytFormatTime)     return yt.ytFormatTime(s);
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (isSaavn && saavn.seek && duration > 0) saavn.seek(pct * duration);
    else if (isYT && yt.ytSeek && yt.ytDuration > 0) yt.ytSeek(pct * yt.ytDuration);
  };

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (isSaavn) saavn.togglePlay?.();
    else         yt.togglePlay?.();
  };

  const handleMute = (e) => {
    e.stopPropagation();
    if (isSaavn) saavn.toggleMute?.();
    else         yt.toggleYtMute?.();
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (isSaavn) saavn.changeVolume?.(pct);
    else         yt.changeYtVolume?.(pct);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    if (isSaavn) { saavn.stopPlayback?.(); if (yt.currentVideo) setActiveSource("yt"); }
    else { yt.stop?.(); hideIframeContainer?.(); if (saavn?.music) setActiveSource("saavn"); }
  };

  const showVolume = () => {
    setShowVol(true);
    clearTimeout(volTimeout.current);
    volTimeout.current = setTimeout(() => setShowVol(false), 2000);
  };

  return (
    <>
      <UnifiedModal open={modalOpen} onClose={() => setModalOpen(false)} activeSource={activeSource} />

      <div className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(4,4,9,0.98)", backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderTop: `1px solid ${accent}18`,
          boxShadow: `0 -4px 60px rgba(0,0,0,0.8), 0 -1px 0 ${accent}10`,
        }}>

        {/* ── Seekable progress bar ────────────────────────────── */}
        <div className="relative w-full h-[4px] cursor-pointer group"
          style={{ background: "rgba(255,255,255,0.06)" }}
          onClick={handleProgressClick}>
          <div className="h-full transition-none pointer-events-none"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: `linear-gradient(to right, #8B0000, ${accent}, #9D4EDD)`,
              boxShadow: `0 0 8px ${accent}55`,
            }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${Math.min(progress, 100)}% - 7px)`, background: accent, boxShadow: `0 0 8px ${accent}` }} />
        </div>

        {/* ── Main 3-column row ─────────────────────────────────── */}
        <div className="grid h-[68px]" style={{ gridTemplateColumns: "1fr auto 1fr" }}>

          {/* LEFT: art + title */}
          <button className="flex items-center gap-3 pl-3 sm:pl-4 min-w-0" onClick={() => setModalOpen(true)}>
            <div className="relative flex-shrink-0">
              {isPlaying && (
                <div className="absolute -inset-[5px] rounded-[14px] pointer-events-none"
                  style={{ background: `${accent}20`, animation: "pulseRing 2.2s ease-in-out infinite" }} />
              )}
              <img src={thumbnail} alt={title}
                className="w-11 h-11 rounded-xl object-cover relative z-10"
                style={{ border: isPlaying ? `1.5px solid ${accent}99` : "1.5px solid rgba(255,255,255,0.06)", transition: "border-color 0.3s" }} />
              <span className="absolute -bottom-1 -right-1 z-20 rounded-full w-[18px] h-[18px] flex items-center justify-center font-black"
                style={{ background: isYT ? "#FF0000" : "#FF003C", color: "white", border: "2px solid rgba(4,4,9,0.98)", fontFamily: "Orbitron, sans-serif", fontSize: "5px" }}>
                {isYT ? "YT" : "♪"}
              </span>
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate leading-tight" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif", maxWidth: "140px" }}>{title}</p>
                {isPlaying && <WaveViz playing color={accent} />}
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: "#8888aa" }}>{sub}</p>
            </div>
          </button>

          {/* CENTER: controls */}
          <div className="flex items-center justify-center gap-1.5 px-2">
            {/* Loop/Shuffle */}
            {isSaavn
              ? <button onClick={e => { e.stopPropagation(); saavn.toggleLoop?.(); }}
                  className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all"
                  style={{ color: saavn.isLooping ? accent : "#44445a", background: saavn.isLooping ? `${accent}12` : "transparent", border: saavn.isLooping ? `1px solid ${accent}40` : "1px solid transparent" }}>
                  {saavn.isLooping ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                </button>
              : <button className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center" style={{ color: "#44445a" }}>
                  <Shuffle className="w-3.5 h-3.5" />
                </button>}

            {/* Skip back */}
            <button onClick={e => { e.stopPropagation(); if (isSaavn && saavn.seek) saavn.seek(Math.max(0, currentTime - 10)); else if (isYT && yt.ytSeek) yt.ytSeek(Math.max(0, currentTime - 10)); }}
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all"
              style={{ color: "#44445a" }}
              onMouseEnter={e => e.currentTarget.style.color = "#ccccee"} onMouseLeave={e => e.currentTarget.style.color = "#44445a"}>
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Play/Pause */}
            <button onClick={handlePlayPause}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
              style={{
                background: isPlaying ? `linear-gradient(135deg, #8B0000, ${accent})` : `rgba(255,0,60,0.12)`,
                border:     isPlaying ? "none" : `1px solid ${accent}50`,
                boxShadow:  isPlaying ? `0 0 24px ${accent}66, 0 0 48px ${accent}22` : `0 0 10px ${accent}22`,
              }}>
              {isPlaying ? <IoPause className="w-4 h-4 text-white" /> : <IoPlay className="w-4 h-4 text-white ml-0.5" />}
            </button>

            {/* Skip forward */}
            <button onClick={e => { e.stopPropagation(); if (isSaavn && saavn.seek) saavn.seek(Math.min(duration, currentTime + 10)); else if (isYT && yt.ytSeek) yt.ytSeek(Math.min(yt.ytDuration, currentTime + 10)); }}
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all"
              style={{ color: "#44445a" }}
              onMouseEnter={e => e.currentTarget.style.color = "#ccccee"} onMouseLeave={e => e.currentTarget.style.color = "#44445a"}>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ color: "#44445a" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; e.currentTarget.style.background = "rgba(255,0,60,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#44445a"; e.currentTarget.style.background = "transparent"; }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* RIGHT: time + volume + add to playlist + expand */}
          <div className="hidden sm:flex items-center justify-end gap-2 pr-3">
            {/* Time */}
            {duration > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span style={{ color: accent, fontFamily: "Orbitron, sans-serif", fontSize: "0.52rem" }}>{fmt(currentTime)}</span>
                <span style={{ color: "#2a2a3a", fontFamily: "Orbitron, sans-serif", fontSize: "0.52rem" }}>/</span>
                <span style={{ color: "#44445a", fontFamily: "Orbitron, sans-serif", fontSize: "0.52rem" }}>{fmt(duration)}</span>
              </div>
            )}

            {/* Volume — always visible icon + expandable slider */}
            <div className="flex items-center gap-1.5"
              onMouseEnter={showVolume} onMouseLeave={() => clearTimeout(volTimeout.current)}>
              <button onClick={handleMute}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                style={{ color: isMuted ? "#44445a" : "#aaaacc", border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; showVolume(); }}
                onMouseLeave={e => { e.currentTarget.style.color = isMuted ? "#44445a" : "#aaaacc"; }}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="overflow-hidden transition-all duration-300 flex items-center"
                style={{ width: showVol ? "72px" : "0px", opacity: showVol ? 1 : 0 }}>
                <div className="relative w-[72px] h-1.5 rounded-full cursor-pointer group flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                  onClick={handleVolumeChange}>
                  <div className="h-full rounded-full pointer-events-none"
                    style={{ width: `${(isMuted ? 0 : vol) * 100}%`, background: "linear-gradient(to right, #7C3AED, #9D4EDD)", transition: "width 0.1s" }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `calc(${(isMuted ? 0 : vol) * 100}% - 6px)`, background: "#9D4EDD" }} />
                </div>
              </div>
            </div>

            {/* Add to playlist */}
            {title && (
              <AddToPlaylist song={{ id: isSaavn ? saavn.music : yt.currentVideo?.id, ytId: isYT ? yt.currentVideo?.id : null, name: title, artist: sub, source: isSaavn ? "saavn" : "youtube" }} size="sm" />
            )}

            {/* Expand to full player */}
            <button onClick={() => setModalOpen(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{ color: "#44445a", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.borderColor = `${accent}44`; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#44445a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
