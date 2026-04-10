"use client";
import AlbumCard from "@/components/cards/album";
import ArtistCard from "@/components/cards/artist";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getSongsByQuery, searchAlbumByQuery, searchArtistsByQuery, globalSearch } from "@/lib/fetch";
import { useEffect, useState } from "react";

const TABS = ["All", "Songs", "Albums", "Artists"];

export default function Search({ params }) {
  const query = decodeURIComponent(params.id);

  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setSongs([]); setAlbums([]); setArtists([]);
      try {
        const [r1, r2] = await Promise.all([
          getSongsByQuery(query, 1, 20).then(r => r.json()),
          searchAlbumByQuery(query, 1, 12).then(r => r.json()),
        ]);
        setSongs(r1?.data?.results || []);
        setAlbums(r2?.data?.results || []);

        // Derive unique artists from songs
        const uniqueArtists = [...new Map(
          (r1?.data?.results || [])
            .filter(s => s?.artists?.primary?.[0]?.id)
            .map(s => [s.artists.primary[0].id, s.artists.primary[0]])
        ).values()];
        setArtists(uniqueArtists);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (query) load();
  }, [params.id]);

  const showSongs   = activeTab === "All" || activeTab === "Songs";
  const showAlbums  = activeTab === "All" || activeTab === "Albums";
  const showArtists = activeTab === "All" || activeTab === "Artists";

  return (
    <div className="px-5 md:px-8 lg:px-12 py-8">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] mb-1" style={{ color: '#FF003C', fontFamily: 'Orbitron, sans-serif' }}>
          Search Results
        </p>
        <h1
          className="text-2xl sm:text-3xl font-black"
          style={{ fontFamily: 'Orbitron, sans-serif', color: '#e8e8f8' }}
        >
          "{query}"
        </h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: '0.06em',
              background: activeTab === tab
                ? 'linear-gradient(135deg, #8B0000, #FF003C)'
                : 'rgba(18,18,32,0.8)',
              color: activeTab === tab ? 'white' : '#8888aa',
              border: activeTab === tab
                ? '1px solid rgba(255,0,60,0.4)'
                : '1px solid rgba(255,255,255,0.06)',
              boxShadow: activeTab === tab ? '0 0 16px rgba(255,0,60,0.3)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading shimmer */}
      {loading && (
        <div className="space-y-10">
          {[1, 2].map(s => (
            <div key={s}>
              <div className="remix-shimmer h-4 w-32 rounded mb-5" />
              <div className="flex gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SongCard key={i} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-12">

          {/* Songs */}
          {showSongs && songs.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold" style={{ color: '#e8e8f8', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em' }}>
                    Songs
                  </h2>
                  <p className="remix-section-title">{songs.length} results</p>
                </div>
              </div>
              <ScrollArea>
                <div className="flex gap-4 pb-3">
                  {songs.map(song => (
                    <SongCard
                      key={song.id}
                      id={song.id}
                      image={song.image?.[2]?.url}
                      title={song.name}
                      artist={song.artists?.primary?.[0]?.name || "Unknown"}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden sm:flex" />
              </ScrollArea>
            </section>
          )}

          {/* Albums */}
          {showAlbums && albums.length > 0 && (
            <section>
              <div className="mb-5">
                <h2 className="text-base font-bold" style={{ color: '#e8e8f8', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em' }}>
                  Albums
                </h2>
                <p className="remix-section-title">{albums.length} results</p>
              </div>
              <ScrollArea>
                <div className="flex gap-4 pb-3">
                  {albums.map(album => (
                    <AlbumCard
                      key={album.id}
                      id={`album/${album.id}`}
                      image={album.image?.[2]?.url}
                      title={album.name}
                      artist={album.artists?.primary?.[0]?.name || album.description}
                      lang={album.language}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden sm:flex" />
              </ScrollArea>
            </section>
          )}

          {/* Artists */}
          {showArtists && artists.length > 0 && (
            <section>
              <div className="mb-5">
                <h2 className="text-base font-bold" style={{ color: '#e8e8f8', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em' }}>
                  Artists
                </h2>
                <p className="remix-section-title">{artists.length} found</p>
              </div>
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

          {/* Empty state */}
          {!songs.length && !albums.length && !artists.length && (
            <div
              className="flex flex-col items-center justify-center h-48 rounded-2xl text-center"
              style={{
                background: 'rgba(18,18,32,0.6)',
                border: '1px solid rgba(255,0,60,0.07)',
              }}
            >
              <p className="text-3xl mb-3">😈</p>
              <p className="text-sm font-semibold" style={{ color: '#ccccee' }}>Nothing found in the abyss</p>
              <p className="text-xs mt-1" style={{ color: '#8888aa' }}>Try a different search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
