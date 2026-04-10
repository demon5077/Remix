"use client";
import { useMusicProvider } from "@/hooks/use-context";
import Link from "next/link";
import { Heart, Clock, Music2, Settings } from "lucide-react";

export default function ProfilePage() {
  const { recentlyPlayed, music } = useMusicProvider();

  const likedCount = (() => {
    try { return JSON.parse(localStorage.getItem("remix:likes") || "[]").length; }
    catch { return 0; }
  })();

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 max-w-2xl">
      <div className="reveal-up mb-10">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black"
            style={{
              background: "linear-gradient(135deg, #8B0000, #7C3AED)",
              boxShadow:  "0 0 30px rgba(255,0,60,0.4)",
              fontFamily: "Orbitron, sans-serif",
              color:      "white",
            }}
          >
            😈
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
              Listener
            </h1>
            <p className="remix-section-title mt-1">RemiX Premium Member</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Played",  value: recentlyPlayed.length, icon: Music2,  color: "#FF003C" },
            { label: "Liked",   value: likedCount,            icon: Heart,   color: "#9D4EDD" },
            { label: "Sessions",value: "∞",                   icon: Clock,   color: "#7C3AED" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="p-4 rounded-2xl text-center"
              style={{ background: "rgba(18,18,32,0.7)", border: "1px solid rgba(255,0,60,0.07)" }}
            >
              <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
              <p className="text-xl font-black" style={{ color: "#e8e8f8", fontFamily: "Orbitron, sans-serif" }}>{value}</p>
              <p className="remix-section-title mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="space-y-2">
          {[
            { href: "/liked",    label: "Liked Songs",     icon: Heart  },
            { href: "/recent",   label: "Recently Played", icon: Clock  },
            { href: "/settings", label: "Settings",        icon: Settings },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 hover:scale-[1.01]"
              style={{ background: "rgba(18,18,32,0.7)", border: "1px solid rgba(255,0,60,0.07)" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,0,60,0.2)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,0,60,0.07)"}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#FF003C" }} />
              <span className="text-sm font-semibold" style={{ color: "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
