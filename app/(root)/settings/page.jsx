"use client";
import { useEffect, useState } from "react";
import { useYT } from "@/hooks/use-youtube";
import { toast } from "sonner";
import {
  Settings, Volume2, Trash2, Moon, Sun, Music2, Info,
  RefreshCw, Heart, Clock, User, Globe, Bell, Shield,
  ChevronRight, HelpCircle, Palette, Zap, Wifi, Download,
  ListMusic, Star, Code, Mail, ExternalLink,
} from "lucide-react";
import { getTheme, toggleTheme } from "@/lib/theme";
import { getSession, clearSession, getImportedPlaylists } from "@/lib/session";
import Link from "next/link";

// ── Sub-components ────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, color }) {
  return (
    <div className="mb-5 rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: color || "var(--accent)" }} />}
        <p className="text-xs font-bold tracking-[0.15em] uppercase"
          style={{ color: "var(--text-muted)", fontFamily: "Orbitron, sans-serif" }}>{title}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, desc, right, onClick, danger, last }) {
  return (
    <button onClick={onClick || (() => {})}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
      style={{ borderBottom: last ? "none" : "1px solid var(--border-subtle)" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      {Icon && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: danger ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
          }}>
          <Icon className="w-4 h-4" style={{ color: danger ? "var(--accent)" : "var(--text-secondary)" }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: danger ? "var(--accent)" : "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>}
      </div>
      <div className="flex-shrink-0 ml-2">{right ?? <ChevronRight className="w-4 h-4" style={{ color: "var(--text-faint)" }} />}</div>
    </button>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={e => { e.stopPropagation(); onChange(!value); }}
      className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200"
      style={{ background: value ? "var(--accent)" : "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
      <div className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
        style={{ left: value ? "calc(100% - 22px)" : "2px", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      {Icon && <Icon className="w-5 h-5 mb-2" style={{ color: color || "var(--accent)" }} />}
      <p className="text-xl font-black" style={{ color: color || "var(--accent)", fontFamily: "Orbitron, sans-serif" }}>{value}</p>
      <p className="text-[10px] mt-1 tracking-[0.15em] uppercase text-center" style={{ color: "var(--text-muted)", fontFamily: "Orbitron, sans-serif" }}>{label}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const yt = useYT() || {};
  const [theme,       setThemeState] = useState("dark");
  const [autoplay,    setAutoplay]   = useState(true);
  const [quality,     setQuality]    = useState("high");
  const [language,    setLanguage]   = useState("hindi");
  const [notify,      setNotify]     = useState(false);
  const [crossfade,   setCrossfade]  = useState(0);
  const [showVideo,   setShowVideo]  = useState(true);
  const [dataStash,   setDataStash]  = useState({ liked: 0, recent: 0, playlists: 0, cache: "0 KB" });
  const [session,     setSession]    = useState(null);

  useEffect(() => {
    setThemeState(getTheme());
    const s = getSession();
    setSession(s);

    // Load settings
    try {
      const saved = JSON.parse(localStorage.getItem("arise:settings") || "{}");
      if (saved.autoplay  !== undefined) setAutoplay(saved.autoplay);
      if (saved.quality)   setQuality(saved.quality);
      if (saved.language)  setLanguage(saved.language);
      if (saved.notify !== undefined) setNotify(saved.notify);
      if (saved.crossfade !== undefined) setCrossfade(saved.crossfade);
      if (saved.showVideo !== undefined) setShowVideo(saved.showVideo);
    } catch {}

    // Count stored data
    try {
      const liked    = JSON.parse(localStorage.getItem("arise:yt:likes") || "[]").length;
      const recent   = JSON.parse(localStorage.getItem("arise:recent")   || "[]").length;
      const playlists= getImportedPlaylists().length + (s?.playlists?.length || 0);
      let cacheBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        cacheBytes += (localStorage.getItem(key) || "").length * 2;
      }
      const cacheKB = (cacheBytes / 1024).toFixed(0);
      setDataStash({ liked, recent, playlists, cache: `${cacheKB} KB` });
    } catch {}

    const handler = (e) => setThemeState(e.detail);
    window.addEventListener("arise:theme:changed", handler);
    return () => window.removeEventListener("arise:theme:changed", handler);
  }, []);

  const save = (key, val) => {
    try {
      const s = JSON.parse(localStorage.getItem("arise:settings") || "{}");
      localStorage.setItem("arise:settings", JSON.stringify({ ...s, [key]: val }));
    } catch {}
  };

  const handleTheme = () => {
    toggleTheme();
    setThemeState(t => t === "dark" ? "light" : "dark");
  };

  const clearHistory = () => {
    localStorage.removeItem("arise:recent");
    localStorage.removeItem("arise:yt:recent");
    localStorage.removeItem("remix:recent");
    setDataStash(d => ({ ...d, recent: 0 }));
    toast.success("Listening history cleared");
  };

  const clearLikes = () => {
    localStorage.removeItem("arise:yt:likes");
    localStorage.removeItem("remix:likes");
    setDataStash(d => ({ ...d, liked: 0 }));
    toast.success("Liked songs cleared");
  };

  const clearCache = () => {
    const keep = ["arise:session:v2","arise:google:tokens","arise:google:profile",
                  "arise:spotify:tokens","arise:spotify:profile","arise:imported-playlists",
                  "arise:theme","arise:settings"];
    Object.keys(localStorage).forEach(k => { if (!keep.includes(k)) localStorage.removeItem(k); });
    toast.success("Cache cleared — settings and login preserved");
  };

  const exportData = () => {
    const data = {
      liked:     JSON.parse(localStorage.getItem("arise:yt:likes") || "[]"),
      recent:    JSON.parse(localStorage.getItem("arise:recent")   || "[]"),
      playlists: getImportedPlaylists(),
      exported:  new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "arise-data.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported!");
  };

  return (
    <div className="px-4 md:px-8 py-8" style={{ color: "var(--text-primary)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6" style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>Settings</h1>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── LEFT COLUMN ─────────────────────────────────────── */}
        <div>
          {/* Appearance */}
          <Section title="Appearance" icon={Palette}>
            <Row icon={theme === "light" ? Moon : Sun}
              label={theme === "dark" ? "Switch to Light ✨ Angel Theme" : "Switch to Dark 🔥 Demon Theme"}
              desc={theme === "dark" ? "Golden particles · Divine vibes · Angelic slogans" : "Crimson glow · Dark atmosphere · Rise from shadows"}
              right={<Toggle value={theme === "light"} onChange={handleTheme} />}
              onClick={handleTheme} />
            <Row icon={Zap} label="Reduce Motion"
              desc="Disable animations for better performance"
              right={<Toggle value={false} onChange={() => toast("Coming soon")} />}
              last onClick={() => {}} />
          </Section>

          {/* Playback */}
          <Section title="Playback" icon={Music2}>
            <Row icon={Music2} label="Autoplay"
              desc="Play related songs when queue ends"
              right={<Toggle value={autoplay} onChange={v => { setAutoplay(v); save("autoplay", v); }} />}
              onClick={() => { setAutoplay(a => { const n = !a; save("autoplay", n); return n; }); }} />
            <Row icon={Volume2} label="Audio Quality"
              desc={`Current: ${quality === "high" ? "High (320kbps)" : quality === "medium" ? "Medium (160kbps)" : "Low (96kbps)"}`}
              right={
                <select value={quality} onChange={e => { setQuality(e.target.value); save("quality", e.target.value); }}
                  onClick={e => e.stopPropagation()}
                  className="text-xs px-2 py-1 rounded-lg outline-none"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", fontFamily: "Rajdhani, sans-serif" }}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              } />
            <Row icon={Wifi} label={`Crossfade: ${crossfade}s`}
              desc="Smooth transition between tracks"
              right={
                <input type="range" min="0" max="12" step="1" value={crossfade}
                  onChange={e => { setCrossfade(+e.target.value); save("crossfade", +e.target.value); }}
                  onClick={e => e.stopPropagation()} className="w-20" />
              } />
            <Row icon={Star} label="Show Video by Default"
              desc="Open video mode when playing YouTube content"
              right={<Toggle value={showVideo} onChange={v => { setShowVideo(v); save("showVideo", v); }} />}
              last onClick={() => { setShowVideo(s => { const n = !s; save("showVideo", n); return n; }); }} />
          </Section>

          {/* Language */}
          <Section title="Language & Region" icon={Globe}>
            <Row icon={Globe} label="Music Language Preference"
              desc={`Currently: ${language}`}
              right={
                <select value={language} onChange={e => { setLanguage(e.target.value); save("language", e.target.value); }}
                  onClick={e => e.stopPropagation()}
                  className="text-xs px-2 py-1 rounded-lg outline-none"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", fontFamily: "Rajdhani, sans-serif" }}>
                  <option value="hindi">Hindi</option>
                  <option value="punjabi">Punjabi</option>
                  <option value="english">English</option>
                  <option value="all">All Languages</option>
                </select>
              } last />
          </Section>

          {/* Notifications */}
          <Section title="Notifications" icon={Bell}>
            <Row icon={Bell} label="New Release Alerts"
              desc="Get notified about new songs from artists you like"
              right={<Toggle value={notify} onChange={v => { setNotify(v); save("notify", v); toast(v ? "Notifications on" : "Notifications off"); }} />}
              last onClick={() => { setNotify(n => { const nv = !n; save("notify", nv); return nv; }); }} />
          </Section>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────── */}
        <div>
          {/* Stats */}
          <Section title="Your Library Stats" icon={Star}>
            <div className="grid grid-cols-2 gap-3 p-4">
              <StatCard label="Liked Songs" value={dataStash.liked}     icon={Heart}     color="var(--accent)"   />
              <StatCard label="Recent"      value={dataStash.recent}    icon={Clock}     color="#9D4EDD"         />
              <StatCard label="Playlists"   value={dataStash.playlists} icon={ListMusic} color="#4285F4"         />
              <StatCard label="Cache"       value={dataStash.cache}     icon={Download}  color="var(--text-muted)"/>
            </div>
          </Section>

          {/* Account */}
          <Section title="Account" icon={User}>
            {session ? (
              <>
                <Row icon={User} label={session.name || "My Account"} desc={session.identifier}
                  right={<Link href="/login" onClick={e => e.stopPropagation()} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>Manage</Link>} />
                <Row icon={Mail} label="Email / Phone" desc={session.identifier || "Not set"}
                  right={null} onClick={() => {}} />
                <Row icon={Shield} label="Sign Out" desc="Clear session and log out" danger last
                  onClick={() => { clearSession(); window.dispatchEvent(new CustomEvent("arise:session:changed")); toast("Signed out"); setSession(null); }} />
              </>
            ) : (
              <Row icon={User} label="Sign In" desc="Login to sync playlists and history across devices"
                right={<Link href="/login" onClick={e => e.stopPropagation()} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "var(--accent)", color: "#fff", fontFamily: "Orbitron, sans-serif" }}>Sign In</Link>}
                last />
            )}
          </Section>

          {/* Data & Privacy */}
          <Section title="Data & Privacy" icon={Shield}>
            <Row icon={Download} label="Export My Data"
              desc="Download liked songs, playlists, and history as JSON"
              right={<ChevronRight className="w-4 h-4" style={{ color: "var(--text-faint)" }} />}
              onClick={exportData} />
            <Row icon={Trash2} label="Clear Listening History"
              desc={`${dataStash.recent} tracks · Removes all recently played`}
              danger onClick={clearHistory} />
            <Row icon={Heart} label="Clear Liked Songs"
              desc={`${dataStash.liked} songs · This cannot be undone`}
              danger onClick={clearLikes} />
            <Row icon={RefreshCw} label="Clear App Cache"
              desc={`${dataStash.cache} used · Keeps login and settings`}
              last onClick={clearCache} />
          </Section>

          {/* About */}
          <Section title="About Arise" icon={Info}>
            <Row icon={Info} label="Version" desc="Arise v1.0.0 · JioSaavn + YouTube + Muzo" right={null} last={false} onClick={() => {}} />
            <Row icon={Code} label="Tech Stack"
              desc="Next.js 14 · Tailwind · Supabase · Resend · Muzo API"
              right={null} onClick={() => {}} />
            <Row icon={Star} label="About & Credits"
              right={<Link href="/about" onClick={e => e.stopPropagation()} className="text-xs font-bold" style={{ color: "var(--accent)" }}>View <ExternalLink className="w-3 h-3 inline" /></Link>}
              onClick={() => {}} />
            <Row icon={Shield} label="Privacy Policy"
              right={<Link href="/privacy" onClick={e => e.stopPropagation()} className="text-xs font-bold" style={{ color: "var(--accent)" }}>View <ExternalLink className="w-3 h-3 inline" /></Link>}
              onClick={() => {}} />
            <Row icon={HelpCircle} label="DMCA"
              right={<Link href="/dmca" onClick={e => e.stopPropagation()} className="text-xs font-bold" style={{ color: "var(--accent)" }}>View <ExternalLink className="w-3 h-3 inline" /></Link>}
              last onClick={() => {}} />
          </Section>
        </div>
      </div>
    </div>
  );
}
