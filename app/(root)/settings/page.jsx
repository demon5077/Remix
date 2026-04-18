"use client";
import { useEffect, useState } from "react";
import { useYT } from "@/hooks/use-youtube";
import { toast } from "sonner";
import {
  Settings, Volume2, Trash2, Moon, Sun, Music2, Info,
  RefreshCw, Heart, Clock, User, Globe, Bell, Palette,
  ChevronRight, Shield, HelpCircle,
} from "lucide-react";
import { getTheme, toggleTheme } from "@/lib/theme";
import { getSession, clearSession } from "@/lib/session";
import Link from "next/link";

function Section({ title, children }) {
  return (
    <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <p className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)", fontFamily: "Orbitron, sans-serif" }}>{title}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, desc, right, onClick, danger }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: danger ? "rgba(255,0,60,0.1)" : "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <Icon className="w-4 h-4" style={{ color: danger ? "var(--accent)" : "var(--text-secondary)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: danger ? "var(--accent)" : "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>}
      </div>
      <div className="flex-shrink-0">{right || <ChevronRight className="w-4 h-4" style={{ color: "var(--text-faint)" }} />}</div>
    </button>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-all"
      style={{ background: value ? "var(--accent)" : "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
      <div className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
        style={{ background: "#fff", left: value ? "calc(100% - 22px)" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );
}

export default function SettingsPage() {
  const yt = useYT() || {};
  const [theme,       setThemeState]  = useState("dark");
  const [autoplay,    setAutoplay]    = useState(true);
  const [quality,     setQuality]     = useState("high");
  const [language,    setLanguage]    = useState("hindi");
  const [notify,      setNotify]      = useState(false);
  const [crossfade,   setCrossfade]   = useState(0);
  const [session,     setSession]     = useState(null);

  useEffect(() => {
    const t = getTheme();
    setThemeState(t);
    setSession(getSession());
    try {
      const s = JSON.parse(localStorage.getItem("arise:settings") || "{}");
      if (s.autoplay   !== undefined) setAutoplay(s.autoplay);
      if (s.quality)    setQuality(s.quality);
      if (s.language)   setLanguage(s.language);
      if (s.notify !== undefined) setNotify(s.notify);
      if (s.crossfade !== undefined) setCrossfade(s.crossfade);
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
    toast.success("History cleared");
  };

  const clearLikes = () => {
    localStorage.removeItem("arise:yt:likes");
    localStorage.removeItem("remix:likes");
    toast.success("Liked songs cleared");
  };

  const clearCache = () => {
    const keep = ["arise:session:v2","arise:google:tokens","arise:google:profile","arise:spotify:tokens","arise:spotify:profile","arise:imported-playlists","arise:theme","arise:settings"];
    Object.keys(localStorage).forEach(k => { if (!keep.includes(k)) localStorage.removeItem(k); });
    toast.success("Cache cleared — settings and login preserved");
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-xl" style={{ color: "var(--text-primary)" }}>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6" style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>Settings</h1>
      </div>

      {/* Appearance */}
      <Section title="Appearance">
        <Row icon={theme === "dark" ? Sun : Moon}
          label={theme === "dark" ? "Switch to Light (Angel) Theme" : "Switch to Dark (Demon) Theme"}
          desc={theme === "dark" ? "Golden particles · Angelic vibes" : "Crimson glow · Dark atmosphere"}
          right={<Toggle value={theme === "light"} onChange={handleTheme} />}
          onClick={handleTheme} />
      </Section>

      {/* Playback */}
      <Section title="Playback">
        <Row icon={Music2} label="Autoplay"
          desc="Automatically play related songs when queue ends"
          right={<Toggle value={autoplay} onChange={v => { setAutoplay(v); save("autoplay", v); }} />}
          onClick={() => { setAutoplay(a => { save("autoplay", !a); return !a; }); }} />
        <Row icon={Volume2} label="Audio Quality"
          desc={`Current: ${quality === "high" ? "High (320kbps)" : quality === "medium" ? "Medium (160kbps)" : "Low (96kbps)"}`}
          right={
            <select value={quality} onChange={e => { setQuality(e.target.value); save("quality", e.target.value); }}
              className="text-xs px-2 py-1 rounded-lg outline-none"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
              onClick={e => e.stopPropagation()}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          } />
        <Row icon={Music2} label={`Crossfade: ${crossfade}s`}
          desc="Fade between tracks for smooth transitions"
          right={
            <input type="range" min="0" max="12" step="1" value={crossfade}
              onChange={e => { setCrossfade(+e.target.value); save("crossfade", +e.target.value); }}
              onClick={e => e.stopPropagation()}
              className="w-20 accent-[var(--accent)]" />
          } />
      </Section>

      {/* Language */}
      <Section title="Language & Region">
        <Row icon={Globe} label="Music Language"
          desc={`Prefer: ${language}`}
          right={
            <select value={language} onChange={e => { setLanguage(e.target.value); save("language", e.target.value); }}
              className="text-xs px-2 py-1 rounded-lg outline-none"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
              onClick={e => e.stopPropagation()}>
              <option value="hindi">Hindi</option>
              <option value="punjabi">Punjabi</option>
              <option value="english">English</option>
              <option value="all">All Languages</option>
            </select>
          } />
      </Section>

      {/* Account */}
      <Section title="Account">
        {session
          ? <>
              <Row icon={User} label={session.name || "My Account"} desc={session.identifier} right={<Link href="/login" className="text-xs font-bold" style={{ color: "var(--accent)" }}>Manage</Link>} onClick={() => {}} />
              <Row icon={Shield} label="Sign Out" desc="Clear session and log out" danger
                onClick={() => { clearSession(); window.dispatchEvent(new CustomEvent("arise:session:changed")); toast("Signed out"); setSession(null); }} />
            </>
          : <Row icon={User} label="Sign In" desc="Login to sync playlists and history"
              right={<Link href="/login" className="text-xs font-bold" style={{ color: "var(--accent)" }}>Sign In</Link>}
              onClick={() => {}} />}
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Row icon={Bell} label="New Release Alerts"
          desc="Notify about new songs from liked artists"
          right={<Toggle value={notify} onChange={v => { setNotify(v); save("notify", v); }} />}
          onClick={() => { setNotify(n => { save("notify", !n); return !n; }); }} />
      </Section>

      {/* Data */}
      <Section title="Data & Privacy">
        <Row icon={Trash2} label="Clear Listening History" desc="Remove all recently played tracks"
          danger onClick={clearHistory} />
        <Row icon={Heart} label="Clear Liked Songs" desc="Remove all your liked songs"
          danger onClick={clearLikes} />
        <Row icon={RefreshCw} label="Clear App Cache" desc="Free space · keeps login & settings"
          onClick={clearCache} />
      </Section>

      {/* About */}
      <Section title="About">
        <Row icon={Info} label="Arise" desc="Version 1.0.0 · JioSaavn + YouTube + Muzo" onClick={() => {}} />
        <Row icon={HelpCircle} label="About & Credits" right={<Link href="/about" className="text-xs font-bold" style={{ color: "var(--accent)" }}>View</Link>} onClick={() => {}} />
        <Row icon={Shield} label="Privacy Policy" right={<Link href="/privacy" className="text-xs font-bold" style={{ color: "var(--accent)" }}>View</Link>} onClick={() => {}} />
      </Section>
    </div>
  );
}
