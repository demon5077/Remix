"use client";
export const dynamic = "force-dynamic";

import { getSongsById } from "@/lib/fetch";
import { useYT } from "@/hooks/use-youtube";
import { useMusicProvider } from "@/hooks/use-context";
import { useEffect, useState } from "react";
import { Heart, Play, Music2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getSession, saveSession } from "@/lib/session";

const LIKES_KEY = "arise:yt:likes";
const SAAVN_LIKES = "remix:likes";

export default function LikedPage() {
  const yt    = useYT() || {};
  const saavn = useMusicProvider() || {};
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const ytLikes    = (() => { try { return JSON.parse(localStorage.getItem(LIKES_KEY)  || "[]"); } catch { return []; } })();
    const saavnIds   = (() => { try { return JSON.parse(localStorage.getItem(SAAVN_LIKES)|| "[]"); } catch { return []; } })();

    // YT likes already have full metadata
    const ytItems = ytLikes.map(v => ({
      id:        v.id,
      ytId:      v.id,
      name:      v.title       || v.name,
      title:     v.title       || v.name,
      artist:    v.channelTitle|| v.artist || "",
      thumbnail: v.thumbnail   || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
      source:    "youtube",
    }));

    // Saavn likes need metadata fetch
    const saavnItems = await Promise.all(saavnIds.slice(0, 20).map(async (id) => {
      try {
        const res  = await getSongsById(id);
        const json = await res.json();
        const s    = json?.data?.[0];
        if (!s) return null;
        return {
          id,
          saavnId: id,
          name:    s.name,
          title:   s.name,
          artist:  s.artists?.primary?.[0]?.name || "",
          thumbnail: s.image?.[1]?.url || s.image?.[0]?.url || null,
          source:  "saavn",
        };
      } catch { return null; }
    }));

    const all = [...ytItems, ...saavnItems.filter(Boolean)];
    setItems(all);

    // Sync count to session profile
    const session = getSession();
    if (session && session.likedSongs?.length !== all.length) {
      saveSession({ ...session, likedSongs: all.map(i => i.id) });
      window.dispatchEvent(new CustomEvent("arise:session:changed"));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const unlike = (item) => {
    if (item.source === "youtube") {
      const ytLikes = JSON.parse(localStorage.getItem(LIKES_KEY) || "[]").filter(v => v.id !== item.id);
      localStorage.setItem(LIKES_KEY, JSON.stringify(ytLikes));
    } else {
      const ids = JSON.parse(localStorage.getItem(SAAVN_LIKES) || "[]").filter(id => id !== item.id);
      localStorage.setItem(SAAVN_LIKES, JSON.stringify(ids));
    }
    setItems(prev => {
      const updated = prev.filter(i => i.id !== item.id);
      // Sync to session
      const session = getSession();
      if (session) {
        saveSession({ ...session, likedSongs: updated.map(i => i.id) });
        window.dispatchEvent(new CustomEvent("arise:session:changed"));
      }
      return updated;
    });
    toast("Removed from liked songs");
  };

  const play = (item) => {
    if (item.source === "youtube" && item.ytId) {
      yt.playVideo?.({ id: item.ytId, title: item.name, channelTitle: item.artist, thumbnail: item.thumbnail });
    } else if (item.source === "saavn" && item.saavnId) {
      saavn.playSong?.(item.saavnId);
    }
    toast(`▶ ${item.name?.slice(0, 40)}`);
  };

  return (
    <div className="px-4 md:px-8 py-8" style={{ color: "var(--text-primary)" }}>
      <div className="flex items-center gap-3 mb-2">
        <Heart className="w-6 h-6 fill-current" style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>Liked Songs</h1>
        {items.length > 0 && (
          <button onClick={() => { yt.playVideo?.(items.find(i => i.ytId)); yt.setQueue?.(items.filter(i => i.ytId).slice(1)); toast("Playing liked songs"); }}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: "var(--accent)", color: "#fff", fontFamily: "Orbitron, sans-serif", boxShadow: "0 0 16px var(--accent-glow)" }}>
            <Play className="w-3.5 h-3.5" /> Play All
          </button>
        )}
      </div>
      <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>{items.length} tracks</p>

      {loading ? (
        <div className="space-y-2">{Array.from({length:8}).map((_,i) => <div key={i} className="h-14 rounded-xl remix-shimmer" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48">
          <Heart className="w-10 h-10 mb-3" style={{ color: "var(--text-faint)" }} />
          <p style={{ color: "var(--text-muted)" }}>No liked songs yet — heart some tracks!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={item.id + i}
              className="flex items-center gap-3 p-2.5 rounded-xl group transition-all"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--bg-card)"}>
              <button onClick={() => play(item)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <span className="w-5 text-center text-[10px]" style={{ color: "var(--text-faint)", fontFamily: "Orbitron, sans-serif" }}>{i+1}</span>
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "var(--bg-elevated)" }}>
                  {item.thumbnail
                    ? <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Music2 className="w-4 h-4" style={{ color: "var(--text-faint)" }} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{item.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{item.artist}</p>
                </div>
              </button>
              <span className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: item.source === "youtube" ? "rgba(255,0,0,0.1)" : "color-mix(in srgb, var(--accent) 8%, transparent)", color: item.source === "youtube" ? "#FF4444" : "var(--accent)", fontFamily: "Orbitron, sans-serif" }}>
                {item.source === "youtube" ? "YT" : "♪"}
              </span>
              <button onClick={() => unlike(item)}
                className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                style={{ color: "var(--accent)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,0,60,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
