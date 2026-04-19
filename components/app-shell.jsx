"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/page/logo";
import Search from "@/components/page/search";
import Player from "@/components/cards/player";
import { useYT } from "@/hooks/use-youtube";
import {
  Home, Library, Heart, Clock, Settings, ListMusic,
  Mic, Info, LogIn, Disc3, Users, Music2, Zap, Sun, Moon,
} from "lucide-react";
import AnimatedBackground from "@/components/home/animated-background";
import AngelParticles from "@/components/home/angel-particles";
import { getAnyUser } from "@/lib/session";
import { getTheme, toggleTheme, applyTheme } from "@/lib/theme";

const NAV = [
  { href: "/",          icon: Home,      label: "Home"     },
  { href: "/library",   icon: Library,   label: "Library"  },
  { href: "/liked",     icon: Heart,     label: "Liked"    },
  { href: "/playlists", icon: ListMusic, label: "Playlists"},
  { href: "/albums",    icon: Disc3,     label: "Albums"   },
  { href: "/artists",   icon: Users,     label: "Artists"  },
  { href: "/podcasts",  icon: Mic,       label: "Podcasts" },
  { href: "/trending",  icon: Zap,       label: "Trending" },
];

const SIDEBAR_EXTRA = [
  { href: "/recent",   icon: Clock,    label: "Recently Played" },
  { href: "/settings", icon: Settings, label: "Settings"        },
  { href: "/about",    icon: Info,     label: "About"           },
  { href: "/login",    icon: LogIn,    label: "Profile"         },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms",   label: "Terms"   },
  { href: "/dmca",    label: "DMCA"    },
  { href: "/about",   label: "About"   },
];

