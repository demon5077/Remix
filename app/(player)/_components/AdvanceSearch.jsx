"use client";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  Credenza, CredenzaBody, CredenzaContent,
  CredenzaHeader, CredenzaTitle, CredenzaTrigger,
} from "@/components/ui/credenza";
import Link from "next/link";
import { getSongsByQuery } from "@/lib/fetch";
import { Loader, SearchIcon, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IoPlay } from "react-icons/io5";

export default function AdvanceSearch() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setData([]); return; }
    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await getSongsByQuery(query, 1, 15);
        const res = await r.json();
        setData(res?.data?.results || []);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }, 380);
    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="px-5 md:px-8 lg:px-12 -mb-3">
      <Credenza>
        <CredenzaTrigger asChild>
          <div
            className="flex items-center relative z-10 w-full cursor-pointer group"
          >
            <div
              className="flex items-center h-11 w-full rounded-xl border px-4 text-sm transition-all duration-200 group-hover:border-red-500/30"
              style={{
                background: 'rgba(18,18,32,0.7)',
                border: '1px solid rgba(255,0,60,0.1)',
                color: '#8888aa',
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '0.03em',
              }}
            >
              <SearchIcon className="w-4 h-4 mr-2.5 flex-shrink-0" style={{ color: '#FF003C' }} />
              Search for songs...
            </div>
          </div>
        </CredenzaTrigger>

        <CredenzaContent
          style={{
            background: '#0d0d18',
            border: '1px solid rgba(255,0,60,0.12)',
          }}
        >
          <CredenzaHeader>
            <CredenzaTitle>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="pr-10 h-11"
                    type="search"
                    placeholder="Search songs, artists..."
                    autoComplete="off"
                    style={{
                      background: 'rgba(18,18,32,0.8)',
                      border: '1px solid rgba(255,0,60,0.15)',
                      color: '#e8e8f8',
                      fontFamily: 'Rajdhani, sans-serif',
                      letterSpacing: '0.02em',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,0,60,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,0,60,0.15)'}
                  />
                  <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8888aa' }} />
                </div>
                {query && (
                  <Link
                    href={`/search/${encodeURIComponent(query)}`}
                    className="flex-shrink-0 px-4 h-11 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200"
                    style={{
                      background: 'rgba(255,0,60,0.12)',
                      border: '1px solid rgba(255,0,60,0.25)',
                      color: '#FF003C',
                      fontFamily: 'Rajdhani, sans-serif',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <Search className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </CredenzaTitle>
          </CredenzaHeader>

          <CredenzaBody className="px-0 mb-4">
            {loading && (
              <div className="flex items-center justify-center h-[380px] gap-2" style={{ color: '#8888aa' }}>
                <Loader className="w-4 h-4 animate-spin" style={{ color: '#FF003C' }} />
                <span className="text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Searching the abyss...</span>
              </div>
            )}

            {!loading && !query && (
              <div className="flex flex-col items-center justify-center h-[380px] gap-2">
                <div className="text-4xl mb-2">😈</div>
                <p className="text-sm" style={{ color: '#8888aa', fontFamily: 'Rajdhani, sans-serif' }}>
                  Type to summon songs...
                </p>
              </div>
            )}

            {!loading && query && data.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[380px] gap-2">
                <p className="text-sm" style={{ color: '#8888aa' }}>Nothing found in the void.</p>
              </div>
            )}

            {!loading && query && data.length > 0 && (
              <>
                <div className="px-4 pb-2">
                  <p className="text-xs" style={{ color: '#44445a', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
                    {data.length} results for "{query}"
                  </p>
                </div>
                <ScrollArea className="h-[380px]">
                  <div className="flex flex-col gap-1.5 px-4">
                    {data.map(song => (
                      <Link
                        key={song.id}
                        href={`/${song.id}`}
                        className="group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200"
                        style={{
                          border: '1px solid rgba(255,0,60,0.05)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(24,24,40,0.8)';
                          e.currentTarget.style.borderColor = 'rgba(255,0,60,0.15)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'rgba(255,0,60,0.05)';
                        }}
                      >
                        <img
                          src={song.image?.[1]?.url}
                          alt={song.name}
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                          style={{ background: 'rgba(18,18,32,0.8)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold truncate transition-colors duration-200 group-hover:text-hellfire"
                            style={{ color: '#ccccee', fontFamily: 'Rajdhani, sans-serif' }}
                          >
                            {song.name}
                          </p>
                          <p className="text-xs truncate" style={{ color: '#8888aa' }}>
                            {song.artists?.primary?.[0]?.name || "Unknown"}
                          </p>
                        </div>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100"
                          style={{ background: 'rgba(255,0,60,0.9)', boxShadow: '0 0 10px rgba(255,0,60,0.5)' }}
                        >
                          <IoPlay className="w-3 h-3 text-white" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </div>
  );
}
