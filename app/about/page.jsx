"use client";
import { useEffect, useState } from "react";
import Footer from "@/components/page/footer";
import Link from "next/link";
import { getTheme } from "@/lib/theme";

export default function AboutPage() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(getTheme());
    const h = (e) => setTheme(e.detail);
    window.addEventListener("arise:theme:changed", h);
    return () => window.removeEventListener("arise:theme:changed", h);
  }, []);

  const isLight = theme === "light";
  const accent  = isLight ? "#c9a227" : "#FF003C";
  const accent2 = isLight ? "#a07c10" : "#9D4EDD";

  return (
    <div className="min-h-screen" style={{ color: "var(--text-primary)" }}>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative px-6 md:px-14 pt-16 pb-20 overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${isLight ? "rgba(255,215,0,0.14)" : "rgba(139,0,0,0.12)"} 0%, transparent 70%)`, filter: "blur(60px)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${isLight ? "rgba(212,175,55,0.10)" : "rgba(124,58,237,0.09)"} 0%, transparent 70%)`, filter: "blur(60px)" }} />

        <div className="relative z-10 max-w-4xl">
          {/* Theme badge */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{isLight ? "✨" : "🔥"}</span>
            <p className="text-xs tracking-[0.4em] uppercase font-bold"
              style={{ color: accent, fontFamily: "Orbitron, sans-serif" }}>
              {isLight ? "The Angel Speaks" : "The Demon Speaks"}
            </p>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-none"
            style={{
              fontFamily: "Orbitron, sans-serif",
              background: `linear-gradient(135deg, ${accent}, ${accent2})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
            Arise
          </h1>

          <p className="text-xl md:text-2xl font-bold mb-6 leading-relaxed"
            style={{ color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>
            {isLight
              ? "Where the celestial meets the sonic. A divine sanctuary for those who hear beyond the ordinary."
              : "Where darkness meets divinity. A music streaming app born from the shadows, for those who live after midnight."}
          </p>

          {/* Cinematic divider quote */}
          <blockquote className="border-l-4 pl-6 py-2 mb-8"
            style={{ borderColor: accent }}>
            <p className="text-lg italic" style={{ color: "var(--text-muted)", fontFamily: "Rajdhani, sans-serif" }}>
              {isLight
                ? '"Every note is a prayer. Every beat, a pulse of the divine."'
                : '"Every great song is a spell. The right music can summon demons — or banish them."'}
            </p>
          </blockquote>
        </div>
      </section>

      <div className="mx-6 md:mx-14 h-px mb-12"
        style={{ background: `linear-gradient(to right, ${accent}55, ${accent2}55, transparent)` }} />

      {/* ── TWO SOULS ──────────────────────────────────────────────────── */}
      <section className="px-6 md:px-14 mb-16">
        <h2 className="text-2xl font-black mb-8" style={{ fontFamily: "Orbitron, sans-serif", color: "var(--text-primary)" }}>
          ⚔️ Two Souls, One App
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Demon */}
          <div className="p-6 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(139,0,0,0.15), rgba(30,0,50,0.1))", border: "1px solid rgba(255,0,60,0.2)" }}>
            <div className="text-4xl mb-3">🔥</div>
            <h3 className="text-xl font-black mb-2" style={{ fontFamily: "Orbitron, sans-serif", color: "#FF003C" }}>The Demon Theme</h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-muted)", fontFamily: "Rajdhani, sans-serif" }}>
              <em>"Rise from the shadows. The abyss has its own music."</em>
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Crimson glows bleed into deep purple. Fire and smoke particles drift upward from the void. Section headers are incantations — "Voices conjured from the depths." Albums are "grimoires of sound sealed in blood." Dark Energy, Night Drive, Into the Abyss — moods for the relentless soul.
            </p>
          </div>
          {/* Angel */}
          <div className="p-6 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,248,220,0.08))", border: "1px solid rgba(212,175,55,0.3)" }}>
            <div className="text-4xl mb-3">✨</div>
            <h3 className="text-xl font-black mb-2" style={{ fontFamily: "Orbitron, sans-serif", color: "#c9a227" }}>The Angel Theme</h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-muted)", fontFamily: "Rajdhani, sans-serif" }}>
              <em>"Hear the divine. Light carries its own frequency."</em>
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Ivory and cream. Golden dust particles drift skyward like prayers ascending. "Blessed voices of the divine." "Sacred albums of celestial harmony." Morning Bliss, Golden Ragas, Vedic Chants — moods for the luminous soul. Every element transfigured.
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-sm font-semibold" style={{ color: "var(--text-muted)", fontFamily: "Rajdhani, sans-serif" }}>
          One toggle. Two worlds. — The switch is in Settings.
        </p>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <section className="px-6 md:px-14 mb-16">
        <h2 className="text-2xl font-black mb-8" style={{ fontFamily: "Orbitron, sans-serif", color: "var(--text-primary)" }}>
          {isLight ? "✨ Divine Features" : "🎵 Features"}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "🎵", title: "Three Music Sources",      desc: "JioSaavn (100M+ Indian tracks) + YouTube Music + Muzo API for global coverage." },
            { icon: "🎬", title: "YouTube Player",           desc: "One seamless iframe — switch audio/video mode without interrupting playback. Perfect A/V sync." },
            { icon: "🔄", title: "Auto-Queue",               desc: "When a new song starts, related tracks auto-populate the queue via Muzo's recommendation engine." },
            { icon: "📱", title: "Mobile First",             desc: "Full mobile UI with Prev/Play/Next controls. Background playback via Page Visibility API." },
            { icon: isLight ? "✨" : "🔥", title: isLight ? "Angel Theme" : "Demon Theme", desc: isLight ? "Golden dust particles, angelic slogans, sacred mood collections." : "Fire & smoke particles, dark slogans, crimson-purple palette." },
            { icon: "🎙️", title: "Real Podcasts",           desc: "12 categories — Mythology, True Crime India, Cricket, Bollywood, Ayurveda & more via YouTube Music." },
            { icon: "📋", title: "Playlist Management",      desc: "Import .json / .m3u / .csv · Google & Spotify sync · Rename, delete, reorder, add songs." },
            { icon: "🔐", title: "Auth & Sync",              desc: "Email/phone signup with Resend verification · Google OAuth · Supabase DB with file fallback." },
            { icon: "📊", title: "Real-time Stats",          desc: "Liked songs, playlists, recently played — all sync live across Library and Settings." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="p-5 rounded-2xl transition-all"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 20px color-mix(in srgb, ${accent} 15%, transparent)`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div className="text-2xl mb-2">{icon}</div>
              <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIMELINE ───────────────────────────────────────────────────── */}
      <section className="px-6 md:px-14 mb-16">
        <h2 className="text-2xl font-black mb-8" style={{ fontFamily: "Orbitron, sans-serif", color: "var(--text-primary)" }}>
          {isLight ? "📜 Sacred Timeline" : "⚡ The Summoning Timeline"}
        </h2>
        <div className="space-y-4 max-w-2xl">
          {[
            { year: "2023", event: isLight ? "Vision received — a sanctuary for music that transcends." : "Idea born in the void — a music app for those who live after midnight." },
            { year: "2024", event: isLight ? "First light: JioSaavn streams, luminous UI, divine player." : "First build: JioSaavn integration, dark UI skeleton, basic player." },
            { year: "2025 Q1", event: isLight ? "YouTube audio summoned. Full-screen chapel. Sacred playlists." : "YouTube audio added. Full-screen modal. Playlists. Liked songs." },
            { year: "2025 Q2", event: isLight ? "Vedic podcasts, angelic mood filters, golden particles ascend." : "Podcasts, mood filters, fire & smoke particles. Arise v3 released." },
            { year: "2025 Q3", event: isLight ? "The Angel awakens. Golden theme, divine slogans, celestial design." : "The Demon and Angel themes born. Two worlds. One toggle." },
          ].map(({ year, event }) => (
            <div key={year} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-20 pt-0.5">
                <span className="text-xs font-black" style={{ color: accent, fontFamily: "Orbitron, sans-serif" }}>{year}</span>
              </div>
              <div className="flex-1 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>{event}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECH STACK ─────────────────────────────────────────────────── */}
      <section className="px-6 md:px-14 mb-16">
        <h2 className="text-2xl font-black mb-6" style={{ fontFamily: "Orbitron, sans-serif", color: "var(--text-primary)" }}>
          {isLight ? "🔮 The Sacred Architecture" : "⚙️ Built With"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[
            "Next.js 14", "React 18", "Tailwind CSS", "Supabase",
            "JioSaavn API", "YouTube IFrame API", "Muzo Backend", "Resend",
            "Google OAuth", "Spotify OAuth", "Orbitron · Rajdhani", "Canvas API",
          ].map(tech => (
            <div key={tech} className="px-3 py-2.5 rounded-xl text-center text-xs font-bold"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>
              {tech}
            </div>
          ))}
        </div>
      </section>

      {/* ── LEGAL LINKS ────────────────────────────────────────────────── */}
      <section className="px-6 md:px-14 mb-8">
        <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
          <Link href="/privacy" style={{ color: accent }} onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>Privacy Policy</Link>
          <Link href="/terms"   style={{ color: accent }} onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>Terms of Service</Link>
          <Link href="/dmca"    style={{ color: accent }} onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>DMCA</Link>
        </div>
        <p className="mt-4 text-xs" style={{ color: "var(--text-faint)", fontFamily: "Rajdhani, sans-serif" }}>
          {isLight ? "✨ Crafted in light and darkness by Sunil · Arise Music" : "🔥 Crafted in darkness (and light) by Sunil · Arise Music"}
        </p>
      </section>

      <Footer />
    </div>
  );
}
