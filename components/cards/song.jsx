"use client";
import { useMusicProvider } from "@/hooks/use-context";
import { IoPlay } from "react-icons/io5";
import AddToPlaylist from "@/components/playlist/add-to-playlist";

export default function SongCard({ title, image, artist, id, desc }) {
  const ctx      = useMusicProvider();
  const music    = ctx?.music;
  const playSong = ctx?.playSong;
  const playing  = ctx?.playing;
  const isActive = music === id;

  // Skeleton
  if (!image) {
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
      className="remix-card flex-shrink-0 w-[160px] sm:w-[175px] cursor-pointer group"
      onClick={() => playSong(id)}
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={image}
          alt={title}
          className="blurz w-full h-[160px] sm:h-[175px] object-cover transition-transform duration-500 group-hover:scale-110"
          style={{ background: "rgba(18,18,32,0.6)" }}
        />
        {/* Dark overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)" }}
        />
        {/* Play button / visualizer */}
        <div
          className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
            isActive ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100"
          }`}
          style={{
            background: isActive
              ? "linear-gradient(135deg, #FF003C, #7C3AED)"
              : "rgba(255,0,60,0.9)",
            boxShadow: "0 0 16px rgba(255,0,60,0.6)",
          }}
        >
          {isActive && playing ? (
            <div className="flex items-end gap-[2px] h-4">
              <div className="viz-bar w-[3px] rounded-sm bg-white" style={{ minHeight: "4px" }} />
              <div className="viz-bar w-[3px] rounded-sm bg-white" style={{ minHeight: "4px" }} />
              <div className="viz-bar w-[3px] rounded-sm bg-white" style={{ minHeight: "4px" }} />
              <div className="viz-bar w-[3px] rounded-sm bg-white" style={{ minHeight: "4px" }} />
            </div>
          ) : (
            <IoPlay className="w-4 h-4 text-white -mr-0.5" />
          )}
        </div>

        {/* Active glow border */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ border: "2px solid rgba(255,0,60,0.55)", boxShadow: "inset 0 0 16px rgba(255,0,60,0.15)" }}
          />
        )}
      </div>

      {/* Meta */}
      <div className="mt-2.5 px-0.5">
        <p
          className="text-sm font-semibold truncate leading-tight transition-colors duration-200 group-hover:text-hellfire"
          style={{ color: isActive ? "#FF003C" : "#ccccee", fontFamily: "Rajdhani, sans-serif" }}
        >
          {title}
        </p>
        {desc && <p className="text-xs mt-0.5 truncate" style={{ color: "#8888aa" }}>{desc}</p>}
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs truncate" style={{ color: "#8888aa" }}>{artist}</p>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
            <AddToPlaylist song={{ id, name: title, artist, source: "saavn" }} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
