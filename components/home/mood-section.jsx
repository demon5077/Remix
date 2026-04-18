"use client";
import { useRouter } from "next/navigation";

const MOODS = [
  { id: "dark-energy",  title: "Dark Energy",      desc: "Industrial · Techno · Rage",         gradient: "linear-gradient(135deg, #1a0000, #8B0000)",  glow: "rgba(255,0,60,0.3)",   icon: "⚡", query: "dark energy beats" },
  { id: "night-drive",  title: "Night Drive",       desc: "Synthwave · Retrowave · Lo-Fi",      gradient: "linear-gradient(135deg, #0d001f, #4B0082)",  glow: "rgba(157,78,221,0.3)", icon: "🌙", query: "night drive lofi synthwave" },
  { id: "shadow-hours", title: "Shadow Hours",      desc: "Jazz · Soul · Neo-Soul",             gradient: "linear-gradient(135deg, #001122, #003366)",  glow: "rgba(0,100,255,0.25)", icon: "🌊", query: "jazz soul midnight" },
  { id: "abyss",        title: "Into the Abyss",    desc: "Ambient · Post-Rock · Cinematic",    gradient: "linear-gradient(135deg, #050508, #1a1a2e)",  glow: "rgba(100,100,200,0.2)",icon: "🔮", query: "ambient cinematic music" },
  { id: "bloodlust",    title: "Bloodlust",          desc: "Metal · Hardcore · Death Rock",      gradient: "linear-gradient(135deg, #3B0000, #660000)",  glow: "rgba(200,0,0,0.3)",   icon: "🩸", query: "metal hardcore rock" },
  { id: "void",         title: "The Void",           desc: "Drone · Dark Ambient · Experimental",gradient: "linear-gradient(135deg, #030305, #111120)", glow: "rgba(80,0,180,0.2)",  icon: "∅", query: "dark ambient experimental" },
];

export default function MoodSection() {
  const router = useRouter();

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}>
            Mood Playlists
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Curated for your state of mind</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {MOODS.map(({ id, title, desc, gradient, glow, icon, query }) => (
          <button
            key={id}
            onClick={() => router.push(`/search/${encodeURIComponent(query)}`)}
            className="group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 h-[90px]"
            style={{ background: gradient, border: "1px solid rgba(255,255,255,0.04)" }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = `0 0 30px ${glow}`;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          >
            <span className="text-2xl absolute top-3 right-3 opacity-40 group-hover:opacity-70 transition-opacity">
              {icon}
            </span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)" }} />
            <div className="relative z-10">
              <p className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}>
                {title}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
