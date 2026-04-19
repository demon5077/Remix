"use client";
import { useEffect, useState, useRef } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import HeroSection        from "@/components/home/hero-section";
import GenreFilters       from "@/components/home/genre-filters";
import ScrollSection      from "@/components/home/scroll-section";
import MoodSection        from "@/components/home/mood-section";
import AnimatedBackground from "@/components/home/animated-background";
import SongCard           from "@/components/cards/song";
import AlbumCard          from "@/components/cards/album";
import ArtistCard         from "@/components/cards/artist";
import YTCard             from "@/components/youtube/yt-card";
import PodcastCard        from "@/components/podcast/podcast-card";
import PodcastPlayer      from "@/components/podcast/podcast-player";
import Footer             from "@/components/page/footer";
import {
  getSongsByQuery,
  searchAlbumByQuery,
} from "@/lib/fetch";
import { getTrending, searchYT, hasApiKey } from "@/lib/youtube";
import { muzoTrending, muzoSearch, hasMuzoApi } from "@/lib/muzo";
import { toast } from "sonner";
import { useMusicProvider } from "@/hooks/use-context";
import { useYT } from "@/hooks/use-youtube";

// ── Continue Listening widget ───────────────────────────────────────────
function ContinueListening() {
  const { recentlyPlayed, playSong } = useMusicProvider() || {};
  const { getRecent, playVideo }     = useYT() || {};
  const [ytRecent, setYtRecent]      = useState([]);

  useEffect(() => {
    if (getRecent) setYtRecent(getRecent().slice(0, 6));
  }, []);

  const saavnRecent = (recentlyPlayed || []).slice(0, 6);
  if (!saavnRecent.length && !ytRecent.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}>
            ⏱ Continue Listening
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Pick up where you left off</p>
        </div>
        <a href="/recent" className="text-xs font-semibold" style={{ color: "#FF003C", fontFamily: "Rajdhani, sans-serif" }}>See all →</a>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {saavnRecent.map(({ id }) => <SongCard key={id} id={id} />)}
        {ytRecent.map(item => (
          <button key={item.id} onClick={() => playVideo?.(item)}
            className="flex-shrink-0 w-[160px] group cursor-pointer text-left">
            <div className="relative overflow-hidden rounded-xl">
              <img src={item.thumbnail} alt={item.title}
                className="w-full h-[90px] object-cover transition-transform duration-500 group-hover:scale-110"
                style={{ background: "var(--bg-card)" }} />
              <div className="absolute top-1.5 right-1.5 px-1 py-0.5 rounded text-[8px] font-bold"
                style={{ background: "#FF0000", color: "white", fontFamily: "Orbitron, sans-serif" }}>YT</div>
            </div>
            <p className="text-xs font-semibold mt-2 truncate" style={{ color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>{item.title}</p>
            <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{item.channelTitle}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Skeleton helpers ────────────────────────────────────────────────────
const SONG_SKELETONS  = Array(8).fill(null);
const ALBUM_SKELETONS = Array(6).fill(null);

// ── Demo YT items shown when no API key — lets users see the UI ─────────
const DEMO_YT = [
  { id:"dQw4w9WgXcQ",  title:"Rick Astley — Never Gonna Give You Up",  channelTitle:"Rick Astley",   thumbnail:"https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",  durationText:"3:33" },
  { id:"JGwWNGJdvx8",  title:"Ed Sheeran — Shape of You",              channelTitle:"Ed Sheeran",    thumbnail:"https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",   durationText:"4:24" },
  { id:"ktvTqknDobU",  title:"Imagine Dragons — Radioactive",          channelTitle:"ImagineDragons",thumbnail:"https://i.ytimg.com/vi/ktvTqknDobU/hqdefault.jpg",   durationText:"3:05" },
  { id:"hT_nvWreIhg",  title:"OneRepublic — Counting Stars",           channelTitle:"OneRepublic",   thumbnail:"https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg",   durationText:"4:17" },
  { id:"YQHsXMglC9A",  title:"Adele — Hello",                          channelTitle:"Adele",         thumbnail:"https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg",   durationText:"6:07" },
];

// ── Demo podcast data ───────────────────────────────────────────────────
const DEMO_PODCASTS = [
  { id:"p1", title:"Arise Sessions",   host:"Sunil & Guests",  image:"https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80", duration:"1:12:04", episode:"Ep 12", category:"Music"     },
  { id:"p2", title:"Midnight Code",    host:"Dev Underground", image:"https://images.unsplash.com/photo-1519337265831-281ec6cc8514?w=400&q=80", duration:"58:30",   episode:"Ep 8",  category:"Tech"      },
  { id:"p3", title:"Dark Frequencies", host:"Elena Voss",      image:"https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80", duration:"1:04:17", episode:"Ep 5",  category:"Music"     },
  { id:"p4", title:"Crime Noir",       host:"Marcus Black",    image:"https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&q=80", duration:"47:52",   episode:"Ep 22", category:"Crime"     },
  { id:"p5", title:"The Void Speaks",  host:"Anonymous",       image:"https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80", duration:"1:18:39", episode:"Ep 3",  category:"Philosophy"},
];

export default function HomePage() {
  const yt = useYT() || {};
  const [latest,     setLatest]     = useState(SONG_SKELETONS);
  const [trending,   setTrending]   = useState(SONG_SKELETONS);
  const [albums,     setAlbums]     = useState(ALBUM_SKELETONS);
  const [bollywood,  setBollywood]  = useState(SONG_SKELETONS);
  const [punjabi,    setPunjabi]    = useState(SONG_SKELETONS);
  const [ytTrending, setYtTrending] = useState(DEMO_YT);  // start with demo
  const [ytLofi,     setYtLofi]     = useState(DEMO_YT.slice(0, 3));
  const [ytHasKey,   setYtHasKey]   = useState(false);
  const [podcastPod, setPodcastPod] = useState(null);
  const [playingPod, setPlayingPod] = useState(null);
  const [podcasts,   setPodcasts]   = useState([]);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    // ── Saavn data ────────────────────────────────────────
    Promise.all([
      getSongsByQuery("new hindi songs 2025",  1, 15).then(r => r?.json()).catch(() => null),
      getSongsByQuery("trending hits 2025",    1, 15).then(r => r?.json()).catch(() => null),
      searchAlbumByQuery("latest album 2025",  1, 12).then(r => r?.json()).catch(() => null),
      getSongsByQuery("bollywood hits",         1, 12).then(r => r?.json()).catch(() => null),
      getSongsByQuery("punjabi songs 2025",     1, 12).then(r => r?.json()).catch(() => null),
    ]).then(([r1, r2, r3, r4, r5]) => {
      if (r1?.data?.results?.length) setLatest(r1.data.results);    else setLatest([]);
      if (r2?.data?.results?.length) setTrending(r2.data.results);  else setTrending([]);
      if (r3?.data?.results?.length) setAlbums(r3.data.results);    else setAlbums([]);
      if (r4?.data?.results?.length) setBollywood(r4.data.results); else setBollywood([]);
      if (r5?.data?.results?.length) setPunjabi(r5.data.results);   else setPunjabi([]);
    });

    // ── YouTube / Muzo trending ──────────────────────────────────────────
    const apiOk = hasApiKey();
    setYtHasKey(apiOk);

    // Try Muzo trending first (no key needed), fall back to RapidAPI
    muzoTrending().then(trending => {
      const songs  = trending?.songs  || [];
      const videos = trending?.videos || [];
      const items  = [...songs, ...videos].slice(0, 12);
      if (items.length) {
        const normalised = items.map(item => ({
          id:           item.videoId || item.id,
          title:        item.title   || item.name,
          channelTitle: item.artist  || item.channelTitle || "",
          thumbnail:    item.thumbnail || (item.thumbnails?.[0]?.url) || `https://i.ytimg.com/vi/${item.videoId || item.id}/hqdefault.jpg`,
          durationText: item.duration || "",
        })).filter(i => i.id);
        if (items.length) setYtTrending(items.length ? normalised : DEMO_YT);
      }
    }).catch(() => {});

    if (apiOk) {
      getTrending("IN", "music")
        .then(({ items }) => { if (items?.length) setYtTrending(items.slice(0, 12)); })
        .catch(() => {});
      searchYT("lofi chill music", "video")
        .then(({ items }) => { if (items?.length) setYtLofi(items.slice(0, 10)); })
        .catch(() => {});
    } else {
      // Use Muzo for lo-fi too
      muzoSearch("lofi chill music", "videos", 8).then(items => {
        if (items?.length) {
          const normalised = items.map(i => ({
            id:           i.videoId || i.id,
            title:        i.title   || i.name,
            channelTitle: i.artist  || i.channelTitle || "",
            thumbnail:    i.thumbnail || `https://i.ytimg.com/vi/${i.videoId || i.id}/hqdefault.jpg`,
          })).filter(i => i.id);
          if (normalised.length) setYtLofi(normalised);
        }
      }).catch(() => {});
    }

    // ── Live Podcasts via Muzo ─────────────────────────────────────────
    const podcastQueries = [
      "popular indian podcast",
      "best hindi podcast",
      "podcast india",
    ];
    (async () => {
      for (const q of podcastQueries) {
        try {
          let results = await muzoSearch(q, "podcasts", 10);
          if (!results?.length) results = await muzoSearch(q, "videos", 10);
          if (results?.length) {
            const mapped = results
              .filter(i => i.videoId || i.id)
              .map(i => ({
                id:       i.videoId || i.id,
                ytId:     i.videoId || i.id,
                title:    i.title   || i.name || "Podcast",
                host:     (i.artists||[]).map(a => a.name||a).join(", ") || i.channelTitle || i.author || "",
                image:    i.thumbnails?.[2]?.url || i.thumbnails?.[1]?.url || i.thumbnails?.[0]?.url
                          || i.thumbnail || `https://i.ytimg.com/vi/${i.videoId||i.id}/hqdefault.jpg`,
                duration: i.duration || "",
                episode:  "",
                category: "Podcast",
              }));
            if (mapped.length) { setPodcasts(mapped); break; }
          }
        } catch {}
      }
    })();
  }, []);

  // Extract unique artists from latest songs
  const artists = Array.isArray(latest) && latest[0] !== null
    ? [...new Map(
        latest
          .filter(s => s?.artists?.primary?.[0]?.id)
          .map(s => [s.artists.primary[0].id, s.artists.primary[0]])
      ).values()].slice(0, 12)
    : [];

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="relative z-10 px-4 md:px-6 lg:px-8 py-6 space-y-10 pb-32">

        {/* ── Hero ─────────────────────────────────────── */}
        <HeroSection />

        {/* ── Genre filters ────────────────────────────── */}
        <GenreFilters />

        {/* ── Continue Listening (if recent history exists) ── */}
        <ContinueListening />

        {/* ── YouTube Trending (demo cards if no API key) ─ */}
        <ScrollSection
          title="🔴 Trending on YouTube"
          subtitle={ytHasKey ? "Live from YouTube" : "Tap any card to play on YouTube · Add RAPIDAPI key for live data"}
          href="/yt"
        >
          {ytTrending.map(v => <YTCard key={v.id} item={v} layout="scroll" />)}
        </ScrollSection>

        {/* ── New Releases ─────────────────────────────── */}
        <ScrollSection title="New Releases" subtitle="Fresh blood spilled from the underworld" href="/search/new hindi songs 2025">
          {Array.isArray(latest) && latest.map((s, i) =>
            s ? (
              <SongCard key={s.id} id={s.id}
                image={s.image?.[2]?.url || s.image?.[1]?.url}
                title={s.name}
                artist={s.artists?.primary?.[0]?.name} />
            ) : <SongCard key={i} />
          )}
        </ScrollSection>

        {/* ── Mood Playlists ───────────────────────────── */}
        <MoodSection />

        {/* ── Trending Now ─────────────────────────────── */}
        <ScrollSection title="🔥 Trending Now" subtitle="The chants echoing through the abyss" href="/search/trending hits 2025">
          {Array.isArray(trending) && trending.map((s, i) =>
            s ? (
              <SongCard key={s.id} id={s.id}
                image={s.image?.[2]?.url || s.image?.[1]?.url}
                title={s.name}
                artist={s.artists?.primary?.[0]?.name} />
            ) : <SongCard key={i} />
          )}
        </ScrollSection>

        {/* ── YT Lo-fi & Chill ─────────────────────────── */}
        <ScrollSection
          title="🎵 Lo-fi & Chill"
          subtitle={ytHasKey ? "Haunting melodies for the restless undead" : "Demo — add RAPIDAPI key for live YouTube search"}
          href="/yt/search"
        >
          {ytLofi.map(v => <YTCard key={v.id} item={v} layout="scroll" />)}
        </ScrollSection>

        {/* ── Top Artists ──────────────────────────────── */}
        {artists.length > 0 && (
          <ScrollSection title="🎤 Top Artists" subtitle="Voices conjured from the depths">
            {artists.map(a => (
              <ArtistCard key={a.id} id={a.id} name={a.name}
                image={a.image?.[2]?.url ||
                  `https://az-avatar.vercel.app/api/avatar/?bgColor=0f0f0f&fontSize=60&text=${a.name?.[0]?.toUpperCase() || "U"}`}
              />
            ))}
          </ScrollSection>
        )}

        {/* ── Albums ───────────────────────────────────── */}
        <ScrollSection title="💿 Albums" subtitle="Grimoires of sound sealed in blood" href="/search/latest album 2025">
          {Array.isArray(albums) && albums.map((a, i) =>
            a ? (
              <AlbumCard key={a.id} id={`album/${a.id}`}
                image={a.image?.[2]?.url || a.image?.[1]?.url}
                title={a.name}
                artist={a.artists?.primary?.[0]?.name || a.description}
                lang={a.language} />
            ) : <AlbumCard key={i} />
          )}
        </ScrollSection>

        {/* ── Bollywood ────────────────────────────────── */}
        <ScrollSection title="🎬 Bollywood Hits" subtitle="Mortal realm anthems" href="/search/bollywood hits">
          {Array.isArray(bollywood) && bollywood.map((s, i) =>
            s ? (
              <SongCard key={s.id} id={s.id}
                image={s.image?.[2]?.url || s.image?.[1]?.url}
                title={s.name}
                artist={s.artists?.primary?.[0]?.name} />
            ) : <SongCard key={i} />
          )}
        </ScrollSection>

        {/* ── Punjabi ──────────────────────────────────── */}
        <ScrollSection title="🥁 Punjabi Hits" subtitle="Thunderous hymns that wake ancient spirits" href="/search/punjabi songs 2025">
          {Array.isArray(punjabi) && punjabi.map((s, i) =>
            s ? (
              <SongCard key={s.id} id={s.id}
                image={s.image?.[2]?.url || s.image?.[1]?.url}
                title={s.name}
                artist={s.artists?.primary?.[0]?.name} />
            ) : <SongCard key={i} />
          )}
        </ScrollSection>

        {/* ── Podcasts (live from YouTube Music via Muzo) ── */}
        <ScrollSection title="🎙️ Podcasts" subtitle="Live from YouTube Music" href="/podcasts">
          {(podcasts.length > 0 ? podcasts : DEMO_PODCASTS).slice(0, 8).map(pod => (
            <PodcastCard key={pod.id} {...pod}
              isPlaying={playingPod === pod.id}
              onPlay={() => {
                if (pod.ytId) {
                  yt?.playVideo?.({ id: pod.ytId, title: pod.title, channelTitle: pod.host, thumbnail: pod.image });
                  toast(`🎙 ${(pod.title || "").slice(0,40)}`);
                }
                setPlayingPod(pod.id);
                setPodcastPod(pod);
              }} />
          ))}
        </ScrollSection>

        {/* ── YouTube setup nudge (only if no key) ─────── */}
        {!ytHasKey && (
          <div className="p-5 rounded-2xl"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(255,0,60,0.07)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>
              🔴 YouTube live data — optional setup
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              YouTube cards above show demo content. To enable live trending videos, add{" "}
              <code className="px-1 rounded" style={{ background: "var(--border-subtle)", color: "var(--text-secondary)" }}>NEXT_PUBLIC_RAPIDAPI_KEY</code>
              {" "}to your <code className="px-1 rounded" style={{ background: "var(--border-subtle)", color: "var(--text-secondary)" }}>.env.local</code>.
              {" "}YouTube audio playback already works without any key.
            </p>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────── */}
        <Footer />
      </div>

      {/* Podcast player modal */}
      {podcastPod && (
        <PodcastPlayer
          podcast={podcastPod}
          onClose={() => { setPodcastPod(null); setPlayingPod(null); }}
        />
      )}
    </div>
  );
}
