"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, X } from "lucide-react";
import { muzoSuggestions } from "@/lib/muzo";

export default function Search() {
  const router   = useRouter();
  const [query,  setQuery]       = useState("");
  const [suggestions, setSugg]  = useState([]);
  const [open,   setOpen]        = useState(false);
  const [focused,setFocused]     = useState(false);
  const timer    = useRef(null);
  const wrapRef  = useRef(null);

  // Fetch suggestions via Muzo (debounced)
  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim() || query.length < 2) { setSugg([]); return; }
    timer.current = setTimeout(async () => {
      const results = await muzoSuggestions(query, true).catch(() => []);
      setSugg(results.slice(0, 8));
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    router.push("/search/" + encodeURIComponent(query.trim()));
    setSugg([]); setOpen(false);
  };

  const pickSuggestion = (s) => {
    const text = typeof s === "string" ? s : s.text || s.query || s;
    setQuery(text);
    router.push("/search/" + encodeURIComponent(text));
    setSugg([]); setOpen(false);
  };

  const showDropdown = open && focused && suggestions.length > 0;

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex items-center relative w-full">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          autoComplete="off"
          type="search"
          placeholder="Search songs, artists, albums…"
          className="w-full rounded-xl pr-16 pl-4 py-2 text-sm outline-none transition-all duration-200"
          style={{
            background:   "rgba(18,18,32,0.8)",
            border:       "1px solid rgba(255,0,60,0.12)",
            color:        "#ccccee",
            fontFamily:   "Rajdhani, sans-serif",
            letterSpacing:"0.02em",
            height:       "38px",
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(255,0,60,0.4)"; e.target.style.boxShadow = "0 0 0 2px rgba(255,0,60,0.1)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(255,0,60,0.12)"; e.target.style.boxShadow = "none"; }}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setSugg([]); }}
            className="absolute right-9 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center transition-colors"
            style={{ color: "#44445a" }}
            onMouseEnter={e => e.currentTarget.style.color = "#FF003C"}
            onMouseLeave={e => e.currentTarget.style.color = "#44445a"}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button type="submit"
          className="absolute right-0 h-full px-3 transition-colors"
          style={{ color: "#8888aa" }}
          onMouseEnter={e => e.currentTarget.style.color = "#FF003C"}
          onMouseLeave={e => e.currentTarget.style.color = "#8888aa"}>
          <SearchIcon className="w-4 h-4" />
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
          style={{ background: "rgba(10,10,20,0.98)", border: "1px solid rgba(255,0,60,0.12)", boxShadow: "0 8px 40px rgba(0,0,0,0.7)", backdropFilter: "blur(20px)" }}>
          {suggestions.map((s, i) => {
            const text = typeof s === "string" ? s : s.text || s.query || String(s);
            return (
              <button key={i} onClick={() => pickSuggestion(s)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                style={{ color: "#ccccee" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,0,60,0.07)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ccccee"; }}>
                <SearchIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#44445a" }} />
                <span className="text-sm truncate" style={{ fontFamily: "Rajdhani, sans-serif" }}>{text}</span>
              </button>
            );
          })}
          <div className="border-t px-4 py-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <button onClick={handleSubmit} className="text-xs font-semibold transition-colors"
              style={{ color: "#FF003C", fontFamily: "Rajdhani, sans-serif" }}>
              Search for "{query}" →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
