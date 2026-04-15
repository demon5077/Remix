"use client";
import { useState, useRef, useEffect } from "react";
import { IoPlay, IoPause } from "react-icons/io5";
import { SkipBack, SkipForward, Volume2, VolumeX, X, ChevronDown, Mic, List } from "lucide-react";

const SAMPLE_EPISODES = [
  { id: 1, title: "The Anatomy of Darkness",         duration: "1:12:04", date: "Jun 10, 2025" },
  { id: 2, title: "Frequencies Nobody Talks About",  duration: "58:30",   date: "Jun 3, 2025"  },
  { id: 3, title: "Midnight Creators",               duration: "1:04:17", date: "May 27, 2025" },
  { id: 4, title: "The Algorithm Has No Soul",       duration: "47:52",   date: "May 20, 2025" },
  { id: 5, title: "Underground is the New Mainstream",duration: "1:18:39", date: "May 13, 2025"},
];

export default function PodcastPlayer({ podcast, onClose }) {
  const [playing,    setPlaying]    = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [muted,      setMuted]      = useState(false);
  const [volume,     setVolume]     = useState(0.8);
  const [activeEp,   setActiveEp]   = useState(0);
  const [showList,   setShowList]   = useState(false);
  const [elapsed,    setElapsed]    = useState(0);
  const intervalRef                 = useRef(null);
  const totalSec                    = 72 * 60 + 4; // demo: 1:12:04

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => {
          const next = e + 1;
          setProgress((next / totalSec) * 100);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing]);

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${m}:${String(sec).padStart(2,"0")}`;
  };

  const handleSeek = (e) => {
    const rect  = e.currentTarget.getBoundingClientRect();
    const pct   = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newEl = Math.floor(pct * totalSec);
    setElapsed(newEl);
    setProgress(pct * 100);
  };

  if (!podcast) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full md:max-w-lg md:rounded-2xl overflow-hidden"
        style={{
          background: "rgba(8,8,16,0.98)",
          border: "1px solid rgba(157,78,221,0.15)",
          boxShadow: "0 0 80px rgba(157,78,221,0.12)",
          borderRadius: "24px 24px 0 0",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4" style={{ color: "#9D4EDD" }} />
            <span className="text-xs font-bold tracking-[0.15em] uppercase"
              style={{ fontFamily: "Orbitron, sans-serif", color: "#9D4EDD" }}>
              Podcast
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowList(s => !s)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                color: showList ? "#9D4EDD" : "#44445a",
                background: showList ? "rgba(157,78,221,0.12)" : "transparent",
                border: "1px solid " + (showList ? "rgba(157,78,221,0.3)" : "rgba(255,255,255,0.06)"),
              }}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ color: "#44445a", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#44445a"; }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showList ? (
          /* Episode list */
          <div className="px-5 pb-6">
            <p className="text-xs font-bold tracking-[0.1em] uppercase mb-3"
              style={{ color: "#44445a", fontFamily: "Rajdhani, sans-serif" }}>
              Episodes
            </p>
            <div className="space-y-1">
              {SAMPLE_EPISODES.map((ep, i) => (
                <button
                  key={ep.id}
                  onClick={() => { setActiveEp(i); setElapsed(0); setProgress(0); setPlaying(true); setShowList(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left"
                  style={{
                    background: i === activeEp ? "rgba(157,78,221,0.1)" : "transparent",
                    border: "1px solid " + (i === activeEp ? "rgba(157,78,221,0.2)" : "transparent"),
                  }}
                  onMouseEnter={e => { if (i !== activeEp) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (i !== activeEp) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate"
                      style={{ color: i === activeEp ? "#9D4EDD" : "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>
                      {ep.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#44445a" }}>{ep.date}</p>
                  </div>
                  <span className="text-xs flex-shrink-0 ml-4" style={{ color: "#44445a" }}>
                    {ep.duration}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Player */
          <div className="px-5 pb-8">
            {/* Cover + info */}
            <div className="flex gap-4 items-start mb-6">
              <div
                className="relative flex-shrink-0 rounded-xl overflow-hidden"
                style={{ width: 80, height: 80, boxShadow: "0 0 30px rgba(157,78,221,0.3)" }}
              >
                <img src={podcast.image} alt={podcast.title} className="w-full h-full object-cover" />
                {playing && (
                  <div className="absolute inset-0 flex items-end justify-center pb-1.5 gap-[2px]">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-[3px] rounded-sm bg-white"
                        style={{
                          minHeight: "4px",
                          animation: `vizBar${i + 1} ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
                          opacity: 0.8,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs mb-1" style={{ color: "#9D4EDD", fontFamily: "Orbitron, sans-serif" }}>
                  Ep {activeEp + 1}
                </p>
                <p className="font-bold text-sm leading-tight mb-1"
                  style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>
                  {SAMPLE_EPISODES[activeEp].title}
                </p>
                <p className="text-xs" style={{ color: "#8888aa" }}>{podcast.host}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-1.5">
              <div
                className="relative w-full h-1.5 rounded-full cursor-pointer group"
                style={{ background: "rgba(255,255,255,0.06)" }}
                onClick={handleSeek}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-200"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(to right, #4B0082, #9D4EDD)",
                    boxShadow: "0 0 6px rgba(157,78,221,0.5)",
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 6px)`, background: "#9D4EDD" }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px]" style={{ color: "#44445a", fontFamily: "Orbitron, sans-serif" }}>
                  {fmt(elapsed)}
                </span>
                <span className="text-[10px]" style={{ color: "#44445a", fontFamily: "Orbitron, sans-serif" }}>
                  {SAMPLE_EPISODES[activeEp].duration}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => { setMuted(m => !m); }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{ color: muted ? "#44445a" : "#8888aa" }}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setActiveEp(i => Math.max(0, i - 1)); setElapsed(0); setProgress(0); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{ color: "#44445a" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#9D4EDD"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#44445a"; }}
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setPlaying(p => !p)}
                  className="w-13 h-13 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
                  style={{
                    width: 52, height: 52,
                    background: playing
                      ? "linear-gradient(135deg, #4B0082, #9D4EDD)"
                      : "rgba(157,78,221,0.15)",
                    border: playing ? "none" : "1px solid rgba(157,78,221,0.35)",
                    boxShadow: playing
                      ? "0 0 24px rgba(157,78,221,0.6), 0 0 48px rgba(157,78,221,0.2)"
                      : "0 0 12px rgba(157,78,221,0.2)",
                  }}
                >
                  {playing
                    ? <IoPause className="w-5 h-5 text-white" />
                    : <IoPlay  className="w-5 h-5 text-white ml-0.5" />
                  }
                </button>

                <button
                  onClick={() => { setActiveEp(i => Math.min(SAMPLE_EPISODES.length - 1, i + 1)); setElapsed(0); setProgress(0); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{ color: "#44445a" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#9D4EDD"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#44445a"; }}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div style={{ width: 32 }} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes vizBar1 { from { height: 4px;  } to { height: 12px; } }
        @keyframes vizBar2 { from { height: 8px;  } to { height: 20px; } }
        @keyframes vizBar3 { from { height: 14px; } to { height: 6px;  } }
        @keyframes vizBar4 { from { height: 6px;  } to { height: 16px; } }
      `}</style>
    </div>
  );
}
