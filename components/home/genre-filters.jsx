"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const GENRES = [
  { id: "all",       label: "All",          icon: "✦",  query: null },
  { id: "trending",  label: "Trending",     icon: "🔥",  query: "trending hits 2025" },
  { id: "new",       label: "New Releases", icon: "⚡",  query: "new hindi songs 2025" },
  { id: "dark",      label: "Dark Energy",  icon: "🌑",  query: "dark energy beats" },
  { id: "drive",     label: "Night Drive",  icon: "🌙",  query: "night drive lofi" },
  { id: "hiphop",    label: "Hip-Hop",      icon: "🎤",  query: "hip hop rap 2025" },
  { id: "indie",     label: "Indie",        icon: "🎸",  query: "indie pop songs" },
  { id: "electronic",label: "Electronic",   icon: "🎛️", query: "electronic music 2025" },
  { id: "jazz",      label: "Jazz",         icon: "🎷",  query: "jazz soul midnight" },
  { id: "classical", label: "Classical",    icon: "🎻",  query: "classical music" },
  { id: "bollywood", label: "Bollywood",    icon: "🎬",  query: "bollywood hits 2025" },
  { id: "punjabi",   label: "Punjabi",      icon: "🥁",  query: "punjabi songs 2025" },
  { id: "podcasts",  label: "Podcasts",     icon: "🎙️", query: null, href: "/podcasts" },
];

export default function GenreFilters({ onFilter }) {
  const [active, setActive] = useState("all");
  const router = useRouter();

  const handleSelect = (genre) => {
    setActive(genre.id);
    if (genre.href) {
      router.push(genre.href);
      return;
    }
    if (genre.query) {
      router.push(`/search/${encodeURIComponent(genre.query)}`);
      return;
    }
    onFilter?.("all");
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
      style={{ scrollbarWidth: "none" }}>
      {GENRES.map((genre) => {
        const isActive = active === genre.id;
        return (
          <button
            key={genre.id}
            onClick={() => handleSelect(genre)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              fontFamily: "Rajdhani, sans-serif",
              letterSpacing: "0.04em",
              background: isActive
                ? "linear-gradient(135deg, #8B0000, #FF003C)"
                : "var(--border-subtle)",
              color: isActive ? "#ffffff" : "var(--text-secondary)",
              border: isActive
                ? "1px solid rgba(255,0,60,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
              boxShadow: isActive ? "0 0 12px rgba(255,0,60,0.3)" : "none",
            }}
          >
            <span>{genre.icon}</span>
            <span>{genre.label}</span>
          </button>
        );
      })}
    </div>
  );
}
