"use client";
import { useEffect, useState } from "react";
import { useYT } from "@/hooks/use-youtube";
import { muzoSearch } from "@/lib/muzo";
import { Mic, Play, RefreshCw, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "mythology",  label: "🕉️ Mythology & Spirituality", q: "indian mythology spiritual podcast"            },
  { id: "crime",      label: "🔍 True Crime India",          q: "true crime india podcast hindi"               },
  { id: "comedy",     label: "😂 Stand-Up & Comedy",         q: "indian comedy podcast stand up hindi"         },
  { id: "cricket",    label: "🏏 Cricket & Sports",          q: "cricket sports podcast india hindi"           },
  { id: "startup",    label: "💡 Startup & Entrepreneurship",q: "startup business podcast india hindi"         },
  { id: "history",    label: "🏛️ Indian History",            q: "indian history podcast hindi"                 },
  { id: "bollywood",  label: "🎬 Bollywood Behind the Scenes",q: "bollywood podcast behind scenes celebrity"   },
  { id: "health",     label: "🧘 Health & Ayurveda",         q: "health ayurveda wellness podcast india hindi" },
  { id: "horror",     label: "👻 Horror & Paranormal",       q: "horror paranormal stories podcast hindi"      },
  { id: "finance",    label: "💰 Personal Finance India",    q: "personal finance india investing podcast"     },
  { id: "philosophy", label: "🧠 Philosophy & Life",         q: "philosophy life lessons podcast hindi"        },
  { id: "kids",       label: "🧒 Kids & Stories",            q: "kids stories podcast hindi children"          },
];

