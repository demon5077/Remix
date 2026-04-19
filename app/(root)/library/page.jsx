"use client";
export const dynamic = "force-dynamic";

import { useYT } from "@/hooks/use-youtube";
import { getSongsById } from "@/lib/fetch";
import { useEffect, useState } from "react";
import { Library, Heart, Clock, ListMusic, Music2, Play, Disc3, Users } from "lucide-react";
import Link from "next/link";
import { getUnifiedRecent } from "@/components/providers/music-provider";
import { getImportedPlaylists, getSession } from "@/lib/session";

export default function LibraryPage() {
  const yt = useYT() || {};
  const [recent,    setRecent]    = useState([]);
  const [likedCnt,  setLikedCnt]  = useState(0);
  const [plCnt,     setPlCnt]     = useState(0);
  const [session,   setSession_]  = useState(null);

  useEffect(() => {
    const r = getUnifiedRecent().slice(0, 16);
    setRecent(r);
    const liked = (() => { try { return JSON.parse(localStorage.getItem("arise:yt:likes") || "[]").length; } catch { return 0; } })();
    const sLiked = (() => { try { return JSON.parse(localStorage.getItem("remix:likes") || "[]").length; } catch { return 0; } })();
    setLikedCnt(liked + sLiked);
    const s = getSession();
    setSession_(s);
    const imported = getImportedPlaylists().length;
    const userPls  = s?.playlists?.length || 0;
    setPlCnt(imported + userPls);
  }, []);

  const QUICK_LINKS = [
    { href: "/liked",     label: "Liked Songs",      icon: Heart,     color: "var(--accent)",  sub: `${likedCnt} songs` },
    { href: "/recent",    label: "Recently Played",  icon: Clock,     color: "#9D4EDD",        sub: `${recent.length} tracks` },
    { href: "/playlists", label: "My Playlists",     icon: ListMusic, color: "#4285F4",        sub: `${plCnt} playlists` },
    { href: "/albums",    label: "Albums",           icon: Disc3,     color: "#1DB954",        sub: "Browse albums" },
    { href: "/artists",   label: "Artists",          icon: Users,     color: "#FF4444",        sub: "Browse artists" },
    { href: "/podcasts",  label: "Podcasts",         icon: Music2,    color: "#FF9500",        sub: "Listen & learn" },
  ];

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 space-y-10" style={{ color: "var(--text-primary)" }}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Library className="w-6 h-6" style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif", color: "var(--text-primary)" }}>
            Your Library
          </h1>
        </div>
        {session && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Welcome back, {session.name}</p>}
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {QUICK_LINKS.map(({ href, label, icon: Icon, color, sub }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.borderColor = color; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recently played */}
      {recent.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>
              ⏱ Recently Played
            </h2>
            <Link href="/recent" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>See all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recent.slice(0, 8).map((item, i) => {
              const ytId  = item.ytId || (/^[A-Za-z0-9_-]{11}$/.test(item.id||"") ? item.id : null);
              const thumb = item.thumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg` : null);
              const name  = item.name || item.title || "Unknown";
              return (
                <button key={i}
                  onClick={() => { if (ytId) yt.playVideo?.({ id: ytId, title: name, channelTitle: item.artist||"", thumbnail: thumb }); }}
                  className="flex items-center gap-3 p-3 rounded-xl text-left group transition-all"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--bg-card)"}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--bg-elevated)" }}>
                    {thumb
                      ? <img src={thumb} alt={name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Music2 className="w-4 h-4" style={{ color: "var(--text-faint)" }} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{item.artist || ""}</p>
                  </div>
                  <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "var(--accent)" }} />
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 rounded-2xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-3xl mb-3">{session ? "🎵" : "😈"}</p>
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Nothing here yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Start listening to build your library</p>
        </div>
      )}
    </div>
  );
}
