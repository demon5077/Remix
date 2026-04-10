"use client";
import { useYT } from "@/hooks/use-youtube";
import { Play, Plus, Clock } from "lucide-react";

/**
 * YTCard — renders a YouTube video item.
 * layout: "scroll" (horizontal card) | "grid" (vertical card)
 */
export default function YTCard({ item, layout = "scroll" }) {
  const { playVideo, addToQueue, currentVideo } = useYT();
  if (!item) return null;

  const isActive = currentVideo?.id === item.id;

  if (layout === "grid") {
    return (
      <div
        className="group rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02]"
        style={{
          background:   isActive ? "rgba(255,0,60,0.1)"  : "rgba(18,18,32,0.7)",
          border:       isActive ? "1px solid rgba(255,0,60,0.35)" : "1px solid rgba(255,255,255,0.05)",
          boxShadow:    isActive ? "0 0 20px rgba(255,0,60,0.15)" : "none",
        }}
        onClick={() => playVideo(item)}
      >
        {/* Thumbnail */}
        <div className="relative w-full aspect-video overflow-hidden">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: "rgba(0,0,0,0.55)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,0,60,0.9)", boxShadow: "0 0 20px rgba(255,0,60,0.6)" }}>
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
          {item.durationText && (
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ background: "rgba(0,0,0,0.85)", color: "white", fontFamily: "Orbitron, sans-serif" }}>
              {item.durationText}
            </span>
          )}
          {isActive && (
            <div className="absolute inset-0 pointer-events-none" style={{ border: "2px solid rgba(255,0,60,0.5)" }} />
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-semibold leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-hellfire"
            style={{ color: isActive ? "#FF003C" : "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>
            {item.title}
          </p>
          <p className="text-xs mt-1 truncate" style={{ color: "#8888aa" }}>{item.channelTitle}</p>
          <div className="flex items-center justify-between mt-2">
            {item.viewCount > 0 && (
              <span className="text-[10px]" style={{ color: "#44445a", fontFamily: "Orbitron, sans-serif" }}>
                {formatViews(item.viewCount)}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); addToQueue(item); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all duration-200 ml-auto"
              style={{ background: "rgba(255,0,60,0.08)", border: "1px solid rgba(255,0,60,0.15)", color: "#FF003C" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,0,60,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,0,60,0.08)"}
            >
              <Plus className="w-3 h-3" /> Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Scroll / horizontal layout
  return (
    <div
      className="group flex-shrink-0 w-[200px] cursor-pointer"
      onClick={() => playVideo(item)}
    >
      <div className="relative w-full aspect-video rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.03]"
        style={{ boxShadow: isActive ? "0 0 20px rgba(255,0,60,0.35)" : "0 4px 20px rgba(0,0,0,0.5)" }}>
        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)" }} />
        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100"
          style={{ background: "rgba(255,0,60,0.9)", boxShadow: "0 0 12px rgba(255,0,60,0.6)" }}>
          <Play className="w-3.5 h-3.5 text-white ml-0.5" />
        </div>
        {item.durationText && (
          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
            style={{ background: "rgba(0,0,0,0.85)", color: "white", fontFamily: "Orbitron, sans-serif" }}>
            {item.durationText}
          </span>
        )}
        {isActive && (
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ border: "2px solid rgba(255,0,60,0.55)" }} />
        )}
      </div>
      <p className="mt-2.5 text-sm font-semibold truncate px-0.5 transition-colors duration-200 group-hover:text-hellfire"
        style={{ color: isActive ? "#FF003C" : "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>
        {item.title}
      </p>
      <p className="text-xs truncate px-0.5" style={{ color: "#8888aa" }}>{item.channelTitle}</p>
    </div>
  );
}

function formatViews(n) {
  if (!n) return "";
  const num = parseInt(n, 10);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K views`;
  return `${num} views`;
}
