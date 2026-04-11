"use client";
import AlbumCard from "@/components/cards/album";
import ArtistCard from "@/components/cards/artist";
import SongCard from "@/components/cards/song";
import YTCard from "@/components/youtube/yt-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getSongsByQuery, searchAlbumByQuery } from "@/lib/fetch";
import { getTrending, searchYT, hasApiKey } from "@/lib/youtube";
import { useEffect, useState } from "react";

// Demon-themed section titles — the style that was requested from the start
const SECTIONS = {
  ytTrending:  { label: "🔴 Trending on YouTube",     sub: "Souls most summoned across the mortal realm"          },
  newReleases: { label: "New Releases",                sub: "Fresh blood spilled from the underworld"              },
  trending:    { label: "Trending Now",                sub: "The chants echoing through the abyss this week"       },
  ytLofi:      { label: "🎵 Lo-fi & Chill",            sub: "Haunting melodies for the restless undead"            },
  artists:     { label: "Artists",                     sub: "Voices conjured from the depths of hell"              },
  albums:      { label: "Albums",                      sub: "Grimoires of sound sealed in blood"                   },
  ytHiphop:    { label: "🎤 Hip Hop & Rap",            sub: "Bars forged in hellfire and ice"                      },
  bollywood:   { label: "Bollywood Hits",              sub: "Mortal realm anthems that shake the pits of Jahannam" },
  punjabi:     { label: "Punjabi Hits",                sub: "Thunderous hymns that wake the ancient spirits"       },
};