export default function PodcastsPage() {
  const yt = useYT() || {};
  const [category,    setCategory]    = useState(null);
  const [podcasts,    setPodcasts]    = useState({});
  const [loading,     setLoading]     = useState({});
  const [openPodcast, setOpenPodcast] = useState(null);
  const [episodes,    setEpisodes]    = useState([]);
  const [loadingEp,   setLoadingEp]   = useState(false);
  const [featured,    setFeatured]    = useState([]);
  const [loadingF,    setLoadingF]    = useState(true);

  // Load featured podcasts on mount
  useEffect(() => {
    (async () => {
      setLoadingF(true);
      try {
        const r = await muzoSearch("popular indian podcast", "podcasts", 8);
        if (!r?.length) {
          const fallback = await muzoSearch("best podcast india hindi", "videos", 8);
          setFeatured((fallback||[]).slice(0,8).map(normalise));
        } else {
          setFeatured((r||[]).slice(0,8).map(normalise));
        }
      } catch {}
      setLoadingF(false);
    })();
  }, []);

  const normalise = (item) => ({
    id:           item.videoId || item.id || item.browseId,
    title:        item.title   || item.name,
    channel:      (item.artists||[]).map(a=>a.name||a).join(", ") || item.author || item.channelTitle || "",
    thumbnail:    item.thumbnails?.[0]?.url || item.thumbnail || `https://i.ytimg.com/vi/${item.videoId||item.id}/mqdefault.jpg`,
    duration:     item.duration || "",
    type:         item.type || "podcast",
  });

  const loadCategory = async (cat) => {
    if (podcasts[cat.id]) { setCategory(cat); return; }
    setLoading(l => ({ ...l, [cat.id]: true }));
    try {
      // Try podcasts filter first, fall back to videos
      let r = await muzoSearch(cat.q, "podcasts", 12);
      if (!r?.length) r = await muzoSearch(cat.q, "videos", 12);
      setPodcasts(p => ({ ...p, [cat.id]: (r||[]).map(normalise) }));
    } catch { toast.error("Failed to load podcasts"); }
    setLoading(l => ({ ...l, [cat.id]: false }));
    setCategory(cat);
  };

  const openEpisodes = async (podcast) => {
    setOpenPodcast(podcast);
    setEpisodes([]);
    if (!podcast.id) return;
    setLoadingEp(true);
    try {
      const r = await muzoSearch(`${podcast.title} ${podcast.channel}`, "videos", 8);
      setEpisodes((r||[]).map(normalise).filter(e => e.id !== podcast.id));
    } catch {}
    setLoadingEp(false);
  };

  const playPodcast = (item) => {
    if (!item.id) { toast.error("Can't play this podcast"); return; }
    // Only play if it's a video ID (11 chars)
    if (/^[A-Za-z0-9_-]{11}$/.test(item.id)) {
      yt.playVideo?.({
        id:           item.id,
        title:        item.title,
        channelTitle: item.channel,
        thumbnail:    item.thumbnail,
      });
      toast(`🎙 Playing: ${item.title?.slice(0, 40)}`);
    } else {
      toast.error("This podcast needs a direct YouTube link to play");
    }
  };

  if (openPodcast) return (
    <div className="px-4 md:px-8 py-8" style={{ color: "var(--text-primary)" }}>
      <button onClick={() => setOpenPodcast(null)}
        className="flex items-center gap-2 mb-5 text-sm font-semibold"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>
        <ChevronLeft className="w-4 h-4" /> Back to Podcasts
      </button>
      <div className="flex gap-4 mb-6 p-4 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <img src={openPodcast.thumbnail} alt={openPodcast.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold mb-1" style={{ color: "var(--accent)", fontFamily: "Orbitron, sans-serif" }}>PODCAST</p>
          <h2 className="text-xl font-black mb-1 truncate" style={{ fontFamily: "Orbitron, sans-serif" }}>{openPodcast.title}</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{openPodcast.channel}</p>
          <button onClick={() => playPodcast(openPodcast)}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: "var(--accent)", color: "#fff", fontFamily: "Orbitron, sans-serif" }}>
            <Play className="w-3.5 h-3.5" /> Play Episode
          </button>
        </div>
      </div>
      <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>MORE FROM THIS SHOW</h3>
      {loadingEp ? <div className="space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-14 rounded-xl remix-shimmer" />)}</div>
      : episodes.map((ep,i) => <PodcastRow key={i} item={ep} onPlay={() => playPodcast(ep)} />)}
    </div>
  );

  return (
    <div className="px-4 md:px-8 py-8" style={{ color: "var(--text-primary)" }}>
      <div className="flex items-center gap-3 mb-2">
        <Mic className="w-6 h-6" style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>Podcasts</h1>
      </div>
      <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>
        Real podcasts from YouTube Music · powered by Muzo API
      </p>

      {/* Featured */}
      {!category && (
        <div className="mb-8">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.1em" }}>FEATURED</h2>
          {loadingF ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({length:8}).map((_,i)=><div key={i} className="space-y-2"><div className="aspect-square rounded-xl remix-shimmer" /><div className="h-3 w-3/4 rounded remix-shimmer" /></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {featured.map((p,i) => <PodcastCard key={i} item={p} onPlay={() => playPodcast(p)} onOpen={() => openEpisodes(p)} />)}
            </div>
          )}
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {category && (
          <button onClick={() => setCategory(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>
            <ChevronLeft className="w-3 h-3" /> All
          </button>
        )}
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => loadCategory(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: category?.id === cat.id ? "var(--accent)" : "var(--bg-card)",
              border: `1px solid ${category?.id === cat.id ? "transparent" : "var(--border-subtle)"}`,
              color: category?.id === cat.id ? "#fff" : "var(--text-secondary)",
              fontFamily: "Rajdhani, sans-serif",
            }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Category results */}
      {category && (
        loading[category.id]
          ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><div key={i} className="space-y-2"><div className="aspect-square rounded-xl remix-shimmer" /><div className="h-3 w-3/4 rounded remix-shimmer" /></div>)}</div>
          : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(podcasts[category.id]||[]).map((p,i) => <PodcastCard key={i} item={p} onPlay={() => playPodcast(p)} onOpen={() => openEpisodes(p)} />)}
            </div>
      )}
    </div>
  );
}

function PodcastCard({ item, onPlay, onOpen }) {
  return (
    <div className="group space-y-2">
      <div className="relative aspect-square rounded-xl overflow-hidden cursor-pointer" onClick={onOpen}
        style={{ background: "var(--bg-card)" }}>
        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          <button onClick={e => { e.stopPropagation(); onPlay(); }}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "var(--accent)", boxShadow: "0 0 20px var(--accent-glow)" }}>
            <Play className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold"
          style={{ background: "var(--accent)", color: "#fff", fontFamily: "Orbitron, sans-serif" }}>
          PODCAST
        </div>
      </div>
      <p className="text-xs font-semibold line-clamp-2 leading-tight" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{item.title}</p>
      <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{item.channel}</p>
    </div>
  );
}

function PodcastRow({ item, onPlay }) {
  return (
    <button onClick={onPlay}
      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left group transition-all mb-1.5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
      onMouseLeave={e => e.currentTarget.style.background = "var(--bg-card)"}>
      <img src={item.thumbnail} alt={item.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{item.title}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.channel}</p>
      </div>
      <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "var(--accent)" }} />
    </button>
  );
}
