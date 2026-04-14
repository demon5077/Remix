"use client";
import { useState } from "react";
import PodcastCard from "@/components/podcast/podcast-card";
import PodcastPlayer from "@/components/podcast/podcast-player";
import Footer from "@/components/page/footer";
import { Mic, TrendingUp, Star } from "lucide-react";

const PODCASTS = [
  {
    id: "p1",
    title: "Arise Sessions",
    host: "Sunil & Guests",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80",
    duration: "1:12:04",
    episode: "Ep 12 · The Anatomy of Darkness",
    category: "Music",
  },
  {
    id: "p2",
    title: "Midnight Code",
    host: "Dev Underground",
    image: "https://images.unsplash.com/photo-1519337265831-281ec6cc8514?w=400&q=80",
    duration: "58:30",
    episode: "Ep 8 · Building in the Dark",
    category: "Tech",
  },
  {
    id: "p3",
    title: "Dark Frequencies",
    host: "Elena Voss",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80",
    duration: "1:04:17",
    episode: "Ep 5 · Signal & Noise",
    category: "Music",
  },
  {
    id: "p4",
    title: "Crime Noir",
    host: "Marcus Black",
    image: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&q=80",
    duration: "47:52",
    episode: "Ep 22 · The Last Witness",
    category: "Crime",
  },
  {
    id: "p5",
    title: "The Void Speaks",
    host: "Anonymous",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
    duration: "1:18:39",
    episode: "Ep 3 · Echoes",
    category: "Philosophy",
  },
  {
    id: "p6",
    title: "Neural Nights",
    host: "AI Research Collective",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80",
    duration: "55:11",
    episode: "Ep 17 · The Consciousness Problem",
    category: "Science",
  },
];

const CATEGORIES = ["All", "Music", "Tech", "Crime", "Philosophy", "Science", "True Crime", "Comedy"];

export default function PodcastsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [playingId,      setPlayingId]      = useState(null);
  const [playerPodcast,  setPlayerPodcast]  = useState(null);

  const filtered = activeCategory === "All"
    ? PODCASTS
    : PODCASTS.filter(p => p.category === activeCategory);

  const handlePlay = (podcast) => {
    setPlayingId(podcast.id);
    setPlayerPodcast(podcast);
  };

  return (
    <div className="min-h-screen" style={{ color: "#ccccee" }}>
      {/* Hero */}
      <section className="relative px-6 md:px-12 pt-14 pb-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(157,78,221,0.1) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4B0082, #9D4EDD)", boxShadow: "0 0 20px rgba(157,78,221,0.4)" }}
          >
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs tracking-[0.3em] uppercase"
              style={{ color: "#9D4EDD", fontFamily: "Orbitron, sans-serif" }}>
              ✦ Now Streaming ✦
            </p>
            <h1 className="text-3xl md:text-5xl font-black leading-none"
              style={{
                fontFamily: "Orbitron, sans-serif",
                background: "linear-gradient(135deg, #9D4EDD, #FF003C)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
              Podcasts
            </h1>
          </div>
        </div>
        <p className="text-sm max-w-md leading-relaxed" style={{ color: "#8888aa" }}>
          Stories, conversations, and signals from the underground. Tune in to voices that speak when others sleep.
        </p>
      </section>

      <div className="mx-6 md:mx-12 h-[1px]"
        style={{ background: "linear-gradient(to right, rgba(157,78,221,0.3), transparent)" }} />

      {/* Category filters */}
      <div className="px-6 md:px-12 py-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => {
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  letterSpacing: "0.04em",
                  background: isActive ? "linear-gradient(135deg, #4B0082, #9D4EDD)" : "rgba(255,255,255,0.04)",
                  color: isActive ? "#ffffff" : "#8888aa",
                  border: isActive ? "1px solid rgba(157,78,221,0.5)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isActive ? "0 0 12px rgba(157,78,221,0.3)" : "none",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured (top 2) */}
      <section className="px-6 md:px-12 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4" style={{ color: "#9D4EDD" }} />
          <h2 className="text-base font-bold" style={{ fontFamily: "Rajdhani, sans-serif", color: "#e8e8f8" }}>
            Featured
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.slice(0, 2).map(pod => (
            <button
              key={pod.id}
              onClick={() => handlePlay(pod)}
              className="flex items-center gap-4 p-3.5 rounded-2xl text-left transition-all duration-300 group"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid " + (playingId === pod.id ? "rgba(157,78,221,0.3)" : "rgba(255,255,255,0.04)"),
                boxShadow: playingId === pod.id ? "0 0 30px rgba(157,78,221,0.1)" : "none",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(157,78,221,0.2)";
                e.currentTarget.style.background = "rgba(157,78,221,0.04)";
              }}
              onMouseLeave={e => {
                if (playingId !== pod.id) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                }
              }}
            >
              <img src={pod.image} alt={pod.title}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate"
                  style={{ color: playingId === pod.id ? "#9D4EDD" : "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>
                  {pod.title}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: "#FF003C" }}>{pod.episode}</p>
                <p className="text-xs mt-0.5" style={{ color: "#8888aa" }}>{pod.host} · {pod.duration}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* All grid */}
      <section className="px-6 md:px-12 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: "#9D4EDD" }} />
          <h2 className="text-base font-bold" style={{ fontFamily: "Rajdhani, sans-serif", color: "#e8e8f8" }}>
            All Podcasts
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {filtered.map(pod => (
            <PodcastCard
              key={pod.id}
              {...pod}
              isPlaying={playingId === pod.id}
              onPlay={() => handlePlay(pod)}
            />
          ))}
        </div>
      </section>

      <Footer />

      {/* Podcast player modal */}
      {playerPodcast && (
        <PodcastPlayer
          podcast={playerPodcast}
          onClose={() => { setPlayerPodcast(null); setPlayingId(null); }}
        />
      )}
    </div>
  );
}
