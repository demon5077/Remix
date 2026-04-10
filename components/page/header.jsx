"use client";
import Logo from "./logo";
import Search from "./search";
import { Button } from "../ui/button";
import { ChevronLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const path = usePathname();
  const isHome = path === "/";

  return (
    <header
      className="sticky top-0 z-40 px-5 md:px-8 lg:px-12 h-16 flex items-center gap-4"
      style={{
        background: 'rgba(7,7,13,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,0,60,0.07)',
      }}
    >
      {/* Left: Logo */}
      <div className="flex-shrink-0">
        <Logo />
      </div>

      {/* Center: Search (desktop) */}
      <div className="hidden sm:flex flex-1 max-w-lg mx-auto">
        <Search />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        {!isHome && (
          <Button
            asChild
            size="sm"
            className="rounded-full gap-1.5 text-sm font-semibold h-8 px-3"
            style={{
              background: 'rgba(255,0,60,0.12)',
              border: '1px solid rgba(255,0,60,0.25)',
              color: '#FF003C',
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            <Link href="/">
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </Link>
          </Button>
        )}

        {/* Avatar placeholder */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #8B0000, #7C3AED)',
            boxShadow: '0 0 12px rgba(255,0,60,0.3)',
          }}
          title="Your Profile"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="5" r="3" fill="rgba(255,255,255,0.8)" />
            <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </header>
  );
}
