"use client";
/**
 * MiniPlayer bar — reads 100% from MusicContext.
 * Zero audio logic here. Click → opens full PlayerModal.
 */
import { useState } from "react";
import { Repeat, Repeat1, Volume2, VolumeX, X, ChevronUp } from "lucide-react";
import { Slider } from "../ui/slider";
import Link from "next/link";
import { useMusicProvider } from "@/hooks/use-context";
import { IoPause, IoPlay } from "react-icons/io5";
import PlayerModal from "./player-modal";

export default function Player() {
  const {
    music, songData, playing,
    togglePlay, toggleLoop, isLooping,
    toggleMute, muted, volume, changeVolume,
    currentTime, duration, progress, formatTime,
    stopPlayback, playerOpen, setPlayerOpen,
  } = useMusicProvider();

  const [showVolume, setShowVolume] = useState(false);

  if (!music) return null;

  return (
    <>
      {/* Full-screen player modal */}
      <PlayerModal open={playerOpen} onClose={() => setPlayerOpen(false)} />

      {/* Mini player bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background:           "rgba(5,5,10,0.97)",
          backdropFilter:       "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          borderTop:            "1px solid rgba(255,0,60,0.12)",
          boxShadow:            "0 -8px 40px rgba(0,0,0,0.7)",
        }}
      >
        {/* ── Seek bar — top edge ────────────────────── */}
        <SeekBar />

        {/* ── Main row ──────────────────────────────── */}
        <div className="flex items-center px-3 sm:px-5 h-[68px] gap-3">

          {/* Left: art + info — clicking opens modal */}
          <button
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
            onClick={() => setPlayerOpen(true)}
            aria-label="Open player"
          >
            <div className="relative flex-shrink-0">
              {playing && (
                <div
                  className="absolute -inset-1 rounded-lg"
                  style={{ background: "rgba(255,0,60,0.18)", animation: "pulseRing 2s ease-in-out infinite" }}
                />
              )}
              <img
                src={songData?.image?.[1]?.url || songData?.image?.[0]?.url || ""}
                alt={songData?.name || ""}
                className="w-10 h-10 rounded-lg object-cover relative z-10 flex-shrink-0"
                style={{
                  border: playing ? "1.5px solid rgba(255,0,60,0.6)" : "1.5px solid rgba(255,255,255,0.07)",
                  transition: "border-color 0.3s",
                }}
              />
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-semibold truncate leading-tight"
                style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif", maxWidth: "130px" }}
              >
                {songData?.name || ""}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: "#8888aa" }}>
                {songData?.artists?.primary?.[0]?.name || ""}
              </p>
            </div>
            {/* Expand chevron */}
            <ChevronUp
              className="w-4 h-4 flex-shrink-0 hidden sm:block"
              style={{ color: "#44445a" }}
            />
          </button>

          {/* Center: Loop + Play/Pause + Stop */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); toggleLoop(); }}
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                color:      isLooping ? "#FF003C" : "#44445a",
                background: isLooping ? "rgba(255,0,60,0.12)" : "transparent",
                border:     isLooping ? "1px solid rgba(255,0,60,0.3)" : "1px solid transparent",
              }}
              title="Loop (L)"
            >
              {isLooping ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
              style={{
                background: playing
                  ? "linear-gradient(135deg, #8B0000, #FF003C)"
                  : "rgba(255,0,60,0.15)",
                border:     playing ? "none" : "1px solid rgba(255,0,60,0.3)",
                boxShadow:  playing
                  ? "0 0 22px rgba(255,0,60,0.6), 0 0 44px rgba(255,0,60,0.2)"
                  : "0 0 10px rgba(255,0,60,0.2)",
              }}
              title="Play / Pause (Space)"
            >
              {playing
                ? <IoPause className="w-4 h-4 text-white" />
                : <IoPlay  className="w-[15px] h-[15px] text-white ml-0.5" />}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); stopPlayback(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{ color: "#44445a" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; e.currentTarget.style.background = "rgba(255,0,60,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#44445a";  e.currentTarget.style.background = "transparent"; }}
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: time + volume (desktop) */}
          <div
            className="hidden sm:flex items-center gap-3 flex-shrink-0"
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
          >
            <span style={{ color: "#44445a", fontFamily: "Orbitron, sans-serif", fontSize: "0.58rem" }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              style={{ color: muted ? "#44445a" : "#8888aa" }}
              title="Mute (M)"
            >
              {muted || volume === 0
                ? <VolumeX className="w-4 h-4" />
                : <Volume2 className="w-4 h-4" />}
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ width: showVolume ? "72px" : "0px", opacity: showVolume ? 1 : 0 }}
            >
              <Slider
                value={[muted ? 0 : volume]}
                max={1} step={0.05}
                onValueChange={(v) => changeVolume(v[0])}
                className="w-[72px]"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Separate seek bar reads from context too
function SeekBar() {
  const { currentTime, duration, progress, seek } = useMusicProvider();
  return (
    <div
      className="relative w-full h-0.5 cursor-pointer group"
      style={{ background: "rgba(255,255,255,0.05)" }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        seek(((e.clientX - rect.left) / rect.width) * (duration || 0));
      }}
    >
      <div
        className="h-full"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(to right, #8B0000, #FF003C, #9D4EDD)",
          boxShadow: "0 0 6px rgba(255,0,60,0.5)",
          transition: "width 0.1s linear",
        }}
      />
      <div
        className="absolute top-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          left: `calc(${progress}% - 6px)`,
          top: "50%",
          transform: "translateY(-50%)",
          background: "#FF003C",
          boxShadow: "0 0 8px rgba(255,0,60,0.9)",
        }}
      />
    </div>
  );
}
