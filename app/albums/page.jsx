"use client";
import { useEffect, useState } from "react";
import { useYT } from "@/hooks/use-youtube";
import { muzoSearch, muzoAlbum } from "@/lib/muzo";
import { searchAlbumByQuery } from "@/lib/fetch";
import { Disc3, Play, ChevronLeft, RefreshCw, Music2 } from "lucide-react";
import { toast } from "sonner";

const GENRES = [
  { id: "new",       label: "🆕 New Releases",   q: "new hindi album 2025"          },
  { id: "bollywood", label: "🎬 Bollywood",       q: "bollywood album 2025"          },
  { id: "punjabi",   label: "🎤 Punjabi",         q: "punjabi album 2025"            },
  { id: "indie",     label: "🎸 Indie",           q: "indie hindi album"             },
  { id: "retro",     label: "📻 Classic Retro",   q: "classic hindi songs album"     },
  { id: "english",   label: "🌍 English",         q: "top english album 2025"        },
  { id: "lofi",      label: "🌙 Lo-Fi",           q: "lofi hindi album"              },
];

export default function AlbumsPage() {
  const yt = useYT() || {};
  const [genre,        setGenre]        = useState("new");
  const [albums,       setAlbums]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [openAlbum,    setOpenAlbum]    = useState(null);
  const [tracks,       setTracks]       = useState([]);
  const [loadingAlbum, setLoadingAlbum] = useState(false);

  const loadAlbums = async (g) => {
    setLoading(true);
    setAlbums([]);
    setOpenAlbum(null);
    const q = GENRES.find(x => x.id === g)?.q || g;
    try {
      const results = await muzoSearch(q, "albums", 20);
      setAlbums((results || []).filter(a => a.browseId || a.id).slice(0, 20));
    } catch { toast.error("Failed to load albums"); }
    setLoading(false);
  };

  const openAlbumDetail = async (album) => {
    setOpenAlbum(album);
    setTracks([]);
    setLoadingAlbum(true);
    try {
      const id = album.browseId || album.id;
      const data = await muzoAlbum(id);
      const tr = data?.tracks || data?.songs || [];
      setTracks(tr.map(t => ({
        id:           t.videoId || t.id,
        title:        t.title   || t.name,
        artist:       (t.artists||[]).map(a=>a.name||a).join(", ") || album.artist || "",
        thumbnail:    t.thumbnail || `https://i.ytimg.com/vi/${t.videoId||t.id}/mqdefault.jpg`,
        duration:     t.duration || "",
      })).filter(t => t.id));
    } catch { toast.error("Could not load album tracks"); }
    setLoadingAlbum(false);
  };

  useEffect(() => { loadAlbums(genre); }, [genre]);

  if (openAlbum) return (
    <div className="px-4 md:px-8 py-8" style={{ color: "var(--text-primary)" }}>
      <button onClick={() => setOpenAlbum(null)}
        className="flex items-center gap-2 mb-5 text-sm font-semibold"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>
        <ChevronLeft className="w-4 h-4" /> Back to Albums
      </button>
      <div className="flex items-center gap-5 mb-6 p-5 rounded-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <img src={openAlbum.thumbnails?.[0]?.url || openAlbum.thumbnail || ""}
          alt={openAlbum.title} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
        <div>
          <p className="text-xs font-bold mb-1" style={{ color: "var(--accent)", fontFamily: "Orbitron, sans-serif" }}>ALBUM</p>
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "Orbitron, sans-serif" }}>{openAlbum.title}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{openAlbum.artist || openAlbum.year || ""}</p>
          {tracks.length > 0 && (
            <button onClick={() => { yt.playVideo?.(tracks[0]); yt.setQueue?.(tracks.slice(1)); toast("Playing album"); }}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: "var(--accent)", color: "#fff", fontFamily: "Orbitron, sans-serif" }}>
              <Play className="w-3.5 h-3.5" /> Play Album
            </button>
          )}
        </div>
      </div>
      {loadingAlbum ? <div className="space-y-2">{Array.from({length:8}).map((_,i) => <div key={i} className="h-12 rounded-xl remix-shimmer" />)}</div>
      : tracks.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No tracks found</p>
      : <div className="space-y-1">
          {tracks.map((t, i) => (
            <button key={t.id + i} onClick={() => { yt.playVideo?.(t); toast(`▶ ${t.title?.slice(0,40)}`); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left group transition-all"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-card)"; }}>
              <span className="w-6 text-center text-xs" style={{ color: "var(--text-faint)", fontFamily: "Orbitron, sans-serif" }}>{i+1}</span>
              <img src={t.thumbnail} alt={t.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{t.title}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{t.artist}</p>
              </div>
              <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }} />
            </button>
          ))}
        </div>}
    </div>
  );

  return (
    <div className="px-4 md:px-8 py-8" style={{ color: "var(--text-primary)" }}>
      <div className="flex items-center gap-3 mb-2">
        <Disc3 className="w-6 h-6" style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>Albums</h1>
      </div>
      <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>Browse albums by genre</p>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {GENRES.map(g => (
          <button key={g.id} onClick={() => setGenre(g.id)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{ background: genre === g.id ? "var(--accent)" : "var(--bg-card)", border: `1px solid ${genre === g.id ? "transparent" : "var(--border-subtle)"}`, color: genre === g.id ? "#fff" : "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>
            {g.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({length:15}).map((_,i) => <div key={i} className="space-y-2"><div className="aspect-square rounded-xl remix-shimmer" /><div className="h-3 w-3/4 rounded remix-shimmer" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.map((album, i) => (
            <button key={(album.browseId||album.id)+i} onClick={() => openAlbumDetail(album)}
              className="group text-left space-y-2">
              <div className="relative aspect-square rounded-xl overflow-hidden" style={{ background: "var(--bg-card)" }}>
                <img src={album.thumbnails?.[0]?.url || album.thumbnail || ""} alt={album.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-xs font-semibold line-clamp-2 leading-tight" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{album.title}</p>
              <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{album.artist || album.year || ""}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
