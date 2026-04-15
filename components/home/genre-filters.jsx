"use client";
import { useState } from "react";
<<<<<<< HEAD
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
=======

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
>>>>>>> 5515522fddb6d87b4ff5301809ce05597f8bf9c4
];

export default function GenreFilters({ onFilter }) {
  const [active, setActive] = useState("all");
<<<<<<< HEAD
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
=======

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
>>>>>>> 5515522fddb6d87b4ff5301809ce05597f8bf9c4
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              fontFamily: "Rajdhani, sans-serif",
              letterSpacing: "0.04em",
              background: isActive
                ? "linear-gradient(135deg, #8B0000, #FF003C)"
<<<<<<< HEAD
                : "rgba(255,255,255,0.06)",
              color: isActive ? "#ffffff" : "#ccccee",
              border: isActive
                ? "1px solid rgba(255,0,60,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
              boxShadow: isActive ? "0 0 12px rgba(255,0,60,0.3)" : "none",
            }}
          >
            <span>{genre.icon}</span>
            <span>{genre.label}</span>
=======
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
>>>>>>> 5515522fddb6d87b4ff5301809ce05597f8bf9c4
          </button>
        );
      })}
    </div>
  );
}
