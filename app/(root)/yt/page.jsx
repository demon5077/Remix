"use client";
import { useEffect, useState } from "react";
import { getTrending } from "@/lib/youtube";
import YTCard from "@/components/youtube/yt-card";
import YTPlayer from "@/components/youtube/yt-player";
import { useYT } from "@/hooks/use-youtube";
import { Music2, TrendingUp } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

function SectionTitle({ label, sub, icon: Icon }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#FF003C" }} />}
      <div>
        <h2 className="text-base font-bold" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}>{label}</h2>
        {sub && <p className="remix-section-title">{sub}</p>}
      </div>
    </div>
  );
}

export default function YTPage() {
  const [trending, setTrending] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const { currentVideo } = useYT();

  useEffect(() => {
    getTrending("US", "music").then(({ items }) => {
      setTrending(items.filter(Boolean).slice(0, 20));
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0">
      {/* Left: content */}
      <div className="flex-1 overflow-y-auto px-5 md:px-8 py-8 space-y-12 min-w-0">
        {/* Hero */}
        <div
          className="reveal-up rounded-2xl px-7 py-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(139,0,0,0.2) 0%, rgba(18,18,32,0.95) 50%, rgba(255,0,0,0.1) 100%)",
            border: "1px solid rgba(255,0,60,0.12)",
          }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,0,0,0.15) 0%, transparent 70%)" }} />
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}>
            YouTube Music
          </p>
          <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
            Stream Videos
          </h1>
          <p className="text-sm" style={{ color: "#8888aa", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}>
            Search and play any YouTube video in the player
          </p>
        </div>

        {/* Trending */}
        <section>
          <SectionTitle label="Trending Music" sub="Top videos right now" icon={TrendingUp} />
          {loading ? (
            <div className="flex gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[200px] space-y-2">
                  <div className="remix-shimmer w-full h-[112px] rounded-xl" />
                  <div className="remix-shimmer h-3.5 w-3/4 rounded" />
                  <div className="remix-shimmer h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <ScrollArea>
              <div className="flex gap-4 pb-3">
                {trending.map((item) => item && <YTCard key={item.id} item={item} />)}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </section>
      </div>

      {/* Right: YT Player panel (desktop) */}
      {currentVideo && (
        <div
          className="hidden lg:flex flex-col flex-shrink-0 w-[380px] border-l overflow-hidden"
          style={{ borderColor: "rgba(255,0,60,0.07)", background: "rgba(5,5,10,0.95)" }}
        >
          <YTPlayer />
        </div>
      )}
    </div>
  );
}
