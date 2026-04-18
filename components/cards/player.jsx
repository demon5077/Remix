"use client";
import { useState, useRef } from "react";
import { useMusicProvider } from "@/hooks/use-context";
import { useYT, hideIframeContainer } from "@/hooks/use-youtube";
import { IoPause, IoPlay } from "react-icons/io5";
import {
  Repeat, Repeat1, SkipForward, SkipBack,
  Volume2, VolumeX, X, ChevronUp, ListMusic, Shuffle,
} from "lucide-react";
import UnifiedModal from "./unified-modal";
import AddToPlaylist from "@/components/playlist/add-to-playlist";

function WaveViz({ playing, color }) {
  const c = color || "var(--accent)";
  return (
    <div className="flex items-end gap-[2px] h-4 flex-shrink-0">
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{
          width: 2, minHeight: 3, borderRadius: 1, background: c,
          animation: playing ? `pw${i} ${0.4+i*0.1}s ease-in-out infinite alternate` : "none",
          height: playing ? undefined : 3, opacity: playing ? 0.9 : 0.3,
        }} />
      ))}
      <style>{`
        @keyframes pw1{from{height:3px}to{height:14px}}
        @keyframes pw2{from{height:7px}to{height:18px}}
        @keyframes pw3{from{height:12px}to{height:5px}}
        @keyframes pw4{from{height:5px}to{height:16px}}
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
  const volTimeout = useRef(null);

  // Determine which source is active
  if (yt?.currentVideo && activeSource !== "yt")    setActiveSource("yt");
  if (!yt?.currentVideo && saavn?.isFallback && saavn?.music && activeSource !== "saavn") setActiveSource("saavn");

  const isSaavn   = activeSource === "saavn" && !!saavn?.music && saavn?.isFallback;
  const isYT      = !!yt?.currentVideo;
  const isPlaying = isYT ? yt.playing : (saavn?.playing || false);

  if (!isYT && !isSaavn) return null;

  const thumbnail   = isYT ? (yt.currentVideo?.thumbnail || "") : (saavn?.songData?.image?.[1]?.url || "");
  const title       = isYT ? (yt.currentVideo?.title || "") : (saavn?.songData?.name || "");
  const sub         = isYT ? (yt.currentVideo?.channelTitle || "") : (saavn?.songData?.artists?.primary?.[0]?.name || "");
  const progress    = isYT ? (yt.ytProgress || 0) : (saavn?.progress || 0);
  const currentTime = isYT ? (yt.ytCurrentTime || 0) : (saavn?.currentTime || 0);
  const duration    = isYT ? (yt.ytDuration || 0) : (saavn?.duration || 0);
  const isMuted     = isYT ? yt.ytMuted : saavn?.muted;
  const vol         = isYT ? yt.ytVolume : (saavn?.volume || 1);

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    if (isYT && yt.ytFormatTime) return yt.ytFormatTime(s);
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (isYT && yt.ytSeek && yt.ytDuration > 0) yt.ytSeek(pct * yt.ytDuration);
    else if (isSaavn && saavn?.seek && duration > 0) saavn.seek(pct * duration);
  };

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (isYT) yt.togglePlay?.();
    else      saavn?.togglePlay?.();
  };

  const handleMute = (e) => {
    e.stopPropagation();
    if (isYT) yt.toggleYtMute?.();
    else      saavn?.toggleMute?.();
  };

  const handleVol = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (isYT) yt.changeYtVolume?.(pct);
    else      saavn?.changeVolume?.(pct);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    if (isYT) { yt.stop?.(); hideIframeContainer?.(); setActiveSource(null); }
    else      { saavn?.stopPlayback?.(); setActiveSource(null); }
  };

  const showVolume = () => {
    setShowVol(true);
    clearTimeout(volTimeout.current);
    volTimeout.current = setTimeout(() => setShowVol(false), 2500);
  };

  return (
    <>
      <UnifiedModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="arise-player fixed bottom-0 left-0 right-0 z-50"
        style={{
          background:    "var(--player-bg)",
          backdropFilter:"blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderTop:     "1px solid var(--border-primary)",
          boxShadow:     "0 -4px 40px rgba(0,0,0,0.15)",
        }}>

        {/* Progress bar */}
        <div className="arise-progress-track relative w-full h-[4px] cursor-pointer group"
          style={{ background: "var(--border-subtle)" }}
          onClick={handleSeek}>
          <div className="h-full transition-none pointer-events-none"
            style={{
              width:      `${Math.min(progress, 100)}%`,
              background: `linear-gradient(to right, var(--accent-2), var(--accent))`,
              boxShadow:  `0 0 6px color-mix(in srgb, var(--accent) 50%, transparent)`,
            }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${Math.min(progress, 100)}% - 7px)`, background: "var(--accent)" }} />
        </div>

        {/* Main row */}
        <div className="grid h-[68px]" style={{ gridTemplateColumns: "1fr auto 1fr" }}>

          {/* LEFT: art + title */}
          <button className="flex items-center gap-3 pl-3 sm:pl-4 min-w-0" onClick={() => setModalOpen(true)}>
            <div className="relative flex-shrink-0">
              {isPlaying && (
                <div className="absolute -inset-[5px] rounded-[14px] pointer-events-none"
                  style={{ background: "color-mix(in srgb, var(--accent) 20%, transparent)", animation: "pulseRing 2.2s ease-in-out infinite" }} />
              )}
              {thumbnail
                ? <img src={thumbnail} alt={title}
                    className="w-11 h-11 rounded-xl object-cover relative z-10"
                    style={{ border: isPlaying ? "1.5px solid var(--accent)" : "1.5px solid var(--border-subtle)" }} />
                : <div className="w-11 h-11 rounded-xl flex items-center justify-center relative z-10"
                    style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-subtle)" }}>
                    <ListMusic className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                  </div>}
              <span className="absolute -bottom-1 -right-1 z-20 rounded-full w-[18px] h-[18px] flex items-center justify-center font-black text-white"
                style={{ background: isYT ? "#FF0000" : "var(--accent)", border: "2px solid var(--player-bg)", fontFamily: "Orbitron, sans-serif", fontSize: "5px" }}>
                {isYT ? "YT" : "♪"}
              </span>
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate leading-tight" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif", maxWidth: "160px" }}>{title}</p>
                {isPlaying && <WaveViz playing />}
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
            </div>
          </button>

          {/* CENTER: controls */}
          <div className="flex items-center justify-center gap-1.5 px-2">
            {/* Repeat/Shuffle */}
            {isSaavn
              ? <button onClick={e => { e.stopPropagation(); saavn?.toggleLoop?.(); }}
                  className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all"
                  style={{ color: saavn?.isLooping ? "var(--accent)" : "var(--text-faint)", background: saavn?.isLooping ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent" }}>
                  {saavn?.isLooping ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                </button>
              : <button className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center" style={{ color: "var(--text-faint)" }}>
                  <Shuffle className="w-3.5 h-3.5" />
                </button>}

            {/* Skip back 10s */}
            <button onClick={e => { e.stopPropagation(); if (isYT && yt.ytSeek) yt.ytSeek(Math.max(0, currentTime-10)); else if (isSaavn && saavn?.seek) saavn.seek(Math.max(0, currentTime-10)); }}
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-colors"
              style={{ color: "var(--text-faint)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-faint)"}>
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Play/Pause */}
            <button onClick={handlePlayPause}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
              style={{
                background: isPlaying
                  ? "linear-gradient(135deg, var(--accent-2), var(--accent))"
                  : "color-mix(in srgb, var(--accent) 15%, transparent)",
                border:    isPlaying ? "none" : "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                boxShadow: isPlaying ? "0 0 24px color-mix(in srgb, var(--accent) 50%, transparent)" : "none",
              }}>
              {isPlaying
                ? <IoPause className="w-4 h-4 text-white" />
                : <IoPlay  className="w-4 h-4 text-white ml-0.5" />}
            </button>

            {/* Skip forward 10s */}
            <button onClick={e => { e.stopPropagation(); if (isYT && yt.ytSeek) yt.ytSeek(Math.min(duration||999, currentTime+10)); else if (isSaavn && saavn?.seek) saavn.seek(Math.min(duration, currentTime+10)); }}
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-colors"
              style={{ color: "var(--text-faint)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-faint)"}>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ color: "var(--text-faint)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 10%, transparent)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-faint)"; e.currentTarget.style.background = "transparent"; }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* RIGHT: time + volume + add to playlist + expand */}
          <div className="hidden sm:flex items-center justify-end gap-2 pr-3">
            {duration > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span style={{ color: "var(--accent)", fontFamily: "Orbitron, sans-serif", fontSize: "0.52rem" }}>{fmt(currentTime)}</span>
                <span style={{ color: "var(--border-subtle)", fontFamily: "Orbitron, sans-serif", fontSize: "0.52rem" }}>/</span>
                <span style={{ color: "var(--text-faint)", fontFamily: "Orbitron, sans-serif", fontSize: "0.52rem" }}>{fmt(duration)}</span>
              </div>
            )}

            {/* Volume */}
            <div className="flex items-center gap-1.5"
              onMouseEnter={showVolume} onMouseLeave={() => clearTimeout(volTimeout.current)}>
              <button onClick={handleMute}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                style={{ color: isMuted ? "var(--text-faint)" : "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; showVolume(); }}
                onMouseLeave={e => { e.currentTarget.style.color = isMuted ? "var(--text-faint)" : "var(--text-secondary)"; }}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="overflow-hidden transition-all duration-300 flex items-center"
                style={{ width: showVol ? "72px" : "0px", opacity: showVol ? 1 : 0 }}>
                <div className="relative w-[72px] h-1.5 rounded-full cursor-pointer group flex-shrink-0"
                  style={{ background: "var(--border-subtle)" }}
                  onClick={handleVol}>
                  <div className="h-full rounded-full pointer-events-none"
                    style={{ width: `${(isMuted ? 0 : (vol||0)) * 100}%`, background: "linear-gradient(to right, var(--accent-2), var(--accent))" }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `calc(${(isMuted ? 0 : (vol||0)) * 100}% - 6px)`, background: "var(--accent)" }} />
                </div>
              </div>
            </div>

            {/* Add to playlist */}
            {title && (
              <AddToPlaylist song={{
                id:     isYT ? yt.currentVideo?.id : saavn?.music,
                ytId:   isYT ? yt.currentVideo?.id : null,
                name:   title, artist: sub, thumbnail,
                source: isYT ? "youtube" : "saavn",
              }} size="sm" />
            )}

            {/* Expand */}
            <button onClick={() => setModalOpen(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{ color: "var(--text-faint)", border: "1px solid var(--border-subtle)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-faint)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
