"use client";
import AlbumCard from "@/components/cards/album";
import ArtistCard from "@/components/cards/artist";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getSongsByQuery, searchAlbumByQuery, searchPlaylistsByQuery } from "@/lib/fetch";
import { useEffect, useState } from "react";

function SectionTitle({ label, sub }) {
  return (
    <div className="mb-5">
      <h2
        className="text-base font-bold tracking-wide"
        style={{ color: '#e8e8f8', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.06em' }}
      >
        {label}
      </h2>
      <p className="remix-section-title mt-0.5">{sub}</p>
    </div>
  );
}

function SkeletonRow({ count = 8 }) {
  return (
    <div className="flex gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SongCard key={i} />
      ))}
    </div>
  );
}

export default function Page() {
  const [latest, setLatest] = useState([]);
  const [trending, setTrending] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [bollywood, setBollywood] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [r1, r2, r3, r4] = await Promise.all([
          getSongsByQuery("latest 2024", 1, 15).then(r => r.json()),
          getSongsByQuery("trending hits", 1, 15).then(r => r.json()),
          searchAlbumByQuery("popular albums", 1, 12).then(r => r.json()),
          getSongsByQuery("bollywood 2024", 1, 12).then(r => r.json()),
        ]);
        setLatest(r1?.data?.results || []);
        setTrending(r2?.data?.results || []);
        setAlbums(r3?.data?.results || []);
        setBollywood(r4?.data?.results || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  // Extract unique artists from latest songs
  const artists = latest.length
    ? [...new Map(
        latest
          .filter(s => s?.artists?.primary?.[0]?.id)
          .map(s => [s.artists.primary[0].id, s.artists.primary[0]])
      ).values()].slice(0, 12)
    : [];

  return (
    <div className="px-5 md:px-8 lg:px-12 py-8 space-y-14">

      {/* Hero greeting */}
      <div
        className="reveal-up rounded-2xl px-7 py-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139,0,0,0.25) 0%, rgba(18,18,32,0.9) 50%, rgba(124,58,237,0.15) 100%)',
          border: '1px solid rgba(255,0,60,0.1)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Decorative glow orbs */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,0,60,0.15) 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          <p
            className="text-xs uppercase tracking-[0.3em] mb-2"
            style={{ color: '#FF003C', fontFamily: 'Orbitron, sans-serif' }}
          >
            Welcome to
          </p>
          <h1
            className="text-4xl sm:text-5xl font-black mb-2"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              background: 'linear-gradient(135deg, #FF003C 0%, #9D4EDD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(255,0,60,0.3))',
            }}
          >
            RemiX
          </h1>
          <p
            className="text-sm font-medium"
            style={{ color: '#8888aa', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.06em' }}
          >
            UNLEASH THE SOUND FROM THE ABYSS
          </p>
        </div>
      </div>

      {/* New Releases */}
      <section className="reveal-up reveal-up-1">
        <SectionTitle label="New Releases" sub="Fresh from the underworld" />
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {latest.length
              ? latest.map(song => (
                  <SongCard
                    key={song.id}
                    id={song.id}
                    image={song.image?.[2]?.url}
                    title={song.name}
                    artist={song.artists?.primary?.[0]?.name}
                  />
                ))
              : <SkeletonRow />
            }
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </section>

      {/* Trending */}
      <section className="reveal-up reveal-up-2">
        <SectionTitle label="Trending Now" sub="Most summoned this week" />
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {trending.length
              ? trending.map(song => (
                  <SongCard
                    key={song.id}
                    id={song.id}
                    image={song.image?.[2]?.url}
                    title={song.name}
                    artist={song.artists?.primary?.[0]?.name}
                  />
                ))
              : <SkeletonRow />
            }
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </section>

      {/* Artists */}
      {(artists.length > 0) && (
        <section className="reveal-up reveal-up-3">
          <SectionTitle label="Artists" sub="The voices of the void" />
          <ScrollArea>
            <div className="flex gap-5 pb-3">
              {artists.map(artist => (
                <ArtistCard
                  key={artist.id}
                  id={artist.id}
                  name={artist.name}
                  image={
                    artist.image?.[2]?.url ||
                    `https://az-avatar.vercel.app/api/avatar/?bgColor=0f0f0f0&fontSize=60&text=${artist.name?.[0]?.toUpperCase() || 'U'}`
                  }
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
          </ScrollArea>
        </section>
      )}

      {/* Albums */}
      <section className="reveal-up reveal-up-4">
        <SectionTitle label="Albums" sub="Collections from the crypt" />
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {albums.length
              ? albums.map(album => (
                  <AlbumCard
                    key={album.id}
                    id={`album/${album.id}`}
                    image={album.image?.[2]?.url}
                    title={album.name}
                    artist={album.artists?.primary?.[0]?.name || album.description}
                    lang={album.language}
                  />
                ))
              : <SkeletonRow />
            }
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </section>

      {/* Bollywood Hits */}
      <section>
        <SectionTitle label="Bollywood Hits" sub="The mortal realm's finest" />
        <ScrollArea>
          <div className="flex gap-4 pb-3">
            {bollywood.length
              ? bollywood.map(song => (
                  <SongCard
                    key={song.id}
                    id={song.id}
                    image={song.image?.[2]?.url}
                    title={song.name}
                    artist={song.artists?.primary?.[0]?.name}
                  />
                ))
              : <SkeletonRow count={8} />
            }
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </section>

    </div>
  );
}
