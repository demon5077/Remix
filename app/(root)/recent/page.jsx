"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useYT } from "@/hooks/use-youtube";
import { Clock, Play, Music2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const RECENT_KEY  = "arise:recent";
const YT_RECENT   = "arise:yt:recent";
const OLD_SAAVN   = "remix:recent";

function safeStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return v.name || v.title || v.id || JSON.stringify(v).slice(0, 40);
  return String(v);
}

export default function RecentPage() {
  const yt = useYT() || {};
  const [items, setItems] = useState([]);

  const load = () => {
    try {
      // Unified recent (arise:recent)
      const raw      = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      // Old YT recent format
      const ytOld    = JSON.parse(localStorage.getItem(YT_RECENT) || "[]").map(r => ({
        id:        r.id,
        ytId:      r.id,
        name:      safeStr(r.title || r.name),
        artist:    safeStr(r.channelTitle || r.artist || ""),
        thumbnail: typeof r.thumbnail === "string" ? r.thumbnail : null,
        source:    "youtube",
        ts:        r.ts || 0,
      }));
      // Old Saavn recent — could be string IDs or objects
      const saavnRaw = JSON.parse(localStorage.getItem(OLD_SAAVN) || "[]");
      const saavnOld = saavnRaw.map(entry => {
        if (typeof entry === "string") {
          return { id: entry, saavnId: entry, name: entry, artist: "", source: "saavn", ts: 0 };
        }
        if (typeof entry === "object" && entry !== null) {
          return {
            id:        safeStr(entry.id),
            saavnId:   safeStr(entry.id),
            name:      safeStr(entry.name || entry.title || entry.id || "Unknown"),
            artist:    safeStr(entry.artist || entry.artists || ""),
            thumbnail: typeof entry.thumbnail === "string" ? entry.thumbnail :
                       (typeof entry.image === "string" ? entry.image : null),
            source:    "saavn",
            ts:        entry.ts || 0,
          };
        }
        return null;
      }).filter(Boolean);

      // Merge and deduplicate by id
      const map = new Map();
      [...raw, ...ytOld, ...saavnOld].forEach(item => {
        if (!item) return;
        const key = safeStr(item.ytId || item.id);
        if (key && !map.has(key)) map.set(key, item);
      });

      const sorted = [...map.values()]
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))
        .slice(0, 50);
      setItems(sorted);
    } catch (e) {
      console.error("Recent load error:", e);
      setItems([]);
    }
  };

  useEffect(() => { load(); }, []);

  const clearAll = () => {
    localStorage.removeItem(RECENT_KEY);
    localStorage.removeItem(YT_RECENT);
    localStorage.removeItem(OLD_SAAVN);
    setItems([]);
    toast("History cleared");
  };

  const playItem = (item) => {
    const ytId = item.ytId || (/^[A-Za-z0-9_-]{11}$/.test(safeStr(item.id)) ? item.id : null);
    if (ytId) {
      yt.playVideo?.({
        id:           ytId,
        title:        safeStr(item.name || item.title),
        channelTitle: safeStr(item.artist),
        thumbnail:    item.thumbnail || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      });
      toast(`▶ ${safeStr(item.name || item.title).slice(0, 40)}`);
    } else {
      toast.error("Can't play — no YouTube ID found");
    }
  };

  return (
    <div className="px-4 md:px-8 py-8" style={{ color: "var(--text-primary)" }}>
      <div className="flex items-center gap-3 mb-2">
        <Clock className="w-6 h-6" style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>
          Recently Played
        </h1>
        {items.length > 0 && (
          <button onClick={clearAll}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", color: "var(--accent)", fontFamily: "Rajdhani, sans-serif" }}>
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
        {items.length} tracks · Saavn + YouTube merged
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-2xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <Music2 className="w-10 h-10 mb-3" style={{ color: "var(--text-faint)" }} />
          <p style={{ color: "var(--text-muted)" }}>Nothing played yet — start listening!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => {
            const ytId = item.ytId || (/^[A-Za-z0-9_-]{11}$/.test(safeStr(item.id)) ? item.id : null);
            const thumb = item.thumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : null);
            const name  = safeStr(item.name || item.title || "Unknown");
            const artist = safeStr(item.artist || "");
            return (
              <button key={`${safeStr(item.id)}-${i}`}
                onClick={() => playItem(item)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left group transition-all"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--bg-card)"}>
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: "var(--bg-elevated)" }}>
                  {thumb
                    ? <img src={thumb} alt={name} className="w-full h-full object-cover" />
                    : <Music2 className="w-4 h-4" style={{ color: "var(--text-faint)" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate"
                    style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{name}</p>
                  {artist && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{artist}</p>}
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    background: ytId ? "color-mix(in srgb, #FF4444 10%, transparent)" : "color-mix(in srgb, var(--accent) 8%, transparent)",
                    color:      ytId ? "#FF4444" : "var(--accent)",
                    fontFamily: "Orbitron, sans-serif",
                  }}>
                  {ytId ? "YT" : "♪"}
                </span>
                <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
