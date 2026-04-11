"use client";
import AlbumCard from "@/components/cards/album";
import ArtistCard from "@/components/cards/artist";
import SongCard from "@/components/cards/song";
import YTCard from "@/components/youtube/yt-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getSongsByQuery, searchAlbumByQuery } from "@/lib/fetch";
import { getTrending, searchYT, hasApiKey } from "@/lib/youtube";
import { useEffect, useState } from "react";

function Section({ label, sub, children }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-base font-bold"
          style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}>
          {label}
        </h2>
        <p className="remix-section-title mt-0.5">{sub}</p>
      </div>
      {children}
    </section>
  );
}

function SkeletonRow({ count = 7 }) {
  return (
    <div className="flex gap-4">
      {Array.from({ length: count }).map((_, i) => <SongCard key={i} />)}
    </div>
  );
}

function YTSkeletonRow({ count = 5 }) {
  return (
    <div className="flex gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[200px] space-y-2.5">
          <div className="remix-shimmer w-full h-[112px] rounded-xl" />
          <div className="remix-shimmer h-3.5 w-4/5 rounded" />
          <div className="remix-shimmer h-3 w-3/5 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  // Saavn state
  const [latest,    setLatest]    = useState([]);
  const [trending,  setTrending]  = useState([]);
  const [albums,    setAlbums]    = useState([]);
  const [bollywood, setBollywood] = useState([]);
  const [punjabi,   setPunjabi]   = useState([]);

  // YouTube state
  const [ytTrending, setYtTrending] = useState([]);
  const [ytLofi,     setYtLofi]     = useState([]);
  const [ytHiphop,   setYtHiphop]   = useState([]);
  const [ytHasKey,   setYtHasKey]   = useState(false);

  useEffect(() => {
    // Saavn — parallel
    Promise.all([
      getSongsByQuery("new hindi songs 2024",  1, 15).then(r => r.json()).catch(() => null),
      getSongsByQuery("trending hits 2024",    1, 15).then(r => r.json()).catch(() => null),
      searchAlbumByQuery("latest album 2024",  1, 12).then(r => r.json()).catch(() => null),
      getSongsByQuery("bollywood hits",        1, 12).then(r => r.json()).catch(() => null),
      getSongsByQuery("punjabi songs 2024",    1, 12).then(r => r.json()).catch(() => null),
    ]).then(([r1, r2, r3, r4, r5]) => {
      if (r1) setLatest(r1?.data?.results    || []);
      if (r2) setTrending(r2?.data?.results  || []);
      if (r3) setAlbums(r3?.data?.results    || []);
      if (r4) setBollywood(r4?.data?.results || []);
      if (r5) setPunjabi(r5?.data?.results   || []);
    });

    // YouTube — only if key set
    const apiOk = hasApiKey();
    setYtHasKey(apiOk);
    if (apiOk) {
      getTrending("IN", "music").then(({ items }) => setYtTrending(items.slice(0, 12)));
      searchYT("lofi chill music", "video").then(({ items }) => setYtLofi(items.slice(0, 10)));
      searchYT("hip hop music 2024", "video").then(({ items }) => setYtHiphop(items.slice(0, 10)));
    }
  }, []);

  // Extract unique artists
  const artists = latest.length
    ? [...new Map(
        latest.filter(s => s?.artists?.primary?.[0]?.id)
          .map(s => [s.artists.primary[0].id, s.artists.primary[0]])
      ).values()].slice(0, 12)
    : [];

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 space-y-12">

      {/* Hero */}
      <div className="reveal-up rounded-2xl px-7 py-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(139,0,0,0.25) 0%, rgba(18,18,32,0.9) 50%, rgba(124,58,237,0.15) 100%)",
          border:     "1px solid rgba(255,0,60,0.1)",
          boxShadow:  "0 4px 40px rgba(0,0,0,0.4)",
        }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,0,60,0.15) 0%, transparent 70%)" }} />
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.3em] mb-2"
            style={{ color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}>
            Welcome to
          </p>
          <h1 className="text-4xl sm:text-5xl font-black mb-2"
            style={{
              fontFamily: "Orbitron, sans-serif",
              background: "linear-gradient(135deg, #FF003C 0%, #9D4EDD 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              filter: "drop-shadow(0 0 20px rgba(255,0,60,0.3))",
            }}>
            RemiX
          </h1>
          <p className="text-sm font-medium"
            style={{ color: "#8888aa", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.06em" }}>
            SAAVN AUDIO + YOUTUBE VIDEO — ALL IN ONE PLAYER
          </p>
        </div>
      </div>

      {/* ── YouTube Trending (if key set) ─────────────────── */}
      {ytHasKey && (
        <Section label="🔴 YouTube Trending" sub="Top music videos right now">
          <ScrollArea>
            <div className="flex gap-4 pb-3">
              {ytTrending.length ? ytTrending.map(v => <YTCard key={v.id} item={v} layout="scroll" />) : <YTSkeletonRow />}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Section>
      )}

      {/* ── Saavn New Releases ─────────────────────────────── */}
      <Section label="New Releases" sub="Fresh drops from JioSaavn">
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {latest.length
              ? latest.map(s => (
                  <SongCard key={s.id} id={s.id}
                    image={s.image?.[2]?.url} title={s.name}
                    artist={s.artists?.primary?.[0]?.name} />
                ))
              : <SkeletonRow />}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Section>

      {/* ── Saavn Trending ────────────────────────────────── */}
      <Section label="Trending Songs" sub="Most played this week">
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {trending.length
              ? trending.map(s => (
                  <SongCard key={s.id} id={s.id}
                    image={s.image?.[2]?.url} title={s.name}
                    artist={s.artists?.primary?.[0]?.name} />
                ))
              : <SkeletonRow />}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Section>

      {/* ── YouTube Lo-fi ─────────────────────────────────── */}
      {ytHasKey && (
        <Section label="🎵 YouTube Lo-fi & Chill" sub="Perfect study & focus vibes">
          <ScrollArea>
            <div className="flex gap-4 pb-3">
              {ytLofi.length ? ytLofi.map(v => <YTCard key={v.id} item={v} layout="scroll" />) : <YTSkeletonRow count={4} />}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Section>
      )}

      {/* ── Artists ───────────────────────────────────────── */}
      {artists.length > 0 && (
        <Section label="Artists" sub="Voices you love">
          <ScrollArea>
            <div className="flex gap-5 pb-3">
              {artists.map(a => (
                <ArtistCard key={a.id} id={a.id} name={a.name}
                  image={a.image?.[2]?.url ||
                    `https://az-avatar.vercel.app/api/avatar/?bgColor=0f0f0f0&fontSize=60&text=${a.name?.[0]?.toUpperCase() || "U"}`}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Section>
      )}

      {/* ── Albums ────────────────────────────────────────── */}
      <Section label="Albums" sub="Complete collections">
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {albums.length
              ? albums.map(a => (
                  <AlbumCard key={a.id} id={`album/${a.id}`}
                    image={a.image?.[2]?.url} title={a.name}
                    artist={a.artists?.primary?.[0]?.name || a.description}
                    lang={a.language} />
                ))
              : <SkeletonRow />}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Section>

      {/* ── YouTube Hip Hop ───────────────────────────────── */}
      {ytHasKey && (
        <Section label="🎤 YouTube Hip Hop" sub="Latest rap & hip hop videos">
          <ScrollArea>
            <div className="flex gap-4 pb-3">
              {ytHiphop.length ? ytHiphop.map(v => <YTCard key={v.id} item={v} layout="scroll" />) : <YTSkeletonRow count={4} />}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Section>
      )}

      {/* ── Bollywood Hits ────────────────────────────────── */}
      <Section label="Bollywood Hits" sub="Timeless classics & new bangers">
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {bollywood.length
              ? bollywood.map(s => (
                  <SongCard key={s.id} id={s.id}
                    image={s.image?.[2]?.url} title={s.name}
                    artist={s.artists?.primary?.[0]?.name} />
                ))
              : <SkeletonRow count={6} />}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Section>

      {/* ── Punjabi Hits ──────────────────────────────────── */}
      <Section label="Punjabi Hits" sub="High energy Punjabi music">
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {punjabi.length
              ? punjabi.map(s => (
                  <SongCard key={s.id} id={s.id}
                    image={s.image?.[2]?.url} title={s.name}
                    artist={s.artists?.primary?.[0]?.name} />
                ))
              : <SkeletonRow count={6} />}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Section>

      {/* No YT key nudge */}
      {!ytHasKey && (
        <div className="p-5 rounded-2xl text-center"
          style={{ background: "rgba(18,18,32,0.6)", border: "1px solid rgba(255,0,60,0.07)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>
            🔴 YouTube sections not loaded
          </p>
          <p className="text-xs" style={{ color: "#8888aa" }}>
            Add <code className="px-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#ccccee" }}>NEXT_PUBLIC_RAPIDAPI_KEY</code> to{" "}
            <code className="px-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#ccccee" }}>.env.local</code> to enable YouTube content.
          </p>
        </div>
      )}
    </div>
  );
}
