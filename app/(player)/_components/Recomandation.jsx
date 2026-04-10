"use client";
import Next from "@/components/cards/next";
import { getSongsSuggestions } from "@/lib/fetch";
import { useNextMusicProvider } from "@/hooks/use-context";
import { useEffect, useState } from "react";

export default function Recomandation({ id }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const next = useNextMusicProvider();

  useEffect(() => {
    getSongsSuggestions(id, 15)
      .then(r => r.json())
      .then(res => {
        if (res?.data) {
          setData(res.data);
          const d = res.data[Math.floor(Math.random() * res.data.length)];
          if (d) next.setNextData({ id: d.id, name: d.name, artist: d.artists?.primary?.[0]?.name || "Unknown", album: d.album?.name, image: d.image?.[1]?.url });
        } else { setData(false); }
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <section className="px-5 md:px-8 lg:px-12 pb-10 mt-2">
      <div className="mb-5">
        <h2 className="text-base font-bold" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>You Might Like</h2>
        <p className="remix-section-title">Summoned from the abyss</p>
      </div>
      {loading && (
        <div className="grid sm:grid-cols-2 gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="remix-shimmer h-[58px] rounded-xl" style={{ animationDelay: `${i * 0.05}s` }} />)}
        </div>
      )}
      {!loading && data && data.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-2.5">
          {data.map(song => (
            <Next key={song.id} next={false} image={song.image?.[1]?.url || song.image?.[0]?.url} name={song.name} artist={song.artists?.primary?.[0]?.name || "Unknown"} id={song.id} />
          ))}
        </div>
      )}
      {!loading && !data && (
        <div className="flex items-center justify-center h-28 rounded-xl" style={{ background: "rgba(18,18,32,0.4)", border: "1px solid rgba(255,0,60,0.07)" }}>
          <p className="text-sm" style={{ color: "#44445a" }}>No suggestions for this track.</p>
        </div>
      )}
    </section>
  );
}
