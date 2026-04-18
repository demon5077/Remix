"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useYT } from "@/hooks/use-youtube";
import { muzoArtist, muzoSearch } from "@/lib/muzo";
import { Play, ChevronLeft, Music2, Disc3, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ArtistDetailPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const yt           = useYT() || {};
  const artistId     = params?.id;
  const artistName   = searchParams?.get("name") || "Artist";

  const [songs,    setSongs]    = useState([]);
  const [albums,   setAlbums]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("songs");
  const [heroThumb, setHeroThumb] = useState(null);

  const loadArtistData = async () => {
    setLoading(true);
    setSongs([]);
    setAlbums([]);

    let foundSongs = [];
    let foundAlbums = [];
    let thumb = null;

    // Strategy 1: Try muzoArtist (works for YouTube Music browse IDs)
    try {
      const detail = await muzoArtist(artistId);
      if (detail) {
        thumb = detail?.thumbnails?.[1]?.url || detail?.thumbnails?.[0]?.url || null;
        setHeroThumb(thumb);
        const topSongs  = detail?.songs  || detail?.topSongs  || [];
        const topAlbums = detail?.albums || detail?.topAlbums || [];
        foundSongs  = topSongs.map(s => ({
          id:           s.videoId || s.id,
          title:        s.title   || s.name,
          artist:       (s.artists||[]).map(a=>a.name||a).join(", ") || artistName,
          thumbnail:    s.thumbnails?.[2]?.url || s.thumbnails?.[1]?.url || s.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${s.videoId||s.id}/hqdefault.jpg`,
          duration:     s.duration || "",
        })).filter(s => s.id);
        foundAlbums = topAlbums.map(a => ({
          id:        a.browseId || a.id,
          title:     a.title   || a.name,
          year:      a.year    || "",
          thumbnail: a.thumbnails?.[0]?.url || a.thumbnail || "",
        }));
      }
    } catch {}

    // Strategy 2: Always search by name for songs (covers cases where artist API fails)
    if (foundSongs.length < 5) {
      try {
        const queries = [
          `${artistName} songs`,
          `${artistName} latest hits`,
          `${artistName} best songs`,
        ];
        for (const q of queries) {
          const r = await muzoSearch(q, "songs", 15);
          const filtered = (r || [])
            .filter(s => {
              const title  = (s.title || s.name || "").toLowerCase();
              const artist = (s.artists || []).map(a => a.name || a).join(" ").toLowerCase();
              const name   = artistName.toLowerCase();
              // Keep if artist name appears in result's artist field OR title
              return artist.includes(name.split(" ")[0].toLowerCase()) ||
                     title.includes(name.split(" ")[0].toLowerCase());
            })
            .map(s => ({
              id:           s.videoId || s.id,
              title:        s.title   || s.name,
              artist:       (s.artists||[]).map(a=>a.name||a).join(", ") || artistName,
              thumbnail:    s.thumbnails?.[2]?.url || s.thumbnails?.[1]?.url || s.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${s.videoId||s.id}/hqdefault.jpg`,
              duration:     s.duration || "",
            }))
            .filter(s => s.id);
          if (filtered.length >= 3) { foundSongs = [...foundSongs, ...filtered]; break; }
        }
        // Fallback: no filter, just use top results
        if (foundSongs.length < 3) {
          const r = await muzoSearch(`${artistName}`, "songs", 12);
          foundSongs = (r||[]).map(s => ({
            id:           s.videoId || s.id,
            title:        s.title   || s.name,
            artist:       (s.artists||[]).map(a=>a.name||a).join(", ") || artistName,
            thumbnail:    s.thumbnails?.[2]?.url || s.thumbnails?.[1]?.url || s.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${s.videoId||s.id}/hqdefault.jpg`,
          })).filter(s => s.id);
        }
      } catch {}
    }

    // Strategy 3: Search albums by name if none found
    if (foundAlbums.length === 0) {
      try {
        const r = await muzoSearch(`${artistName} album`, "albums", 8);
        foundAlbums = (r||[]).map(a => ({
          id:        a.browseId || a.id,
          title:     a.title   || a.name,
          year:      a.year    || "",
          thumbnail: a.thumbnails?.[0]?.url || a.thumbnail || "",
        }));
      } catch {}
    }

    // Deduplicate songs by id
    const seen = new Set();
    foundSongs = foundSongs.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    }).slice(0, 20);

    setSongs(foundSongs);
    setAlbums(foundAlbums.slice(0, 12));

    // Get thumbnail from first song if no artist thumb
    if (!thumb && foundSongs[0]?.thumbnail) {
      setHeroThumb(null); // use initials
    }
    setLoading(false);
  };

  useEffect(() => { if (artistId) loadArtistData(); }, [artistId, artistName]);

  return (
    <div className="pb-12" style={{ color: "var(--text-primary)" }}>
      {/* Hero banner */}
      <div className="relative h-52 md:h-64 overflow-hidden"
        style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 25%, transparent), var(--bg-elevated))" }}>
        {heroThumb && (
          <img src={heroThumb} alt={artistName}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.25 }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg-primary) 0%, transparent 60%)" }} />
        <Link href="/artists"
          className="absolute top-4 left-4 z-10 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
          style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
          <ChevronLeft className="w-4 h-4" /> Artists
        </Link>
        <div className="relative z-10 flex items-end h-full px-6 pb-5 gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 ring-2"
            style={{ ringColor: "var(--accent)", boxShadow: "0 0 20px var(--accent-glow)" }}>
            {heroThumb
              ? <img src={heroThumb} alt={artistName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-2xl font-black"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", fontFamily: "Orbitron, sans-serif" }}>
                  {artistName[0]?.toUpperCase()}
                </div>}
          </div>
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: "var(--accent)", fontFamily: "Orbitron, sans-serif" }}>ARTIST</p>
            <h1 className="text-3xl font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>{artistName}</h1>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5">
        {/* Play all + reload */}
        <div className="flex items-center gap-3 mb-5">
          {songs.length > 0 && (
            <button onClick={() => { yt.playVideo?.(songs[0]); yt.setQueue?.(songs.slice(1)); toast(`Playing ${artistName}`); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
              style={{ background: "var(--accent)", color: "#fff", fontFamily: "Orbitron, sans-serif", boxShadow: "0 0 20px var(--accent-glow)" }}>
              <Play className="w-4 h-4" /> Play All
            </button>
          )}
          <button onClick={loadArtistData} disabled={loading}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { id: "songs",  label: `🎵 Songs (${songs.length})`  },
            { id: "albums", label: `💿 Albums (${albums.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: tab === t.id ? "var(--accent)" : "var(--bg-card)",
                border:     `1px solid ${tab === t.id ? "transparent" : "var(--border-subtle)"}`,
                color:      tab === t.id ? "#fff" : "var(--text-secondary)",
                fontFamily: "Rajdhani, sans-serif",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="h-14 rounded-xl remix-shimmer" />
            ))}
          </div>
        ) : tab === "songs" ? (
          songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 rounded-2xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <Music2 className="w-8 h-8 mb-2" style={{ color: "var(--text-faint)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No songs found for {artistName}</p>
              <button onClick={loadArtistData} className="mt-2 text-xs font-bold" style={{ color: "var(--accent)" }}>
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {songs.map((s, i) => (
                <button key={`${s.id}-${i}`}
                  onClick={() => { yt.playVideo?.(s); toast(`▶ ${s.title?.slice(0,40)}`); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left group transition-all"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--bg-card)"}>
                  <span className="w-5 text-center text-[10px]"
                    style={{ color: "var(--text-faint)", fontFamily: "Orbitron, sans-serif" }}>{i+1}</span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ background: "var(--bg-elevated)" }}>
                    <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = "none"; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate"
                      style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{s.title}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{s.artist}</p>
                  </div>
                  {s.duration && <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-faint)" }}>{s.duration}</span>}
                  <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: "var(--accent)" }} />
                </button>
              ))}
            </div>
          )
        ) : (
          albums.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No albums found</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {albums.map((a, i) => (
                <div key={`${a.id}-${i}`} className="group space-y-2">
                  <div className="aspect-square rounded-xl overflow-hidden"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                    {a.thumbnail
                      ? <img src={a.thumbnail} alt={a.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Disc3 className="w-8 h-8" style={{ color: "var(--text-faint)" }} />
                        </div>}
                  </div>
                  <p className="text-xs font-semibold line-clamp-2"
                    style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }}>{a.title}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{a.year}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
