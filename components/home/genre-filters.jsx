"use client";
import { useState } from "react";

const GENRES = [
  { id: "all",      label: "All",          icon: "✦" },
  { id: "trending", label: "Trending",     icon: "🔥" },
  { id: "new",      label: "New Releases", icon: "⚡" },
  { id: "dark",     label: "Dark Energy",  icon: "🌑" },
  { id: "drive",    label: "Night Drive",  icon: "🌙" },
  { id: "hiphop",   label: "Hip-Hop",      icon: "🎤" },
  { id: "indie",    label: "Indie",        icon: "🎸" },
  { id: "electronic", label: "Electronic", icon: "🎛️" },
  { id: "jazz",     label: "Jazz",         icon: "🎷" },
  { id: "classical",label: "Classical",    icon: "🎻" },
  { id: "podcasts", label: "Podcasts",     icon: "🎙️" },
];

export default function GenreFilters({ onFilter }) {
  const [active, setActive] = useState("all");

  const handleSelect = (id) => {
    setActive(id);
    onFilter?.(id);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
      {GENRES.map(({ id, label, icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              fontFamily: "Rajdhani, sans-serif",
              letterSpacing: "0.04em",
              background: isActive
                ? "linear-gradient(135deg, #8B0000, #FF003C)"
                : "rgba(255,255,255,0.04)",
              color: isActive ? "#ffffff" : "#8888aa",
              border: isActive
                ? "1px solid rgba(255,0,60,0.5)"
                : "1px solid rgba(255,255,255,0.06)",
              boxShadow: isActive ? "0 0 12px rgba(255,0,60,0.3)" : "none",
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.color = "#ccccee";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.color = "#8888aa";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
