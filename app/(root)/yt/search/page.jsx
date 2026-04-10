"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { searchYT } from "@/lib/youtube";
import YTCard from "@/components/youtube/yt-card";
import YTPlayer from "@/components/youtube/yt-player";
import { useYT } from "@/hooks/use-youtube";
import { SearchIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function YTSearchPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const initialQ     = searchParams.get("q") || "";

  const [query,   setQuery]   = useState(initialQ);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const debounceRef = useRef(null);
  const { currentVideo } = useYT();

  const doSearch = async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setError(null);
    const { items, error: err } = await searchYT(q, "video");
    setLoading(false);
    if (err) { setError(err); return; }
    setResults(items.filter(Boolean));
  };

  // Search on mount if there's a query param
  useEffect(() => {
    if (initialQ) doSearch(initialQ);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        router.replace(`/yt/search?q=${encodeURIComponent(val)}`, { scroll: false });
        doSearch(val);
      } else {
        setResults([]);
      }
    }, 420);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    if (query.trim()) {
      router.replace(`/yt/search?q=${encodeURIComponent(query)}`, { scroll: false });
      doSearch(query);
    }
  };

  const apiKeyMissing = !process.env.NEXT_PUBLIC_RAPIDAPI_KEY;

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0">
      {/* Left: Search + results */}
      <div className="flex-1 overflow-y-auto px-5 md:px-8 py-8 min-w-0">
        {/* Search bar */}
        <form onSubmit={handleSubmit} className="relative mb-8 max-w-xl">
          <Input
            value={query}
            onChange={handleInput}
            placeholder="Search YouTube music, artists, songs…"
            className="h-12 pr-12 text-base"
            autoFocus
            style={{ background: "rgba(18,18,32,0.9)", border: "1px solid rgba(255,0,60,0.15)" }}
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#FF003C" }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
          </button>
        </form>

        {/* API key warning */}
        {apiKeyMissing && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(255,0,60,0.08)", border: "1px solid rgba(255,0,60,0.2)" }}>
            <p className="text-sm font-semibold" style={{ color: "#FF003C", fontFamily: "Rajdhani, sans-serif" }}>
              ⚠️ YouTube API key not configured
            </p>
            <p className="text-xs mt-1" style={{ color: "#8888aa" }}>
              Add <code className="px-1 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>NEXT_PUBLIC_RAPIDAPI_KEY=your_key</code> to <code>.env.local</code> to enable YouTube search.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(255,0,60,0.06)", border: "1px solid rgba(255,0,60,0.15)" }}>
            <p className="text-sm" style={{ color: "#FF6680" }}>Error: {error}</p>
          </div>
        )}

        {/* Results header */}
        {results.length > 0 && (
          <p className="remix-section-title mb-4">{results.length} results for "{query}"</p>
        )}

        {/* Results grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((item) => item && <YTCard key={item.id} item={item} layout="grid" />)}
        </div>

        {/* Empty state */}
        {!loading && !error && query && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 rounded-2xl" style={{ background: "rgba(18,18,32,0.5)", border: "1px solid rgba(255,0,60,0.07)" }}>
            <p className="text-3xl mb-3">🎵</p>
            <p className="text-sm font-semibold" style={{ color: "#ccccee" }}>No results found</p>
            <p className="text-xs mt-1" style={{ color: "#8888aa" }}>Try a different search term</p>
          </div>
        )}

        {/* Initial empty */}
        {!query && !loading && (
          <div className="flex flex-col items-center justify-center h-48 rounded-2xl" style={{ background: "rgba(18,18,32,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <SearchIcon className="w-10 h-10 mb-3" style={{ color: "#44445a" }} />
            <p className="text-sm" style={{ color: "#8888aa" }}>Search for any song or artist</p>
          </div>
        )}
      </div>

      {/* Right: Player panel (desktop) */}
      {currentVideo && (
        <div
          className="hidden lg:flex flex-col flex-shrink-0 w-[380px] border-l overflow-hidden"
          style={{ borderColor: "rgba(255,0,60,0.07)", background: "rgba(5,5,10,0.95)" }}
        >
          <YTPlayer />
        </div>
      )}
    </div>
  );
}
