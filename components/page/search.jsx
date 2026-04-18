"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, X } from "lucide-react";
import { muzoSuggestions } from "@/lib/muzo";

export default function Search() {
  const router = useRouter();
  const [query,  setQuery]   = useState("");
  const [suggs,  setSuggs]   = useState([]);
  const [open,   setOpen]    = useState(false);
  const [focused,setFocused] = useState(false);
  const timer   = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim() || query.length < 2) { setSuggs([]); return; }
    timer.current = setTimeout(async () => {
      const r = await muzoSuggestions(query, true).catch(() => []);
      setSuggs(r.slice(0, 8));
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const go = (q) => {
    if (!q?.trim()) return;
    router.push("/search/" + encodeURIComponent(q.trim()));
    setSuggs([]); setOpen(false); setQuery("");
  };

  const showDropdown = open && focused && suggs.length > 0;

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={e => { e.preventDefault(); go(query); }} className="flex items-center relative w-full">
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
            background:    "var(--bg-card)",
            border:        "1px solid var(--border-primary)",
            color:         "var(--text-primary)",
            fontFamily:    "Rajdhani, sans-serif",
            letterSpacing: "0.02em",
            height:        "38px",
          }}
          onFocus={e => {
            e.target.style.borderColor = "var(--accent)";
            e.target.style.boxShadow   = "0 0 0 2px color-mix(in srgb, var(--accent) 15%, transparent)";
          }}
          onBlur={e => {
            e.target.style.borderColor = "var(--border-primary)";
            e.target.style.boxShadow   = "none";
          }}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setSuggs([]); }}
            className="absolute right-9 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button type="submit"
          className="absolute right-0 h-full px-3 transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
          <SearchIcon className="w-4 h-4" />
        </button>
      </form>

      {showDropdown && (
        <div className="arise-search-dropdown absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
          style={{
            background:    "var(--bg-elevated)",
            border:        "1px solid var(--border-primary)",
            boxShadow:     "0 8px 40px rgba(0,0,0,0.25)",
            backdropFilter:"blur(20px)",
          }}>
          {suggs.map((s, i) => {
            const text = typeof s === "string" ? s : s.text || s.query || String(s);
            return (
              <button key={i} onClick={() => go(text)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                <SearchIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm truncate" style={{ fontFamily: "Rajdhani, sans-serif" }}>{text}</span>
              </button>
            );
          })}
          <div style={{ borderTop: "1px solid var(--border-subtle)" }} className="px-4 py-2">
            <button onClick={() => go(query)}
              className="text-xs font-semibold transition-colors"
              style={{ color: "var(--accent)", fontFamily: "Rajdhani, sans-serif" }}>
              Search for "{query}" →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
