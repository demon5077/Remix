"use client";
import { Home, SearchIcon, Music2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileMenu() {
  const path = usePathname();

  const navItems = [
    { href: "/",             icon: Home,        label: "Home" },
    { href: "/search/trending", icon: SearchIcon,  label: "Explore" },
    { href: "/search/latest",   icon: Music2,      label: "New" },
  ];

  return (
    <div className="fixed z-40 bottom-[90px] left-0 right-0 sm:hidden flex justify-center pointer-events-none">
      <nav
        className="flex items-center gap-1 px-3 py-2 rounded-2xl pointer-events-auto"
        style={{
          background: 'rgba(13,13,24,0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,0,60,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = path === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200"
              style={{
                color: isActive ? '#FF003C' : '#44445a',
                background: isActive ? 'rgba(255,0,60,0.08)' : 'transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
