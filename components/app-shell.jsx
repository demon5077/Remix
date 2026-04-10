"use client";
/**
 * AppShell — persistent Spotify/YT-Music-style layout.
 * Left sidebar + top header + scrollable main + dual player bars.
 * Audio NEVER unmounts on navigation.
 */
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/page/logo";
import Search from "@/components/page/search";
import Player from "@/components/cards/player";
import YTMiniBar from "@/components/youtube/yt-mini-bar";
import { useMusicProvider } from "@/hooks/use-context";
import { useYT } from "@/hooks/use-youtube";
import {
  Home, Search as SearchIcon, Library, Heart,
  Clock, Settings, Youtube, Music2,
} from "lucide-react";

const NAV_PRIMARY = [
  { href: "/",                 icon: Home,       label: "Home"        },
  { href: "/search/trending",  icon: Music2,     label: "Saavn"       },
  { href: "/yt",               icon: Youtube,    label: "YouTube"     },
  { href: "/library",          icon: Library,    label: "Library"     },
];

const NAV_LIBRARY = [
  { href: "/liked",   icon: Heart,  label: "Liked Songs"    },
  { href: "/recent",  icon: Clock,  label: "Recent"         },
];

export default function AppShell({ children }) {
  const path = usePathname();
  const { music }        = useMusicProvider();
  const { currentVideo } = useYT();
  const hasPlayer = !!music || !!currentVideo;

  return (
    <div className="remix-bg h-screen flex overflow-hidden">

      {/* ── Sidebar (desktop) ────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0 h-full overflow-hidden"
        style={{ background: "rgba(5,5,10,0.97)", borderRight: "1px solid rgba(255,0,60,0.07)" }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 flex-shrink-0">
          <Logo />
        </div>

        {/* Primary nav */}
        <nav className="px-3 flex-shrink-0 space-y-0.5">
          {NAV_PRIMARY.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`remix-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active ? "active" : ""}`}
                style={{
                  color:      active ? "#FF003C" : "#8888aa",
                  background: active ? "rgba(255,0,60,0.08)" : "transparent",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#ccccee"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#8888aa"; }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Library section */}
        <div className="px-3 mt-5 flex-shrink-0">
          <p className="remix-section-title px-3 mb-2">Your Library</p>
          <div className="space-y-0.5">
            {NAV_LIBRARY.map(({ href, icon: Icon, label }) => {
              const active = path === href;
              return (
                <Link key={href} href={href}
                  className={`remix-nav-item flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm ${active ? "active" : ""}`}
                  style={{
                    color:      active ? "#FF003C" : "#8888aa",
                    background: active ? "rgba(255,0,60,0.08)" : "transparent",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#ccccee"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#8888aa"; }}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom */}
        <div className="px-3 pb-4 flex-shrink-0 space-y-0.5">
          <Link href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200"
            style={{ color: "#44445a" }}
            onMouseEnter={e => e.currentTarget.style.color = "#8888aa"}
            onMouseLeave={e => e.currentTarget.style.color = "#44445a"}
          >
            <Settings className="w-3.5 h-3.5 flex-shrink-0" />
            <span style={{ fontFamily: "Rajdhani, sans-serif" }}>Settings</span>
          </Link>
        </div>
      </aside>

      {/* ── Main column ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Top bar */}
        <TopBar path={path} />

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{
            // Push content up enough for all stacked bars
            paddingBottom: hasPlayer ? "80px" : "24px",
          }}
        >
          {children}
        </main>

        {/* Site footer */}
        <SiteFooter />
      </div>

      {/* ── Persistent global players ────────────────────── */}
      {/* Saavn mini player */}
      <Player />
      {/* YouTube mini bar (mobile) */}
      <YTMiniBar />

      {/* ── Mobile bottom nav ────────────────────────────── */}
      <MobileNav path={path} hasPlayer={hasPlayer} />
    </div>
  );
}

function TopBar({ path }) {
  return (
    <header
      className="flex-shrink-0 flex items-center px-4 md:px-6 h-14 gap-4"
      style={{
        background:           "rgba(5,5,10,0.92)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom:         "1px solid rgba(255,0,60,0.06)",
      }}
    >
      {/* Logo (mobile only) */}
      <div className="md:hidden flex-shrink-0">
        <Logo size="small" />
      </div>

      {/* Saavn search */}
      <div className="flex-1 max-w-md mx-auto">
        <Search />
      </div>

      {/* YouTube search shortcut */}
      <Link
        href="/yt/search"
        className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-lg flex-shrink-0 text-xs font-bold transition-all hover:scale-105"
        style={{
          background:    "rgba(255,0,0,0.1)",
          border:        "1px solid rgba(255,0,0,0.2)",
          color:         "#FF4444",
          fontFamily:    "Orbitron, sans-serif",
          letterSpacing: "0.06em",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,0,0,0.2)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,0,0,0.1)"}
      >
        <Youtube className="w-3.5 h-3.5" />
        YT
      </Link>

      {/* Profile */}
      <Link
        href="/profile"
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
        style={{ background: "linear-gradient(135deg, #8B0000, #7C3AED)", boxShadow: "0 0 12px rgba(255,0,60,0.3)" }}
        title="Profile"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="5" r="2.5" fill="rgba(255,255,255,0.85)" />
          <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      </Link>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="flex-shrink-0 px-5 py-2 flex items-center justify-between"
      style={{ borderTop: "1px solid rgba(255,0,60,0.04)" }}>
      <p style={{ color: "#1e1e2e", fontSize: "0.65rem", fontFamily: "Rajdhani, sans-serif" }}>
        RemiX — educational use · JioSaavn + YouTube via RapidAPI
      </p>
      <Link href="https://github.com/r2hu1/MusicHubx" target="_blank"
        style={{ color: "#1e1e2e", fontSize: "0.65rem" }}
        className="hover:text-hellfire transition-colors">
        Source
      </Link>
    </footer>
  );
}

function MobileNav({ path, hasPlayer }) {
  const items = [
    { href: "/",                icon: Home,       label: "Home"    },
    { href: "/search/trending", icon: Music2,     label: "Saavn"   },
    { href: "/yt",              icon: Youtube,    label: "YouTube" },
    { href: "/library",         icon: Library,    label: "Library" },
  ];

  return (
    <nav
      className="md:hidden fixed left-0 right-0 z-40 flex items-center justify-around px-1"
      style={{
        bottom:               hasPlayer ? "68px" : "0px",
        transition:           "bottom 0.3s ease",
        background:           "rgba(5,5,10,0.98)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop:            "1px solid rgba(255,0,60,0.08)",
        height:               "56px",
      }}
    >
      {items.map(({ href, icon: Icon, label }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200"
            style={{ color: active ? "#FF003C" : "#44445a" }}>
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