function Section({ id, children }) {
  const s = SECTIONS[id];
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-base font-bold"
          style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}>
          {s.label}
        </h2>
        <p className="remix-section-title mt-0.5">{s.sub}</p>
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
function YTSkeleton({ count = 5 }) {
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
  const [latest,     setLatest]     = useState([]);
  const [trending,   setTrending]   = useState([]);
  const [albums,     setAlbums]     = useState([]);
  const [bollywood,  setBollywood]  = useState([]);
  const [punjabi,    setPunjabi]    = useState([]);
  const [ytTrending, setYtTrending] = useState([]);
  const [ytLofi,     setYtLofi]     = useState([]);
  const [ytHiphop,   setYtHiphop]   = useState([]);
  const [ytHasKey,   setYtHasKey]   = useState(false);

  useEffect(() => {
    Promise.all([
      getSongsByQuery("new hindi songs 2024", 1, 15).then(r => r.json()).catch(() => null),
      getSongsByQuery("trending hits 2024",   1, 15).then(r => r.json()).catch(() => null),
      searchAlbumByQuery("latest album 2024", 1, 12).then(r => r.json()).catch(() => null),
      getSongsByQuery("bollywood hits",       1, 12).then(r => r.json()).catch(() => null),
      getSongsByQuery("punjabi songs 2024",   1, 12).then(r => r.json()).catch(() => null),
    ]).then(([r1, r2, r3, r4, r5]) => {
      if (r1) setLatest(r1?.data?.results    || []);
      if (r2) setTrending(r2?.data?.results  || []);
      if (r3) setAlbums(r3?.data?.results    || []);
      if (r4) setBollywood(r4?.data?.results || []);
      if (r5) setPunjabi(r5?.data?.results   || []);
    });

    const apiOk = hasApiKey();
    setYtHasKey(apiOk);
    if (apiOk) {
      getTrending("IN", "music").then(({ items }) => setYtTrending(items.slice(0, 12)));
      searchYT("lofi chill music", "video").then(({ items }) => setYtLofi(items.slice(0, 10)));
      searchYT("hip hop rap 2024", "video").then(({ items }) => setYtHiphop(items.slice(0, 10)));
    }
  }, []);

  const artists = latest.length
    ? [...new Map(
        latest.filter(s => s?.artists?.primary?.[0]?.id)
          .map(s => [s.artists.primary[0].id, s.artists.primary[0]])
      ).values()].slice(0, 12)
    : [];

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 space-y-12">

      {/* ── Hero ─────────────────────────────────────────── */}
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
            UNLEASH THE SOUND FROM THE ABYSS — SAAVN + YOUTUBE IN ONE INFERNAL PLAYER
          </p>
        </div>
      </div>

      {/* ── YouTube Trending ─────────────────────────────── */}
      {ytHasKey && (
        <Section id="ytTrending">
          <ScrollArea>
            <div className="flex gap-4 pb-3">
              {ytTrending.length ? ytTrending.map(v => <YTCard key={v.id} item={v} layout="scroll" />) : <YTSkeleton />}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Section>
      )}

      {/* ── Saavn New Releases ───────────────────────────── */}
      <Section id="newReleases">
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {latest.length
              ? latest.map(s => <SongCard key={s.id} id={s.id} image={s.image?.[2]?.url} title={s.name} artist={s.artists?.primary?.[0]?.name} />)
              : <SkeletonRow />}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Section>

      {/* ── Saavn Trending ───────────────────────────────── */}
      <Section id="trending">
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {trending.length
              ? trending.map(s => <SongCard key={s.id} id={s.id} image={s.image?.[2]?.url} title={s.name} artist={s.artists?.primary?.[0]?.name} />)
              : <SkeletonRow />}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Section>

      {/* ── YouTube Lo-fi ────────────────────────────────── */}
      {ytHasKey && (
        <Section id="ytLofi">
          <ScrollArea>
            <div className="flex gap-4 pb-3">
              {ytLofi.length ? ytLofi.map(v => <YTCard key={v.id} item={v} layout="scroll" />) : <YTSkeleton count={4} />}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Section>
      )}

      {/* ── Artists ──────────────────────────────────────── */}
      {artists.length > 0 && (
        <Section id="artists">
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

      {/* ── Albums ───────────────────────────────────────── */}
      <Section id="albums">
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {albums.length
              ? albums.map(a => <AlbumCard key={a.id} id={`album/${a.id}`} image={a.image?.[2]?.url} title={a.name} artist={a.artists?.primary?.[0]?.name || a.description} lang={a.language} />)
              : <SkeletonRow />}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Section>

      {/* ── YouTube Hip Hop ──────────────────────────────── */}
      {ytHasKey && (
        <Section id="ytHiphop">
          <ScrollArea>
            <div className="flex gap-4 pb-3">
              {ytHiphop.length ? ytHiphop.map(v => <YTCard key={v.id} item={v} layout="scroll" />) : <YTSkeleton count={4} />}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Section>
      )}

      {/* ── Bollywood ────────────────────────────────────── */}
      <Section id="bollywood">
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {bollywood.length
              ? bollywood.map(s => <SongCard key={s.id} id={s.id} image={s.image?.[2]?.url} title={s.name} artist={s.artists?.primary?.[0]?.name} />)
              : <SkeletonRow count={6} />}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Section>

      {/* ── Punjabi ──────────────────────────────────────── */}
      <Section id="punjabi">
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {punjabi.length
              ? punjabi.map(s => <SongCard key={s.id} id={s.id} image={s.image?.[2]?.url} title={s.name} artist={s.artists?.primary?.[0]?.name} />)
              : <SkeletonRow count={6} />}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Section>

      {/* ── No YT key nudge ──────────────────────────────── */}
      {!ytHasKey && (
        <div className="p-5 rounded-2xl text-center"
          style={{ background: "rgba(18,18,32,0.6)", border: "1px solid rgba(255,0,60,0.07)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>
            🔴 YouTube sections sealed behind the gate
          </p>
          <p className="text-xs" style={{ color: "#8888aa" }}>
            Add{" "}
            <code className="px-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#ccccee" }}>NEXT_PUBLIC_RAPIDAPI_KEY</code>
            {" "}to <code className="px-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#ccccee" }}>.env.local</code>
            {" "}to unseal the YouTube dimension.
          </p>
        </div>
      )}
    </div>
  );
}
