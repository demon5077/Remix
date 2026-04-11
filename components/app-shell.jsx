"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/page/logo";
import Search from "@/components/page/search";
import Player from "@/components/cards/player";
import { useMusicProvider } from "@/hooks/use-context";
import { useYT } from "@/hooks/use-youtube";
import { Home, Search as SearchIcon, Library, Heart, Clock, Settings } from "lucide-react";

const NAV = [
  { href: "/",       icon: Home,       label: "Home"    },
  { href: "/search", icon: SearchIcon, label: "Search"  },
  { href: "/library",icon: Library,    label: "Library" },
  { href: "/liked",  icon: Heart,      label: "Liked"   },
];

const SIDEBAR_EXTRA = [
  { href: "/recent",   icon: Clock,    label: "Recently Played" },
  { href: "/settings", icon: Settings, label: "Settings"        },
];

export default function AppShell({ children }) {
  const path            = usePathname();
  const { music }       = useMusicProvider();
  const { currentVideo} = useYT();
  const hasPlayer       = !!music || !!currentVideo;

  return (
    <div className="remix-bg h-screen flex overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 h-full overflow-hidden"
        style={{ background: "rgba(5,5,10,0.97)", borderRight: "1px solid rgba(255,0,60,0.07)" }}>

        <div className="px-5 pt-6 pb-5 flex-shrink-0"><Logo /></div>

        <nav className="px-3 flex-shrink-0 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`remix-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active ? "active" : ""}`}
                style={{ color: active ? "#FF003C" : "#8888aa", background: active ? "rgba(255,0,60,0.08)" : "transparent" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#ccccee"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#8888aa"; }}>
                <Icon className="w-4 h-4 flex-shrink-0" /><span className="text-sm">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 mt-5 flex-shrink-0">
          <p className="remix-section-title px-3 mb-2">More</p>
          <div className="space-y-0.5">
            {SIDEBAR_EXTRA.map(({ href, icon: Icon, label }) => {
              const active = path === href;
              return (
                <Link key={href} href={href}
                  className={`remix-nav-item flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${active ? "active" : ""}`}
                  style={{ color: active ? "#FF003C" : "#8888aa", background: active ? "rgba(255,0,60,0.08)" : "transparent" }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#ccccee"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#8888aa"; }}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" /><span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1" />

        <div className="px-5 pb-4 flex-shrink-0">
          <p style={{ color: "#1e1e2e", fontSize: "0.6rem", fontFamily: "Rajdhani, sans-serif" }}>
            RemiX · Powered by JioSaavn + YouTube
          </p>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: hasPlayer ? "80px" : "24px" }}>
          {children}
        </main>
      </div>

      {/* ── Unified player (both sources, never unmounts) ─ */}
      <Player />

      {/* ── Mobile nav ──────────────────────────────────── */}
      <MobileNav path={path} hasPlayer={hasPlayer} />
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex-shrink-0 flex items-center px-4 md:px-6 h-14 gap-4"
      style={{
        background: "rgba(5,5,10,0.92)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,0,60,0.06)",
      }}>
      <div className="md:hidden flex-shrink-0"><Logo size="small" /></div>
      <div className="flex-1 max-w-lg mx-auto"><Search /></div>
      <Link href="/profile"
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
        style={{ background: "linear-gradient(135deg, #8B0000, #7C3AED)", boxShadow: "0 0 12px rgba(255,0,60,0.3)" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="5" r="2.5" fill="rgba(255,255,255,0.85)" />
          <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      </Link>
    </header>
  );
}

function MobileNav({ path, hasPlayer }) {
  const items = [
    { href: "/",        icon: Home,       label: "Home"    },
    { href: "/search",  icon: SearchIcon, label: "Search"  },
    { href: "/library", icon: Library,    label: "Library" },
    { href: "/liked",   icon: Heart,      label: "Liked"   },
  ];
  return (
    <nav className="md:hidden fixed left-0 right-0 z-40 flex items-center justify-around px-1"
      style={{
        bottom: hasPlayer ? "68px" : "0px", transition: "bottom 0.3s ease",
        background: "rgba(5,5,10,0.98)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,0,60,0.08)",
        height: "56px",
      }}>
      {items.map(({ href, icon: Icon, label }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
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
