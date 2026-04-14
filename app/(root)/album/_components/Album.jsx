"use client";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getAlbumById } from "@/lib/fetch";
import { useMusicProvider } from "@/hooks/use-context";
import { useEffect, useState } from "react";
import { IoPlay } from "react-icons/io5";

export default function Album({ id }) {
  const [data, setData] = useState(null);
  const { playSong, setQueue } = useMusicProvider() || {};

  useEffect(() => {
    getAlbumById(id).then(r => r.json()).then(d => setData(d.data));
  }, []);

  const playAll = () => {
    if (!data?.songs?.length) return;
    const [first, ...rest] = data.songs;
    playSong(first.id);
    setQueue(rest.map(s => s.id));
  };

  if (!data) {
    return (
      <div className="px-5 md:px-8 lg:px-12 py-8">
        <div className="md:flex gap-8 mb-10">
          <div className="remix-shimmer w-full md:w-[200px] md:h-[200px] h-[240px] rounded-2xl flex-shrink-0" />
          <div className="mt-5 md:mt-0 space-y-3 flex-1">
            <div className="remix-shimmer h-7 w-56 rounded" />
            <div className="remix-shimmer h-4 w-40 rounded" />
            <div className="remix-shimmer h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SongCard key={i} />)}
        </div>
      </div>
    );
  }

  const primaryArtists = data.artists?.primary?.map(a => a.name).join(", ") || "Unknown";

  return (
    <div className="px-5 md:px-8 lg:px-12 py-8">
      {/* Hero */}
      <div
        className="relative rounded-2xl p-6 md:p-8 mb-10 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(139,0,0,0.2) 0%, rgba(18,18,32,0.95) 60%, rgba(124,58,237,0.1) 100%)",
          border:     "1px solid rgba(255,0,60,0.1)",
        }}
      >
        {data.image?.[2]?.url && (
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: `url(${data.image[2].url})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(40px)" }}
          />
        )}
        <div className="relative z-10 md:flex gap-8 items-end">
          <img
            src={data.image?.[2]?.url}
            alt={data.name}
            className="blurz w-full md:w-[180px] md:h-[180px] h-[200px] rounded-2xl object-cover flex-shrink-0"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(255,0,60,0.15)" }}
          />
          <div className="mt-5 md:mt-0 space-y-2">
            <p className="remix-section-title">Album</p>
            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>{data.name}</h1>
            {data.description && <p className="text-sm" style={{ color: "#8888aa" }}>{data.description}</p>}
            <p className="text-sm font-semibold" style={{ color: "#ccccee" }}>
              by <span style={{ color: "#FF003C" }}>{primaryArtists}</span>
            </p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-wider" style={{ background: "rgba(139,0,0,0.3)", border: "1px solid rgba(255,0,60,0.25)", color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}>
                {data.songCount} Tracks
              </span>
              {data.language && (
                <span className="px-3 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-wider" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.25)", color: "#9D4EDD", fontFamily: "Orbitron, sans-serif" }}>
                  {data.language}
                </span>
              )}
              {data.year && <span className="text-xs" style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif" }}>{data.year}</span>}
            </div>
            <button
              onClick={playAll}
              className="mt-2 flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-200 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #8B0000, #FF003C)",
                color:      "white",
                fontFamily: "Orbitron, sans-serif",
                fontSize:   "0.65rem",
                letterSpacing: "0.15em",
                boxShadow:  "0 0 20px rgba(255,0,60,0.35)",
              }}
            >
              <IoPlay className="w-3 h-3" /> PLAY ALL
            </button>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <h2 className="text-sm font-bold mb-5 uppercase tracking-wider" style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.15em" }}>
        Tracks
      </h2>
      <ScrollArea>
        <div className="flex gap-4 pb-3">
          {data.songs?.map(song => (
            <SongCard key={song.id} id={song.id} image={song.image?.[2]?.url} title={song.name} artist={song.artists?.primary?.[0]?.name} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden sm:flex" />
      </ScrollArea>
    </div>
  );
}
