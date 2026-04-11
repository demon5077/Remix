"use client";
import AlbumCard from "@/components/cards/album";
import ArtistCard from "@/components/cards/artist";
import SongCard from "@/components/cards/song";
import YTCard from "@/components/youtube/yt-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getSongsByQuery, searchAlbumByQuery } from "@/lib/fetch";
import { searchYT, hasApiKey } from "@/lib/youtube";
import { useEffect, useState } from "react";
import { Music, Video } from "lucide-react";

export default function Search({ params }) {
  const query = decodeURIComponent(params.id);

  const [songs,     setSongs]     = useState([]);
  const [albums,    setAlbums]    = useState([]);
  const [artists,   setArtists]   = useState([]);
  const [ytResults, setYtResults] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("all");
  const apiOk = hasApiKey();

  useEffect(() => {
    setLoading(true);
    setSongs([]); setAlbums([]); setArtists([]); setYtResults([]);

    const tasks = [
      getSongsByQuery(query, 1, 20).then(r => r.json()).catch(() => null),
      searchAlbumByQuery(query, 1, 12).then(r => r.json()).catch(() => null),
    ];
    if (apiOk) tasks.push(searchYT(query, "video").catch(() => ({ items: [] })));

    Promise.all(tasks).then(([r1, r2, r3]) => {
      const songList = r1?.data?.results || [];
      setSongs(songList);
      setAlbums(r2?.data?.results || []);
      setArtists([...new Map(
        songList.filter(s => s?.artists?.primary?.[0]?.id)
          .map(s => [s.artists.primary[0].id, s.artists.primary[0]])
      ).values()]);
      if (r3) setYtResults(r3.items || []);
      setLoading(false);
    });
  }, [params.id]);

  const TABS = [
    { id: "all",    label: "All"     },
    { id: "songs",  label: "Songs"   },
    { id: "albums", label: "Albums"  },
    ...(apiOk ? [{ id: "videos", label: "Videos" }] : []),
  ];

  const show = (t) => tab === "all" || tab === t;

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] mb-1"
          style={{ color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}>Search Results</p>
        <h1 className="text-2xl sm:text-3xl font-black"
          style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
          "{query}"
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              fontFamily:  "Rajdhani, sans-serif",
              letterSpacing: "0.06em",
              background:  tab === t.id ? "linear-gradient(135deg, #8B0000, #FF003C)" : "rgba(18,18,32,0.8)",
              color:       tab === t.id ? "white" : "#8888aa",
              border:      tab === t.id ? "1px solid rgba(255,0,60,0.4)" : "1px solid rgba(255,255,255,0.06)",
              boxShadow:   tab === t.id ? "0 0 16px rgba(255,0,60,0.3)" : "none",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Shimmer */}
      {loading && (
        <div className="space-y-10">
          {[1, 2].map(i => (
            <div key={i}>
              <div className="remix-shimmer h-4 w-32 rounded mb-5" />
              <div className="flex gap-4">
                {Array.from({ length: 5 }).map((_, j) => <SongCard key={j} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-12">

          {/* Songs */}
          {show("songs") && songs.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <Music className="w-4 h-4 flex-shrink-0" style={{ color: "#FF003C" }} />
                <div>
                  <h2 className="text-base font-bold" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>Songs</h2>
                  <p className="remix-section-title">{songs.length} results from JioSaavn</p>
                </div>
              </div>
              <ScrollArea>
                <div className="flex gap-4 pb-3">
                  {songs.map(s => (
                    <SongCard key={s.id} id={s.id}
                      image={s.image?.[2]?.url} title={s.name}
                      artist={s.artists?.primary?.[0]?.name || "Unknown"} />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </section>
          )}

          {/* YouTube videos */}
          {show("videos") && ytResults.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <Video className="w-4 h-4 flex-shrink-0" style={{ color: "#FF4444" }} />
                <div>
                  <h2 className="text-base font-bold" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>Videos</h2>
                  <p className="remix-section-title">{ytResults.length} results from YouTube</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {ytResults.map(v => <YTCard key={v.id} item={v} layout="grid" />)}
              </div>
            </section>
          )}

          {/* Albums */}
          {show("albums") && albums.length > 0 && (
            <section>
              <div className="mb-5">
                <h2 className="text-base font-bold" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>Albums</h2>
                <p className="remix-section-title">{albums.length} results</p>
              </div>
              <ScrollArea>
                <div className="flex gap-4 pb-3">
                  {albums.map(a => (
                    <AlbumCard key={a.id} id={`album/${a.id}`}
                      image={a.image?.[2]?.url} title={a.name}
                      artist={a.artists?.primary?.[0]?.name || a.description}
                      lang={a.language} />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </section>
          )}

          {/* Artists */}
          {show("songs") && artists.length > 0 && (
            <section>
              <div className="mb-5">
                <h2 className="text-base font-bold" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>Artists</h2>
                <p className="remix-section-title">{artists.length} found</p>
              </div>
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
            </section>
          )}

          {/* Empty */}
          {!songs.length && !albums.length && !ytResults.length && (
            <div className="flex flex-col items-center justify-center h-48 rounded-2xl"
              style={{ background: "rgba(18,18,32,0.5)", border: "1px solid rgba(255,0,60,0.07)" }}>
              <p className="text-3xl mb-3">😈</p>
              <p className="text-sm font-semibold" style={{ color: "#ccccee" }}>Nothing found in the abyss</p>
              <p className="text-xs mt-1" style={{ color: "#8888aa" }}>Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
