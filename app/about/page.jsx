"use client";
import Footer from "@/components/page/footer";
import Link from "next/link";

const FEATURES = [
  { icon: "🎵", title: "Infinite Music",      desc: "Millions of tracks from JioSaavn — Hindi, English, regional. All genres, all moods." },
  { icon: "📺", title: "YouTube Integration", desc: "Stream any YouTube video as audio or watch full videos without leaving the app." },
  { icon: "🎙️", title: "Podcasts",            desc: "Explore a curated library of podcasts across storytelling, tech, crime, and more." },
  { icon: "❤️", title: "Like & Collect",      desc: "Heart tracks you love. They live in your Liked Songs forever." },
  { icon: "🎨", title: "Dark by Default",     desc: "Built for the night. A gothic interface that never burns your eyes." },
  { icon: "🔮", title: "Mood Playlists",      desc: "Dark Energy. Night Drive. Shadow Hours. Curated for your state of mind." },
];

const TIMELINE = [
  { year: "2023", event: "Idea born — a music app for those who live after midnight." },
  { year: "2024", event: "First build: JioSaavn integration, dark UI skeleton, basic player." },
  { year: "2025", event: "YouTube audio added. Full-screen modal. Playlists. Liked songs." },
  { year: "2025", event: "Podcasts, mood filters, animated backgrounds. Arise v3 released." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ color: "#ccccee" }}>

      {/* Hero */}
      <section className="relative px-6 md:px-12 pt-16 pb-20 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,0,0,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative max-w-3xl">
          <p className="text-xs tracking-[0.4em] uppercase mb-3"
            style={{ color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}>
            ✦ Our Story ✦
          </p>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-none"
            style={{
              fontFamily: "Orbitron, sans-serif",
              background: "linear-gradient(135deg, #FF003C 0%, #9D4EDD 60%, #FF003C 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              filter: "drop-shadow(0 0 30px rgba(255,0,60,0.3))",
            }}>
            Arise
          </h1>
          <p className="text-lg leading-relaxed max-w-xl" style={{ color: "#8888aa" }}>
            Born in the stillness after midnight. Built for those who find truth in darkness — in the low hum of a bass line, the crackle of a late-night playlist, the echo of a voice that speaks when the world sleeps.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-6 md:mx-12 h-[1px]" style={{ background: "linear-gradient(to right, rgba(255,0,60,0.3), transparent)" }} />

      {/* Vision */}
      <section className="px-6 md:px-12 py-16 max-w-4xl">
        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
          The Vision
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <p className="text-sm leading-relaxed" style={{ color: "#8888aa" }}>
            Music isn't background noise. It's architecture. It shapes emotion, memory, and thought. Arise was built on the belief that the interface through which you experience music should feel as intense as the music itself — not sterile white cards on a pale screen, but deep blacks, blood reds, and electric glows that pulse with every beat.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#8888aa" }}>
            We integrate JioSaavn's vast catalog with YouTube's infinite archive, giving you one unified experience. Add podcasts, mood playlists, and a player that responds to every interaction with cinema-grade motion — and you have something that goes beyond a streaming app. Arise is an experience.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 md:px-12 py-12">
        <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
          What Arise Offers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="p-5 rounded-2xl transition-all duration-300 group"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,0,60,0.06)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(255,0,60,0.2)";
                e.currentTarget.style.background = "rgba(255,0,60,0.04)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(255,0,60,0.06)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255,0,60,0.06)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="font-bold text-sm mb-2" style={{ fontFamily: "Rajdhani, sans-serif", color: "#e8e8f8", letterSpacing: "0.04em" }}>
                {title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "#8888aa" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 md:px-12 py-12">
        <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
          The Journey
        </h2>
        <div className="relative">
          <div className="absolute left-[38px] top-0 bottom-0 w-[1px]"
            style={{ background: "linear-gradient(to bottom, rgba(255,0,60,0.4), rgba(157,78,221,0.2), transparent)" }} />
          <div className="space-y-8">
            {TIMELINE.map(({ year, event }) => (
              <div key={year + event} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-[76px] flex justify-end">
                  <span className="text-xs font-black" style={{ fontFamily: "Orbitron, sans-serif", color: "#FF003C" }}>
                    {year}
                  </span>
                </div>
                <div className="flex-shrink-0 w-3 h-3 rounded-full mt-0.5 relative z-10"
                  style={{ background: "linear-gradient(135deg, #8B0000, #FF003C)", boxShadow: "0 0 8px rgba(255,0,60,0.5)" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#8888aa" }}>{event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator */}
      <section className="px-6 md:px-12 py-12 mb-4">
        <div
          className="max-w-lg p-8 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(139,0,0,0.08), rgba(124,58,237,0.06))",
            border: "1px solid rgba(255,0,60,0.12)",
            boxShadow: "0 0 60px rgba(255,0,60,0.05)",
          }}
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}>
            ✦ Creator ✦
          </p>
          <h3 className="text-3xl font-black mb-3" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
            Sunil
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "#8888aa" }}>
            A developer who believes code is craft, and interfaces are art. Arise began as a personal project — a music player that matched a late-night mindset — and grew into something more. Every pixel was considered. Every animation was earned.
          </p>
          <p className="text-xs mt-4" style={{ color: "#44445a", fontFamily: "Rajdhani, sans-serif" }}>
            "Build things that make you feel something."
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
