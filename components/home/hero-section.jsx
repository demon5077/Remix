"use client";
import { useState, useEffect } from "react";
import { IoPlay } from "react-icons/io5";
import { useMusicProvider } from "@/hooks/use-context";
import { useYT } from "@/hooks/use-youtube";
import { getSongsByQuery } from "@/lib/fetch";
import { useRouter } from "next/navigation";
import { getTheme } from "@/lib/theme";

const FEATURED_DARK = [
  {
    id: "dark-energy",
    title: "Dark Energy",
    subtitle: "Playlist · Mood Collection",
    desc: "Industrial beats and midnight frequencies for the relentless.",
    accent: "#FF003C",
    badge: "HOT",
    query: "dark energy hits",
    exploreQuery: "dark energy hits",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    overlay: "rgba(5,5,10",
  },
  {
    id: "night-drive",
    title: "Night Drive",
    subtitle: "Playlist · Mood Collection",
    desc: "Lo-fi and synthwave for roads lit by nothing but instinct.",
    accent: "#9D4EDD",
    badge: "NEW",
    query: "night drive lofi synthwave",
    exploreQuery: "night drive lofi",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
    overlay: "rgba(5,5,10",
  },
  {
    id: "shadow-hours",
    title: "Shadow Hours",
    subtitle: "Playlist · Mood Collection",
    desc: "Jazz, soul, and broken blues for the moments between hours.",
    accent: "#0088FF",
    badge: "DEEP",
    query: "jazz soul midnight",
    exploreQuery: "jazz soul midnight",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80",
    overlay: "rgba(5,5,10",
  },
];

const FEATURED_LIGHT = [
  {
    id: "divine-morning",
    title: "Divine Morning",
    subtitle: "Playlist · Angelic Collection",
    desc: "Peaceful melodies and golden harmonies to start your day with grace.",
    accent: "#d4af37",
    badge: "DIVINE",
    query: "morning meditation spiritual music",
    exploreQuery: "morning meditation music",
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80",
    overlay: "rgba(255,252,220",
  },
  {
    id: "golden-bhajans",
    title: "Golden Bhajans",
    subtitle: "Playlist · Devotional",
    desc: "Sacred hymns and devotional songs that lift the soul to heaven.",
    accent: "#c9a227",
    badge: "SACRED",
    query: "bhajan devotional hindi songs",
    exploreQuery: "bhajan devotional",
    image: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&q=80",
    overlay: "rgba(255,248,210",
  },
  {
    id: "celestial-classical",
    title: "Celestial Classical",
    subtitle: "Playlist · Indian Classical",
    desc: "Ragas and rhythms from the celestial realm of Indian classical music.",
    accent: "#a07c10",
    badge: "PURE",
    query: "indian classical ragas music",
    exploreQuery: "indian classical ragas",
    image: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80",
    overlay: "rgba(255,248,215",
  },
];

export default function HeroSection() {
  const [active,  setActive]  = useState(0);
  const [loading, setLoading] = useState(false);
  const [theme,   setTheme]   = useState("dark");
  const ctx      = useMusicProvider();
  const yt       = useYT() || {};
  const playSong = ctx?.playSong;
  const router   = useRouter();

  useEffect(() => {
    setTheme(getTheme());
    const h = (e) => setTheme(e.detail);
    window.addEventListener("arise:theme:changed", h);
    return () => window.removeEventListener("arise:theme:changed", h);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % 3), 5000);
    return () => clearInterval(t);
  }, []);

  const isLight  = theme === "light";
  const FEATURED = isLight ? FEATURED_LIGHT : FEATURED_DARK;
  const current  = FEATURED[active];
  const overlayBase = isLight ? "rgba(255,250,210" : "rgba(5,5,10";

  const handlePlay = async () => {
    setLoading(true);
    try {
      const res  = await getSongsByQuery(current.query, 1, 5);
      const data = await res?.json();
      const song = data?.data?.results?.[0];
      if (song?.id && playSong) playSong(song.id);
    } catch {}
    finally { setLoading(false); }
  };

  const handleExplore = () => {
    router.push(`/search/${encodeURIComponent(current.exploreQuery)}`);
  };

  return (
    <section className="relative w-full h-[340px] md:h-[400px] overflow-hidden rounded-2xl">
      {/* Background images with crossfade */}
      {FEATURED.map((item, i) => (
        <div key={item.id} className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === active ? 1 : 0 }}>
          <img src={item.image} alt={item.title} className="w-full h-full object-cover"
            style={{ filter: isLight ? "brightness(0.55) saturate(1.1)" : "brightness(0.35) saturate(1.2)" }} />
        </div>
      ))}

      {/* Gradient overlays — theme-aware */}
      <div className="absolute inset-0 transition-all duration-1000"
        style={{ background: `linear-gradient(to right, ${current.accent}44 0%, ${overlayBase},0.6) 50%, ${overlayBase},0.92) 100%)` }} />
      <div className="absolute inset-0"
        style={{ background: `linear-gradient(to top, ${overlayBase},0.98) 0%, transparent 55%)` }} />

      {/* Content */}
      <div className="absolute inset-0 flex items-center px-8 md:px-12">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-black tracking-[0.3em] px-2 py-0.5 rounded"
              style={{ background: current.accent, color: "white", fontFamily: "Orbitron, sans-serif" }}>
              {current.badge}
            </span>
            <span className="text-xs" style={{ color: isLight ? "rgba(80,60,10,0.8)" : "rgba(200,200,220,0.7)", fontFamily: "Rajdhani, sans-serif" }}>
              {current.subtitle}
            </span>
          </div>

          <h1 key={current.id} className="text-4xl md:text-6xl font-black mb-3 leading-none"
            style={{
              fontFamily: "Orbitron, sans-serif",
              color: isLight ? "#2a1a00" : "#ffffff",
              textShadow: `0 0 40px ${current.accent}88`,
              animation: "fadeSlideIn 0.6s ease-out",
            }}>
            {current.title}
          </h1>

          <p className="text-sm mb-6 leading-relaxed"
            style={{ color: isLight ? "rgba(60,45,5,0.85)" : "rgba(200,200,220,0.75)", maxWidth: "380px" }}>
            {current.desc}
          </p>

          <div className="flex items-center gap-3">
            <button onClick={handlePlay} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, ${isLight ? "#8a6500" : "#8B0000"}, ${current.accent})`,
                color: "white",
                fontFamily: "Rajdhani, sans-serif",
                letterSpacing: "0.06em",
                boxShadow: `0 0 20px ${current.accent}55`,
              }}>
              <IoPlay className="w-4 h-4" />
              {loading ? "Loading…" : "Play Now"}
            </button>

            <button onClick={handleExplore}
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: isLight ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.08)",
                border: `1px solid ${isLight ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.12)"}`,
                color: isLight ? "#4a3500" : "rgba(220,220,240,0.85)",
                fontFamily: "Rajdhani, sans-serif",
              }}>
              Explore →
            </button>
          </div>
        </div>
      </div>

      {/* Angelic shimmer line for light theme */}
      {isLight && (
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(to right, transparent, ${current.accent}, transparent)`, opacity: 0.6 }} />
      )}

      {/* Slide indicator dots */}
      <div className="absolute bottom-5 right-8 flex items-center gap-2">
        {FEATURED.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} className="transition-all duration-300"
            style={{
              width: i === active ? "20px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: i === active ? current.accent : isLight ? "rgba(100,70,0,0.3)" : "rgba(255,255,255,0.2)",
            }} />
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
