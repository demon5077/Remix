"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { muzoSearch } from "@/lib/muzo";
import { Users, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const TRENDING_ARTISTS = [
  "Arijit Singh","Shreya Ghoshal","AP Dhillon","Diljit Dosanjh",
  "Badshah","Neha Kakkar","Jubin Nautiyal","Atif Aslam",
  "Armaan Malik","Darshan Raval","Guru Randhawa","B Praak",
  "KK","Sonu Nigam","Udit Narayan","Lata Mangeshkar",
  "Kishore Kumar","Mohammed Rafi","Asha Bhosle","Sunidhi Chauhan",
];

const GENRES = ["Bollywood","Punjabi","Indie","Classical","Lo-Fi","Hip-Hop","Pop"];

export default function ArtistsPage() {
  const router = useRouter();
  const [searchQ,    setSearchQ]    = useState("");
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [trendData,  setTrendData]  = useState([]);
  const [loadingT,   setLoadingT]   = useState(true);

  // Load trending artists thumbnails
  useEffect(() => {
    (async () => {
      setLoadingT(true);
      const artists = await Promise.all(
        TRENDING_ARTISTS.slice(0, 12).map(async (name) => {
          try {
            const r = await muzoSearch(name, "artists", 1);
            const a = r?.[0];
            return {
              name,
              id:        a?.browseId || a?.artistId || null,
              thumbnail: a?.thumbnails?.[2]?.url || a?.thumbnails?.[1]?.url || a?.thumbnails?.[0]?.url || a?.thumbnail || null,
            };
          } catch { return { name, id: null, thumbnail: null }; }
        })
      );
      setTrendData(artists);
      setLoadingT(false);
    })();
  }, []);

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const r = await muzoSearch(q, "artists", 12);
      setResults(r || []);
    } catch { toast.error("Search failed"); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => handleSearch(searchQ), 400);
    return () => clearTimeout(t);
  }, [searchQ, handleSearch]);

  const goToArtist = (artist) => {
    const id = artist.browseId || artist.artistId || artist.id;
    const name = artist.name || artist.title;
    if (id) router.push(`/artists/${id}?name=${encodeURIComponent(name)}`);
    else router.push(`/search/${encodeURIComponent(name)}`);
  };

  const goToTrendingArtist = (a) => {
    if (a.id) router.push(`/artists/${a.id}?name=${encodeURIComponent(a.name)}`);
    else router.push(`/search/${encodeURIComponent(a.name)}`);
  };

  return (
    <div className="px-4 md:px-8 py-8" style={{ color: "var(--text-primary)" }}>
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-6 h-6" style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>Artists</h1>
      </div>
      <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>Discover your favourite artists</p>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder="Search artists…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontFamily: "Rajdhani, sans-serif" }} />
      </div>

      {/* Genre tags */}
      {!searchQ && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {GENRES.map(g => (
            <button key={g} onClick={() => setSearchQ(g)}
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Search results */}
      {searchQ && (
        <div className="mb-6">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.1em" }}>
            SEARCH RESULTS
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({length:6}).map((_,i)=><div key={i} className="space-y-2"><div className="aspect-square rounded-full remix-shimmer" /><div className="h-3 w-3/4 mx-auto rounded remix-shimmer" /></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {results.map((a,i) => <ArtistCard key={i} name={a.name||a.title} thumbnail={a.thumbnails?.[0]?.url||a.thumbnail} onClick={() => goToArtist(a)} />)}
            </div>
          )}
        </div>
      )}

      {/* Trending artists */}
      {!searchQ && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.1em" }}>
              TRENDING ARTISTS
            </h2>
          </div>
          {loadingT ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({length:12}).map((_,i)=><div key={i} className="space-y-2"><div className="aspect-square rounded-full remix-shimmer" /><div className="h-3 w-3/4 mx-auto rounded remix-shimmer" /></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {trendData.map((a,i) => <ArtistCard key={i} name={a.name} thumbnail={a.thumbnail} onClick={() => goToTrendingArtist(a)} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ArtistCard({ name, thumbnail, onClick }) {
  const initials = name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-2 text-center">
      <div className="w-full aspect-square rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-105" style={{ imageRendering: "crisp-edges" }}
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 4px 20px var(--accent-glow)" }}>
        {thumbnail
          ? <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
          : <span className="w-full h-full flex items-center justify-center text-2xl font-black text-white" style={{ fontFamily: "Orbitron, sans-serif" }}>{initials}</span>}
      </div>
      <p className="text-xs font-semibold leading-tight" style={{ color: "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>{name}</p>
    </button>
  );
}
