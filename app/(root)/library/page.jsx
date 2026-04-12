"use client";
export const dynamic = "force-dynamic";

import { useMusicProvider } from "@/hooks/use-context";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getSongsById } from "@/lib/fetch";
import { useEffect, useState } from "react";
import { Library } from "lucide-react";
import Link from "next/link";

export default function LibraryPage() {
  const { recentlyPlayed, music } = useMusicProvider();
  const [songs, setSongs] = useState({});

  // Fetch song data for recently played IDs
  useEffect(() => {
    const ids = recentlyPlayed.slice(0, 20).map(r => r.id);
    ids.forEach(async (id) => {
      if (songs[id]) return;
      try {
        const res  = await getSongsById(id);
        const json = await res.json();
        const s    = json?.data?.[0];
        if (s) setSongs(prev => ({ ...prev, [id]: s }));
      } catch {}
    });
  }, [recentlyPlayed]);

  const likedIds = (() => {
    try { return JSON.parse(localStorage.getItem("remix:likes") || "[]"); }
    catch { return []; }
  })();

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 space-y-12">
      <div className="reveal-up">
        <div className="flex items-center gap-3 mb-2">
          <Library className="w-6 h-6" style={{ color: "#FF003C" }} />
          <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
            Your Library
          </h1>
        </div>
        <p className="remix-section-title">Your music collection</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/liked",  label: "Liked Songs",      color: "#FF003C", sub: `${likedIds.length} songs` },
          { href: "/recent", label: "Recently Played",  color: "#7C3AED", sub: `${recentlyPlayed.length} tracks` },
        ].map(({ href, label, color, sub }) => (
          <Link
            key={href}
            href={href}
            className="p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
            style={{ background: `linear-gradient(135deg, ${color}22, rgba(18,18,32,0.9))`, border: `1px solid ${color}30` }}
          >
            <p className="font-bold text-sm" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>{label}</p>
            <p className="remix-section-title mt-0.5">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Recent songs grid */}
      {recentlyPlayed.length > 0 && (
        <section>
          <h2 className="text-base font-bold mb-5" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>
            Recently Played
          </h2>
          <ScrollArea>
            <div className="flex gap-4 pb-3">
              {recentlyPlayed.slice(0, 15).map(({ id }) => {
                const s = songs[id];
                return (
                  <SongCard
                    key={id}
                    id={id}
                    image={s?.image?.[2]?.url}
                    title={s?.name || "…"}
                    artist={s?.artists?.primary?.[0]?.name || "…"}
                  />
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {recentlyPlayed.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 rounded-2xl" style={{ background: "rgba(18,18,32,0.5)", border: "1px solid rgba(255,0,60,0.07)" }}>
          <p className="text-3xl mb-3">😈</p>
          <p className="text-sm font-semibold" style={{ color: "#ccccee" }}>Nothing here yet</p>
          <p className="text-xs mt-1" style={{ color: "#8888aa" }}>Start listening to build your library</p>
        </div>
      )}
    </div>
  );
}
