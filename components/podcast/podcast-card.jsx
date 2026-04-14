"use client";
import { useState } from "react";
import { IoPlay, IoPause } from "react-icons/io5";
import { Mic, Clock } from "lucide-react";

export default function PodcastCard({ title, host, image, duration, episode, category, isPlaying, onPlay }) {
  const [hovered, setHovered] = useState(false);

  // Skeleton
  if (!title) {
    return (
      <div className="flex-shrink-0 w-[160px] sm:w-[175px]">
        <div className="remix-shimmer w-full h-[160px] sm:h-[175px] rounded-xl" />
        <div className="mt-2.5 space-y-1.5">
          <div className="remix-shimmer h-3.5 w-3/4 rounded" />
          <div className="remix-shimmer h-2.5 w-1/2 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 w-[160px] sm:w-[175px] cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPlay}
    >
      {/* Cover */}
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={image}
          alt={title}
          className="w-full h-[160px] sm:h-[175px] object-cover transition-transform duration-500 group-hover:scale-110"
          style={{ background: "rgba(18,18,32,0.6)" }}
        />

        {/* Overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 55%)" }}
        />

        {/* Category badge */}
        {category && (
          <div
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: "rgba(157,78,221,0.85)",
              color: "white",
              fontFamily: "Orbitron, sans-serif",
              backdropFilter: "blur(4px)",
            }}
          >
            {category}
          </div>
        )}

        {/* Duration */}
        {duration && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]"
            style={{
              background: "rgba(0,0,0,0.6)",
              color: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(4px)",
            }}
          >
            <Clock className="w-2.5 h-2.5" />
            {duration}
          </div>
        )}

        {/* Play button */}
        <div
          className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
            isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100"
          }`}
          style={{
            background: isPlaying
              ? "linear-gradient(135deg, #4B0082, #9D4EDD)"
              : "rgba(157,78,221,0.9)",
            boxShadow: "0 0 16px rgba(157,78,221,0.6)",
          }}
        >
          {isPlaying
            ? <IoPause className="w-4 h-4 text-white" />
            : <IoPlay  className="w-4 h-4 text-white ml-0.5" />
          }
        </div>

        {/* Mic icon overlay on hover */}
        <div
          className="absolute bottom-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <Mic className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
        </div>

        {/* Active border */}
        {isPlaying && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ border: "2px solid rgba(157,78,221,0.6)", boxShadow: "inset 0 0 16px rgba(157,78,221,0.15)" }}
          />
        )}
      </div>

      {/* Meta */}
      <div className="mt-2.5 px-0.5">
        <p
          className="text-sm font-semibold truncate leading-tight transition-colors duration-200 group-hover:text-[#9D4EDD]"
          style={{
            color: isPlaying ? "#9D4EDD" : "#ccccee",
            fontFamily: "Rajdhani, sans-serif",
          }}
        >
          {title}
        </p>
        {episode && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: "#FF003C" }}>
            {episode}
          </p>
        )}
        <p className="text-xs mt-0.5 truncate" style={{ color: "#8888aa" }}>
          {host}
        </p>
      </div>
    </div>
  );
}
