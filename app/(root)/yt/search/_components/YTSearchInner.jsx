"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { searchYT, hasApiKey } from "@/lib/youtube";
import YTCard from "@/components/youtube/yt-card";
import YTPlayer from "@/components/youtube/yt-player";
import { useYT } from "@/hooks/use-youtube";
import { SearchIcon, Loader2, AlertTriangle } from "lucide-react";

export default function YTSearchInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const initialQ     = searchParams.get("q") || "";

  const [query,    setQuery]   = useState(initialQ);
  const [results,  setResults] = useState([]);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState(null);
  const debounceRef = useRef(null);
  const { currentVideo } = useYT();
  const apiKeySet = hasApiKey();

  const doSearch = useCallback(async (q) => {
    if (!q?.trim()) { setResults([]); return; }
    setLoading(true);
    setError(null);
    const { items, error: err } = await searchYT(q, "video");
    setLoading(false);
    if (err) { setError(err); return; }
    setResults(items);
  }, []);

  // Run search if there's a ?q= on first load
  useEffect(() => {
    if (initialQ) doSearch(initialQ);
  }, []); // eslint-disable-line

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.replace(`/yt/search?q=${encodeURIComponent(val)}`, { scroll: false });
      doSearch(val);
    }, 420);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    router.replace(`/yt/search?q=${encodeURIComponent(query)}`, { scroll: false });
    doSearch(query);
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">

      {/* ── Left: search + results ─────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 md:px-8 py-8 min-w-0">

        {/* Search input */}
        <form onSubmit={handleSubmit} className="relative max-w-xl mb-8">
          <input
            value={query}
            onChange={handleChange}
            placeholder="Search YouTube — music, artists, songs…"
            autoFocus
            className="w-full h-12 pr-14 pl-4 rounded-xl text-sm outline-none transition-all duration-200"
            style={{
              background:  "rgba(18,18,32,0.9)",
              border:      "1px solid rgba(255,0,60,0.15)",
              color:       "#e8e8f8",
              fontFamily:  "Rajdhani, sans-serif",
              letterSpacing: "0.02em",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(255,0,60,0.4)"}
            onBlur={e  => e.target.style.borderColor = "rgba(255,0,60,0.15)"}
          />
          <button type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: "rgba(255,0,60,0.15)", color: "#FF003C" }}>
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <SearchIcon className="w-4 h-4" />}
          </button>
        </form>

        {/* No API key warning */}
        {!apiKeySet && (
          <div className="mb-6 p-4 rounded-xl flex gap-3 items-start"
            style={{ background: "rgba(255,0,60,0.07)", border: "1px solid rgba(255,0,60,0.18)" }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#FF003C" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FF003C", fontFamily: "Rajdhani, sans-serif" }}>
                YouTube API key not configured
              </p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8888aa" }}>
                Add{" "}
                <code className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#ccccee" }}>
                  NEXT_PUBLIC_RAPIDAPI_KEY=your_key
                </code>{" "}
                to <code className="px-1 rounded text-[10px]" style={{ background: "rgba(255,255,255,0.06)", color: "#ccccee" }}>.env.local</code>{" "}
                — get a free key at{" "}
                <a href="https://rapidapi.com/ytjar/api/yt-api" target="_blank" rel="noopener noreferrer"
                  className="underline" style={{ color: "#FF003C" }}>
                  rapidapi.com
                </a>
              </p>
            </div>
          </div>
        )}

        {/* API error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl"
            style={{ background: "rgba(255,0,60,0.06)", border: "1px solid rgba(255,0,60,0.15)" }}>
            <p className="text-sm font-semibold" style={{ color: "#FF6680", fontFamily: "Rajdhani, sans-serif" }}>
              Error
            </p>
            <p className="text-xs mt-1" style={{ color: "#8888aa" }}>{error}</p>
          </div>
        )}

        {/* Results count */}
        {results.length > 0 && (
          <p className="remix-section-title mb-5">
            {results.length} results for "{query}"
          </p>
        )}

        {/* Results grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map(item => (
              <YTCard key={item.id} item={item} layout="grid" />
            ))}
          </div>
        )}

        {/* Empty result state */}
        {!loading && !error && query && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 rounded-2xl"
            style={{ background: "rgba(18,18,32,0.5)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="text-3xl mb-3">🎵</p>
            <p className="text-sm font-semibold" style={{ color: "#ccccee" }}>No results found</p>
            <p className="text-xs mt-1" style={{ color: "#8888aa" }}>Try a different search</p>
          </div>
        )}

        {/* Initial idle state */}
        {!query && !loading && (
          <div className="flex flex-col items-center justify-center h-48 rounded-2xl"
            style={{ background: "rgba(18,18,32,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <SearchIcon className="w-10 h-10 mb-3" style={{ color: "#44445a" }} />
            <p className="text-sm" style={{ color: "#8888aa" }}>Search for any song or artist</p>
          </div>
        )}
      </div>

      {/* ── Right: player panel (desktop) ────────────── */}
      {currentVideo && (
        <div
          className="hidden lg:flex flex-col flex-shrink-0 w-[380px] overflow-hidden"
          style={{ borderLeft: "1px solid rgba(255,0,60,0.07)", background: "rgba(5,5,10,0.97)" }}
        >
          <YTPlayer />
        </div>
      )}
    </div>
  );
}
