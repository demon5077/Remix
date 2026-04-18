"use client";
import { useEffect, useState } from "react";
import { useYT } from "@/hooks/use-youtube";
import { muzoTrending, muzoSearch } from "@/lib/muzo";
import { getTrending, hasApiKey } from "@/lib/youtube";
import { Zap, Play, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "all",       label: "🔥 All Trending" },
  { id: "music",     label: "🎵 Music"        },
  { id: "bollywood", label: "🎬 Bollywood"    },
  { id: "punjabi",   label: "🎤 Punjabi"      },
  { id: "lofi",      label: "🌙 Lo-Fi"        },
];

export default function TrendingPage() {
  const yt = useYT() || {};
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("all");

  const loadTrending = async (cat) => {
    setLoading(true);
    setItems([]);
    try {
      let results = [];
      if (cat === "all") {
        const t = await muzoTrending();
        const songs  = (t?.songs  || []).map(s => ({
          id:           s.videoId || s.id,
          title:        s.title   || s.name,
          channelTitle: (s.artists||[]).map(a=>a.name||a).join(", ") || s.artist || "",
          thumbnail:    s.thumbnails?.[0]?.url || s.thumbnail || `https://i.ytimg.com/vi/${s.videoId||s.id}/mqdefault.jpg`,
          views:        s.views || "",
        }));
        const videos = (t?.videos || []).map(v => ({
          id:           v.videoId || v.id,
          title:        v.title   || v.name,
          channelTitle: v.author  || v.channelTitle || "",
          thumbnail:    v.thumbnail || `https://i.ytimg.com/vi/${v.videoId||v.id}/mqdefault.jpg`,
          views:        v.views || "",
        }));
        results = [...songs, ...videos].filter(i => i.id);
        // Fill with RapidAPI if < 10
        if (results.length < 10 && hasApiKey()) {
          const { items: ri } = await getTrending("IN", "music").catch(() => ({ items: [] }));
          results = [...results, ...(ri||[])].slice(0, 30);
        }
      } else {
        const queryMap = {
          music:     "trending music India 2025",
          bollywood: "trending bollywood songs 2025",
          punjabi:   "trending punjabi songs 2025",
          lofi:      "lofi hindi chill music",
        };
        const r = await muzoSearch(queryMap[cat] || cat, "videos", 24);
        results = (r||[]).map(i => ({
          id:           i.videoId || i.id,
          title:        i.title   || i.name,
          channelTitle: (i.artists||[]).map(a=>a.name||a).join(", ") || i.author || "",
          thumbnail:    i.thumbnails?.[0]?.url || i.thumbnail || `https://i.ytimg.com/vi/${i.videoId||i.id}/mqdefault.jpg`,
          views:        i.views || "",
        })).filter(i => i.id);
      }
      setItems(results.slice(0, 30));
    } catch (e) {
      toast.error("Failed to load trending");
    }
    setLoading(false);
  };

  useEffect(() => { loadTrending(category); }, [category]);

  return (
    <div className="px-4 md:px-8 py-8" style={{ color: "var(--text-primary)" }}>
      <div className="flex items-center gap-3 mb-2">
        <Zap className="w-6 h-6" style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>
          Trending India
        </h1>
        <button onClick={() => loadTrending(category)}
          className="ml-auto w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>
        Top trending in India right now
      </p>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: category === c.id ? "var(--accent)" : "var(--bg-card)",
              border:     `1px solid ${category === c.id ? "transparent" : "var(--border-subtle)"}`,
              color:      category === c.id ? "#fff" : "var(--text-secondary)",
              fontFamily: "Rajdhani, sans-serif",
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-video rounded-xl remix-shimmer" />
              <div className="h-3 w-3/4 rounded remix-shimmer" />
              <div className="h-2.5 w-1/2 rounded remix-shimmer" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48">
          <TrendingUp className="w-10 h-10 mb-3" style={{ color: "var(--text-faint)" }} />
          <p style={{ color: "var(--text-muted)" }}>No trending data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item, idx) => (
            <button key={item.id + idx}
              onClick={() => { yt.playVideo?.(item); toast(`▶ ${item.title?.slice(0,40)}`); }}
              className="group text-left space-y-2">
              <div className="relative aspect-video rounded-xl overflow-hidden"
                style={{ background: "var(--bg-card)" }}>
                <img src={item.thumbnail} alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <Play className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: "var(--accent)", color: "#fff", fontFamily: "Orbitron, sans-serif" }}>
                  {idx + 1}
                </div>
              </div>
              <p className="text-xs font-semibold line-clamp-2 leading-tight" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>
                {item.title}
              </p>
              <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{item.channelTitle}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
