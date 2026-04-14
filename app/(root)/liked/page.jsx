"use client";
export const dynamic = "force-dynamic";

import { getSongsById } from "@/lib/fetch";
import { useMusicProvider } from "@/hooks/use-context";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export default function LikedPage() {
  const { playSong } = useMusicProvider() || {};
  const [likedIds, setLikedIds] = useState([]);
  const [songs, setSongs]       = useState({});

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem("remix:likes") || "[]");
      setLikedIds(ids);
      ids.forEach(async (id) => {
        const res  = await getSongsById(id);
        const json = await res.json();
        const s    = json?.data?.[0];
        if (s) setSongs(prev => ({ ...prev, [id]: s }));
      });
    } catch {}
  }, []);

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Heart className="w-6 h-6 fill-current" style={{ color: "#FF003C" }} />
        <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
          Liked Songs
        </h1>
      </div>
      <p className="remix-section-title mb-8">{likedIds.length} tracks</p>

      {likedIds.length > 0 ? (
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {likedIds.map(id => {
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
      ) : (
        <div className="flex flex-col items-center justify-center h-48 rounded-2xl" style={{ background: "rgba(18,18,32,0.5)", border: "1px solid rgba(255,0,60,0.07)" }}>
          <Heart className="w-10 h-10 mb-3" style={{ color: "#44445a" }} />
          <p className="text-sm font-semibold" style={{ color: "#ccccee" }}>No liked songs yet</p>
          <p className="text-xs mt-1" style={{ color: "#8888aa" }}>Heart a song in the player to save it here</p>
        </div>
      )}
    </div>
  );
}
