"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/page/logo";
import Search from "@/components/page/search";
import Player from "@/components/cards/player";
import { useMusicProvider } from "@/hooks/use-context";
import { useYT } from "@/hooks/use-youtube";
import { Home, Search as SearchIcon, Library, Heart, Clock, Settings, ListMusic, Mic, Info, LogIn } from "lucide-react";
import AnimatedBackground from "@/components/home/animated-background";

const NAV = [
  { href: "/",          icon: Home,       label: "Home"      },
  { href: "/search",    icon: SearchIcon, label: "Search"    },
  { href: "/library",   icon: Library,    label: "Library"   },
  { href: "/liked",     icon: Heart,      label: "Liked"     },
  { href: "/playlists", icon: ListMusic,  label: "Playlists" },
  { href: "/podcasts",  icon: Mic,        label: "Podcasts"  },
];

const SIDEBAR_EXTRA = [
  { href: "/recent",   icon: Clock,    label: "Recently Played" },
  { href: "/settings", icon: Settings, label: "Settings"        },
  { href: "/about",    icon: Info,     label: "About"           },
  { href: "/login",    icon: LogIn,    label: "Login"           },
];

const SIDEBAR_BOTTOM = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms",   label: "Terms"          },
  { href: "/about",   label: "About"          },
];

export default function AppShell({ children }) {
  const path            = usePathname();
  const { music }       = useMusicProvider() || {};
  const { currentVideo} = useYT() || {};
  const hasPlayer       = !!music || !!currentVideo;

  return (
    <div className="remix-bg h-screen flex overflow-hidden">
      <AnimatedBackground />

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0 h-full overflow-hidden relative z-10"
        style={{ background: "rgba(5,5,10,0.97)", borderRight: "1px solid rgba(255,0,60,0.07)" }}
      >
        <div className="px-5 pt-6 pb-5 flex-shrink-0"><Logo /></div>

        {/* Main nav */}
        <nav className="px-3 flex-shrink-0 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`remix-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active ? "active" : ""}`}
                style={{ color: active ? "#FF003C" : "#aaaacc", background: active ? "rgba(255,0,60,0.08)" : "transparent" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#ffffff"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#aaaacc"; }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* More section */}
        <div className="px-3 mt-5 flex-shrink-0">
          <p className="px-3 mb-2 text-[0.6rem] font-bold tracking-[0.2em] uppercase"
            style={{ color: "#666688", fontFamily: "Orbitron, sans-serif" }}>
            More
          </p>
          <div className="space-y-0.5">
            {SIDEBAR_EXTRA.map(({ href, icon: Icon, label }) => {
              const active = path === href;
              return (
                <Link key={href} href={href}
                  className={`remix-nav-item flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${active ? "active" : ""}`}
                  style={{ color: active ? "#FF003C" : "#aaaacc", background: active ? "rgba(255,0,60,0.08)" : "transparent" }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#aaaacc"; }}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-semibold">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1" />

        {/* Bottom legal links */}
        <div className="px-5 pb-5 flex-shrink-0 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)", paddingTop: "14px" }}>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {SIDEBAR_BOTTOM.map(({ href, label }) => (
              <Link key={label} href={href}
                className="text-[11px] font-semibold transition-colors duration-150"
                style={{ color: "#7777aa" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#7777aa"; }}
              >
                {label}
              </Link>
            ))}
          </div>
          <p style={{ color: "#555577", fontSize: "0.6rem", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}>
            Arise · JioSaavn + YouTube
          </p>
          <p style={{ color: "#444466", fontSize: "0.55rem", fontFamily: "Rajdhani, sans-serif" }}>
            Crafted in darkness by Sunil
          </p>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        <TopBar />
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: hasPlayer ? "80px" : "24px" }}>
          {children}
        </main>
      </div>

      <Player />
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
      <Link href="/login"
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
    { href: "/",          icon: Home,       label: "Home"    },
    { href: "/search",    icon: SearchIcon, label: "Search"  },
    { href: "/podcasts",  icon: Mic,        label: "Podcasts"},
    { href: "/playlists", icon: ListMusic,  label: "Lists"   },
    { href: "/login",     icon: LogIn,      label: "Login"   },
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
            style={{ color: active ? "#FF003C" : "#7777aa" }}>
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
