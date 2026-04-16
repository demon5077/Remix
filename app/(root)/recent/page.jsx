"use client";
export const dynamic = "force-dynamic";

import { useMusicProvider } from "@/hooks/use-context";
import { useYT } from "@/hooks/use-youtube";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { Clock, Play } from "lucide-react";
import Link from "next/link";

export default function RecentPage() {
  const { recentlyPlayed, playSong } = useMusicProvider() || {};
  const { getRecent, playVideo }     = useYT() || {};
  const [ytRecent,  setYtRecent]     = useState([]);

  useEffect(() => {
    if (getRecent) setYtRecent(getRecent().slice(0, 20));
  }, []);

  const saavnRecent = recentlyPlayed || [];

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Clock className="w-6 h-6" style={{ color: "#FF003C" }} />
        <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
          Continue Listening
        </h1>
      </div>
      <p className="remix-section-title mb-8">Pick up where you left off</p>

      {/* Saavn recent */}
      {saavnRecent.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-bold mb-4" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>
            🎵 Recent Saavn Songs
          </h2>
          <ScrollArea>
            <div className="flex gap-4 pb-3">
              {saavnRecent.slice(0, 20).map(({ id }) => (
                <SongCard key={id} id={id} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* YouTube recent */}
      {ytRecent.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-bold mb-4" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>
            🔴 Recent YouTube
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ytRecent.map(item => (
              <button key={item.id} onClick={() => playVideo?.(item)}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all group"
                style={{ background: "rgba(18,18,32,0.7)", border: "1px solid rgba(255,255,255,0.05)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,28,48,0.9)"; e.currentTarget.style.borderColor = "rgba(255,0,60,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(18,18,32,0.7)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}>
                <div className="relative flex-shrink-0">
                  <img src={item.thumbnail} alt={item.title}
                    className="w-16 h-10 rounded-lg object-cover"
                    style={{ background: "rgba(18,18,32,0.8)" }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>{item.title}</p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: "#666688" }}>{item.channelTitle}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {saavnRecent.length === 0 && ytRecent.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 rounded-2xl"
          style={{ background: "rgba(18,18,32,0.5)", border: "1px solid rgba(255,0,60,0.07)" }}>
          <Clock className="w-10 h-10 mb-3" style={{ color: "#44445a" }} />
          <p className="text-sm font-semibold" style={{ color: "#ccccee" }}>Nothing played yet</p>
          <p className="text-xs mt-1" style={{ color: "#666688" }}>
            Start listening — your history appears here
          </p>
          <Link href="/" className="mt-4 text-xs font-bold" style={{ color: "#FF003C" }}>
            Browse Music →
          </Link>
        </div>
      )}
    </div>
  );
}
