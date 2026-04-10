"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SearchIcon } from "lucide-react";

export default function Search() {
  const [query, setQuery] = useState("");
  const linkRef = useRef();
  const inpRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    linkRef.current.click();
    inpRef.current.blur();
    setQuery("");
  };

  return (
    <>
      <Link href={"/search/" + encodeURIComponent(query)} ref={linkRef} />
      <form onSubmit={handleSubmit} className="flex items-center relative w-full group">
        <Input
          ref={inpRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          type="search"
          name="query"
          placeholder="Search songs, artists, albums..."
          className="rounded-lg pr-10 text-sm font-body transition-all duration-300"
          style={{
            background: 'rgba(18,18,32,0.8)',
            border: '1px solid rgba(255,0,60,0.12)',
            color: '#ccccee',
            fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '0.02em',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(255,0,60,0.4)';
            e.target.style.boxShadow = '0 0 0 2px rgba(255,0,60,0.1), 0 0 15px rgba(255,0,60,0.08)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(255,0,60,0.12)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <Button
          variant="ghost"
          type="submit"
          size="icon"
          className="absolute right-0 h-full px-3 hover:text-hellfire transition-colors"
          style={{ color: '#8888aa' }}
        >
          <SearchIcon className="w-4 h-4" />
        </Button>
      </form>
    </>
  );
}
