"use client";
import { useState, useEffect } from "react";
import { IoPlay } from "react-icons/io5";
import { useMusicProvider } from "@/hooks/use-context";
import { getSongsByQuery } from "@/lib/fetch";
import { useRouter } from "next/navigation";

const FEATURED = [
  {
    id: "dark-energy",
    title: "Dark Energy",
    subtitle: "Playlist · Mood Collection",
    desc: "Industrial beats and midnight frequencies for the relentless.",
    accent: "#FF003C",
    badge: "HOT",
    query: "dark energy hits",
    exploreQuery: "dark+energy+hits",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
  },
  {
    id: "night-drive",
    title: "Night Drive",
    subtitle: "Playlist · Mood Collection",
    desc: "Lo-fi and synthwave for roads lit by nothing but instinct.",
    accent: "#9D4EDD",
    badge: "NEW",
    query: "night drive lofi synthwave",
    exploreQuery: "night+drive+lofi",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
  },
  {
    id: "shadow-hours",
    title: "Shadow Hours",
    subtitle: "Playlist · Mood Collection",
    desc: "Jazz, soul, and broken blues for the moments between hours.",
    accent: "#0088FF",
    badge: "DEEP",
    query: "jazz soul midnight",
    exploreQuery: "jazz+soul+midnight",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80",
  },
];

export default function HeroSection() {
  const [active,    setActive]    = useState(0);
  const [loading,   setLoading]   = useState(false);
  const ctx      = useMusicProvider();
  const playSong = ctx?.playSong;
  const router   = useRouter();

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % FEATURED.length), 5000);
    return () => clearInterval(t);
  }, []);

  const current = FEATURED[active];

  const handlePlay = async () => {
    if (!playSong) return;
    setLoading(true);
    try {
      const res  = await getSongsByQuery(current.query, 1, 5);
      const data = await res?.json();
      const song = data?.data?.results?.[0];
      if (song?.id) playSong(song.id);
    } catch {}
    finally { setLoading(false); }
  };

  const handleExplore = () => {
    router.push(`/search/${current.exploreQuery}`);
  };

  return (
    <section className="relative w-full h-[340px] md:h-[400px] overflow-hidden rounded-2xl">
      {/* Background images with crossfade */}
      {FEATURED.map((item, i) => (
        <div
          key={item.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.35) saturate(1.2)" }}
          />
        </div>
      ))}

      {/* Gradient overlays */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `linear-gradient(to right, ${current.accent}33 0%, rgba(5,5,10,0.7) 50%, rgba(5,5,10,0.95) 100%)`,
        }}
      />
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(5,5,10,1) 0%, transparent 50%)" }} />

      {/* Content */}
      <div className="absolute inset-0 flex items-center px-8 md:px-12">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[9px] font-black tracking-[0.3em] px-2 py-0.5 rounded"
              style={{
                background: current.accent,
                color: "white",
                fontFamily: "Orbitron, sans-serif",
              }}
            >
              {current.badge}
            </span>
            <span className="text-xs" style={{ color: "#8888aa", fontFamily: "Rajdhani, sans-serif" }}>
              {current.subtitle}
            </span>
          </div>

          <h1
            key={current.id}
            className="text-4xl md:text-6xl font-black mb-3 leading-none"
            style={{
              fontFamily: "Orbitron, sans-serif",
              color: "#ffffff",
              textShadow: `0 0 40px ${current.accent}66`,
              animation: "fadeSlideIn 0.6s ease-out",
            }}
          >
            {current.title}
          </h1>

          <p className="text-sm mb-6 leading-relaxed" style={{ color: "#8888aa", maxWidth: "380px" }}>
            {current.desc}
          </p>

          <div className="flex items-center gap-3">
            {/* Play Now — searches Saavn and plays first result */}
            <button
              onClick={handlePlay}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, #8B0000, ${current.accent})`,
                color: "white",
                fontFamily: "Rajdhani, sans-serif",
                letterSpacing: "0.06em",
                boxShadow: `0 0 20px ${current.accent}44`,
              }}
            >
              <IoPlay className="w-4 h-4" />
              {loading ? "Loading…" : "Play Now"}
            </button>

            {/* Explore — navigates to search page */}
            <button
              onClick={handleExplore}
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#ccccee",
                fontFamily: "Rajdhani, sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              Explore →
            </button>
          </div>
        </div>
      </div>

      {/* Slide indicator dots */}
      <div className="absolute bottom-5 right-8 flex items-center gap-2">
        {FEATURED.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="transition-all duration-300"
            style={{
              width: i === active ? "20px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: i === active ? current.accent : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