export default function AppShell({ children }) {
  const path        = usePathname();
  const { currentVideo } = useYT() || {};
  const hasPlayer   = !!currentVideo;
  const [theme,     setThemeState] = useState("dark");

  useEffect(() => {
    const t = getTheme();
    setThemeState(t);
    applyTheme(t);
    // Also apply to html/body for global CSS selectors
    document.documentElement.setAttribute("data-theme", t);
    document.body.setAttribute("data-theme", t);
    const handler = (e) => {
      setThemeState(e.detail);
      document.documentElement.setAttribute("data-theme", e.detail);
      document.body.setAttribute("data-theme", e.detail);
    };
    window.addEventListener("arise:theme:changed", handler);
    return () => window.removeEventListener("arise:theme:changed", handler);
  }, []);

  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <div className="remix-bg h-screen flex overflow-hidden" data-theme={theme}>
      <AnimatedBackground />
      {theme === "light" && <AngelParticles />}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 h-full overflow-hidden relative z-10"
        style={{ background: "var(--nav-bg)", borderRight: "1px solid var(--border-primary)" }}>

        <div className="px-5 pt-6 pb-4 flex-shrink-0">
          <Logo />
          <p className="mt-1.5 text-[9px] font-bold tracking-[0.25em] uppercase"
            style={{ color: "var(--text-muted)", fontFamily: "Orbitron, sans-serif" }}>
            {theme === "light" ? "✦ Hear the Divine ✦" : "✦ Rise from the Shadows ✦"}
          </p>
        </div>

        <nav className="px-3 flex-shrink-0 space-y-0.5 overflow-y-auto flex-1" style={{ scrollbarWidth: "none" }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  color:      active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? `color-mix(in srgb, var(--accent) 10%, transparent)` : "transparent",
                  fontWeight: active ? "700" : "600",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-card)"; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{label}</span>
              </Link>
            );
          })}

          <div className="my-2 mx-3 h-px" style={{ background: "var(--border-subtle)" }} />

          {SIDEBAR_EXTRA.map(({ href, icon: Icon, label }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm"
                style={{
                  color:      active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? `color-mix(in srgb, var(--accent) 10%, transparent)` : "transparent",
                  fontWeight: active ? "700" : "600",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-card)"; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom: theme toggle + legal ──────────────── */}
        <div className="flex-shrink-0 px-4 pb-4 pt-3"
          style={{ borderTop: "1px solid var(--border-subtle)" }}>

          {/* Theme toggle */}
          <button onClick={handleThemeToggle}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl mb-3 transition-all text-sm font-semibold"
            style={{
              background: theme === "light"
                ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid var(--border-subtle)`,
              color: "var(--accent)",
            }}>
            {theme === "dark"
              ? <><Sun className="w-3.5 h-3.5" /> Switch to Light ✨</>
              : <><Moon className="w-3.5 h-3.5" /> Switch to Dark 🔥</>}
          </button>

          {/* Legal links */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
            {LEGAL.map(({ href, label }) => (
              <Link key={label} href={href}
                className="text-[11px] font-semibold transition-colors"
                style={{ color: "var(--sidebar-bottom-text)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--sidebar-bottom-text)"; }}>
                {label}
              </Link>
            ))}
          </div>
          <p className="text-[11px] font-semibold" style={{ color: "var(--sidebar-bottom-text)" }}>
            {theme === "light" ? "✨ Crafted in light by Sunil" : "🔥 Crafted in darkness by Sunil"}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Arise · JioSaavn + YouTube
          </p>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        <TopBar theme={theme} onThemeToggle={handleThemeToggle} />
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: hasPlayer ? "80px" : "24px" }}>
          {children}
        </main>
      </div>

      <Player />
      <MobileNav path={path} hasPlayer={hasPlayer} />
    </div>
  );
}

function TopBar({ theme, onThemeToggle }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const refresh = () => setUser(getAnyUser());
    refresh();
    window.addEventListener("arise:session:changed", refresh);
    return () => window.removeEventListener("arise:session:changed", refresh);
  }, []);

  return (
    <header className="flex-shrink-0 flex items-center px-4 md:px-6 h-14 gap-4"
      style={{
        background: "var(--topbar-bg)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-primary)",
      }}>
      <div className="md:hidden flex-shrink-0"><Logo size="small" /></div>
      <div className="flex-1 max-w-lg mx-auto"><Search /></div>

      {/* Theme toggle (mobile) */}
      <button onClick={onThemeToggle}
        className="md:hidden w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ color: "var(--accent)", background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </button>

      {/* Avatar */}
      <Link href="/login"
        className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center transition-all hover:scale-105"
        style={{
          background:  user?.avatar ? "transparent" : "linear-gradient(135deg, #8B0000, #7C3AED)",
          boxShadow:   `0 0 12px var(--accent-glow)`,
          border:      user ? "2px solid var(--accent)" : "none",
        }}>
        {user?.avatar
          ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          : user?.name
            ? <span className="text-xs font-black" style={{ color: "#fff", fontFamily: "Orbitron, sans-serif" }}>
                {user.name[0].toUpperCase()}
              </span>
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="5" r="2.5" fill="rgba(255,255,255,0.85)" />
                <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              </svg>}
      </Link>
    </header>
  );
}

function MobileNav({ path, hasPlayer }) {
  const items = [
    { href: "/",          icon: Home,      label: "Home"    },
    { href: "/liked",     icon: Heart,     label: "Liked"   },
    { href: "/playlists", icon: ListMusic, label: "Lists"   },
    { href: "/artists",   icon: Users,     label: "Artists" },
    { href: "/login",     icon: LogIn,     label: "Profile" },
  ];
  return (
    <nav className="md:hidden fixed left-0 right-0 z-40 flex items-center justify-around px-1"
      style={{
        bottom: hasPlayer ? "68px" : "0px", transition: "bottom 0.3s ease",
        background: "var(--nav-bg)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid var(--border-primary)",
        height: "56px",
      }}>
      {items.map(({ href, icon: Icon, label }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
            style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}>
            <Icon className="w-5 h-5" />
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.5rem", letterSpacing: "0.1em" }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
