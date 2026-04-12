"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  startGoogleLogin, startSpotifyLogin,
  isGoogleLoggedIn, isSpotifyLoggedIn,
  getGoogleProfile, getSpotifyProfile,
  clearGoogleTokens, clearSpotifyTokens,
  fetchYouTubePlaylists, fetchSpotifyPlaylists,
  fetchYouTubePlaylistItems, fetchSpotifyPlaylistTracks,
} from "@/lib/auth";
import { useYT } from "@/hooks/use-youtube";
import { useMusicProvider } from "@/hooks/use-context";
import { getSongsByQuery } from "@/lib/fetch";
import { toast } from "sonner";
import {
  LogIn, LogOut, Music2, ListMusic, Play, RefreshCw,
  CheckCircle2, AlertCircle, Youtube, Clock, Heart,
} from "lucide-react";
import { Suspense } from "react";

function ProfileInner() {
  const searchParams = useSearchParams();
  const yt    = useYT();
  const saavn = useMusicProvider();

  const [googleProfile,  setGoogleProfile]  = useState(null);
  const [spotifyProfile, setSpotifyProfile] = useState(null);
  const [googlePlaylists, setGooglePlaylists] = useState([]);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [loadingYT,  setLoadingYT]  = useState(false);
  const [loadingSP,  setLoadingSP]  = useState(false);
  const [expandedPL, setExpandedPL] = useState(null);
  const [plTracks,   setPlTracks]   = useState({});
  const [loadingTracks, setLoadingTracks] = useState(null);

  const reload = useCallback(() => {
    setGoogleProfile(getGoogleProfile());
    setSpotifyProfile(getSpotifyProfile());
  }, []);

  useEffect(() => {
    reload();
    const connected = searchParams.get("connected");
    const error     = searchParams.get("error");
    if (connected === "google")  { toast.success("✅ Google account connected!"); loadYTPlaylists(); }
    if (connected === "spotify") { toast.success("✅ Spotify account connected!"); loadSPPlaylists(); }
    if (error) toast.error(`Connection failed: ${decodeURIComponent(error)}`);
  }, []);

  const loadYTPlaylists = async () => {
    setLoadingYT(true);
    const { playlists, error } = await fetchYouTubePlaylists();
    setLoadingYT(false);
    if (error) { toast.error(error); return; }
    setGooglePlaylists(playlists);
  };

  const loadSPPlaylists = async () => {
    setLoadingSP(true);
    const { playlists, error } = await fetchSpotifyPlaylists();
    setLoadingSP(false);
    if (error) { toast.error(error); return; }
    setSpotifyPlaylists(playlists);
  };

  const loadPlaylistTracks = async (pl) => {
    if (expandedPL === pl.id) { setExpandedPL(null); return; }
    setExpandedPL(pl.id);
    if (plTracks[pl.id]) return;
    setLoadingTracks(pl.id);
    let tracks = [];
    if (pl.source === "youtube") {
      const { items } = await fetchYouTubePlaylistItems(pl.id);
      tracks = items;
    } else {
      const { tracks: sp } = await fetchSpotifyPlaylistTracks(pl.id);
      tracks = sp;
    }
    setPlTracks(prev => ({ ...prev, [pl.id]: tracks }));
    setLoadingTracks(null);
  };

  // Play a YouTube playlist item
  const playYTTrack = (item) => {
    yt.playVideo(item);
    toast(`Playing: ${item.title}`);
  };

  // Play a Spotify track — search on Saavn by name+artist
  const playSPTrack = async (track) => {
    toast(`Finding "${track.name}" on Saavn…`);
    try {
      const res  = await getSongsByQuery(`${track.name} ${track.artists}`, 1, 5);
      const data = await res.json();
      const song = data?.data?.results?.[0];
      if (song) { saavn.playSong(song.id); toast.success(`🎵 Playing from Saavn`); }
      else toast.error("Not found on Saavn — try YouTube");
    } catch { toast.error("Search failed"); }
  };

  // Queue entire playlist
  const queueYTPlaylist = async (pl) => {
    const { items } = await fetchYouTubePlaylistItems(pl.id);
    if (!items.length) { toast.error("Playlist is empty"); return; }
    yt.playVideo(items[0]);
    yt.setQueue(items.slice(1));
    toast.success(`▶ Playing ${pl.title} (${items.length} videos)`);
  };

  const disconnectGoogle  = () => { clearGoogleTokens();  setGoogleProfile(null);  setGooglePlaylists([]); toast("Google disconnected"); };
  const disconnectSpotify = () => { clearSpotifyTokens(); setSpotifyProfile(null); setSpotifyPlaylists([]); toast("Spotify disconnected"); };

  const recentlyPlayed  = saavn.recentlyPlayed || [];
  const likedCount = (() => { try { return JSON.parse(localStorage.getItem("arise:likes") || "[]").length; } catch { return 0; } })();

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 max-w-4xl">

      {/* ── Page title ─────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] mb-1" style={{ color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}>Your Profile</p>
        <h1 className="text-2xl font-black" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
          Account & Playlists
        </h1>
        <p className="remix-section-title mt-1">Connect your services to import playlists from the mortal realm</p>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Played",  value: recentlyPlayed.length, icon: Clock,  color: "#FF003C" },
          { label: "Liked",   value: likedCount,            icon: Heart,  color: "#9D4EDD" },
          { label: "Sources", value: (isGoogleLoggedIn() ? 1 : 0) + (isSpotifyLoggedIn() ? 1 : 0) + 1, icon: Music2, color: "#7C3AED" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-2xl text-center"
            style={{ background: "rgba(18,18,32,0.7)", border: "1px solid rgba(255,0,60,0.07)" }}>
            <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
            <p className="text-xl font-black" style={{ color: "#e8e8f8", fontFamily: "Orbitron, sans-serif" }}>{value}</p>
            <p className="remix-section-title mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Connected Services ────────────────────────────────── */}
      <div className="space-y-4 mb-8">

        {/* Google / YouTube */}
        <ServiceCard
          icon={<Youtube className="w-5 h-5" style={{ color: "#FF4444" }} />}
          name="YouTube (Google)"
          color="#FF4444"
          profile={googleProfile}
          connected={isGoogleLoggedIn()}
          onConnect={() => { try { startGoogleLogin(); } catch(e) { toast.error(e.message); } }}
          onDisconnect={disconnectGoogle}
          onLoadPlaylists={loadYTPlaylists}
          loading={loadingYT}
          playlists={googlePlaylists}
          onExpandPL={loadPlaylistTracks}
          expandedPL={expandedPL}
          plTracks={plTracks}
          loadingTracks={loadingTracks}
          onPlayTrack={playYTTrack}
          onQueuePL={queueYTPlaylist}
          trackKeyLabel="title"
          trackKeySub="channelTitle"
        />

        {/* Spotify */}
        <ServiceCard
          icon={<SpotifyIcon />}
          name="Spotify"
          color="#1DB954"
          profile={spotifyProfile}
          connected={isSpotifyLoggedIn()}
          onConnect={() => { try { startSpotifyLogin(); } catch(e) { toast.error(e.message); } }}
          onDisconnect={disconnectSpotify}
          onLoadPlaylists={loadSPPlaylists}
          loading={loadingSP}
          playlists={spotifyPlaylists}
          onExpandPL={loadPlaylistTracks}
          expandedPL={expandedPL}
          plTracks={plTracks}
          loadingTracks={loadingTracks}
          onPlayTrack={playSPTrack}
          trackKeyLabel="name"
          trackKeySub="artists"
        />
      </div>

      {/* ── Setup instructions ──────────────────────────────── */}
      <SetupGuide />
    </div>
  );
}

function ServiceCard({
  icon, name, color, profile, connected,
  onConnect, onDisconnect, onLoadPlaylists, loading,
  playlists, onExpandPL, expandedPL, plTracks, loadingTracks,
  onPlayTrack, onQueuePL, trackKeyLabel, trackKeySub,
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(18,18,32,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-sm font-bold" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>{name}</p>
            {profile && (
              <p className="text-xs" style={{ color: "#8888aa" }}>
                {profile.email || profile.display_name || profile.name || "Connected"}
              </p>
            )}
          </div>
          {connected && <CheckCircle2 className="w-4 h-4 ml-1" style={{ color: color }} />}
        </div>
        <div className="flex gap-2">
          {connected && (
            <button onClick={onLoadPlaylists} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: `${color}18`, border: `1px solid ${color}44`, color }}>
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading…" : "Playlists"}
            </button>
          )}
          <button
            onClick={connected ? onDisconnect : onConnect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: connected ? "rgba(255,0,60,0.08)" : `${color}18`,
              border:     connected ? "1px solid rgba(255,0,60,0.2)" : `1px solid ${color}44`,
              color:      connected ? "#FF003C" : color,
            }}>
            {connected ? <><LogOut className="w-3 h-3" /> Disconnect</> : <><LogIn className="w-3 h-3" /> Connect</>}
          </button>
        </div>
      </div>

      {/* Playlists */}
      {playlists.length > 0 && (
        <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <p className="remix-section-title mb-3">Your Playlists ({playlists.length})</p>
          {playlists.map(pl => (
            <div key={pl.id} className="rounded-xl overflow-hidden"
              style={{ background: "rgba(12,12,22,0.8)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => onExpandPL(pl)}>
                <img src={pl.thumbnail} alt={pl.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  style={{ background: "rgba(18,18,32,0.8)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>{pl.title}</p>
                  <p className="text-xs" style={{ color: "#8888aa" }}>{pl.count} tracks</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {onQueuePL && (
                    <button onClick={e => { e.stopPropagation(); onQueuePL(pl); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={{ background: `${color}18`, border: `1px solid ${color}33`, color }}>
                      <Play className="w-3 h-3" /> Play All
                    </button>
                  )}
                  <ListMusic className="w-4 h-4 flex-shrink-0" style={{ color: expandedPL === pl.id ? color : "#44445a" }} />
                </div>
              </div>

              {/* Track list */}
              {expandedPL === pl.id && (
                <div className="border-t px-3 pb-3 pt-2 space-y-1.5 max-h-60 overflow-y-auto"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {loadingTracks === pl.id && (
                    <p className="text-xs text-center py-4" style={{ color: "#44445a" }}>Loading tracks…</p>
                  )}
                  {plTracks[pl.id]?.map((track, i) => (
                    <button key={`${track.id}-${i}`} onClick={() => onPlayTrack(track)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all hover:scale-[1.01]"
                      style={{ background: "rgba(18,18,32,0.6)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(24,24,40,0.9)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(18,18,32,0.6)"}>
                      {(track.thumbnail || track.image) && (
                        <img src={track.thumbnail || track.image} alt=""
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                          style={{ background: "rgba(18,18,32,0.8)" }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>
                          {track[trackKeyLabel] || ""}
                        </p>
                        <p className="text-[10px] truncate" style={{ color: "#8888aa" }}>{track[trackKeySub] || ""}</p>
                      </div>
                      <Play className="w-3.5 h-3.5 flex-shrink-0 opacity-0 hover:opacity-100" style={{ color }} />
                    </button>
                  ))}
                  {plTracks[pl.id]?.length === 0 && !loadingTracks && (
                    <p className="text-xs text-center py-3" style={{ color: "#44445a" }}>No tracks found</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Not connected prompt */}
      {!connected && (
        <div className="border-t px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "#44445a", fontFamily: "Rajdhani, sans-serif" }}>
            Connect your {name} account to import playlists and play them directly in Arise.
          </p>
        </div>
      )}
    </div>
  );
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function SetupGuide() {
  return (
    <div className="p-5 rounded-2xl space-y-4"
      style={{ background: "rgba(18,18,32,0.5)", border: "1px solid rgba(255,0,60,0.07)" }}>
      <p className="text-sm font-bold" style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.1em", fontSize: "0.65rem" }}>
        SETUP GUIDE
      </p>

      <div className="space-y-3 text-xs leading-relaxed" style={{ color: "#8888aa", fontFamily: "Rajdhani, sans-serif" }}>
        <div>
          <p className="font-bold mb-1" style={{ color: "#ccccee" }}>🔴 Google / YouTube</p>
          <p>1. Create a project at <a href="https://console.cloud.google.com" target="_blank" className="underline" style={{ color: "#FF003C" }}>console.cloud.google.com</a></p>
          <p>2. Enable the <strong>YouTube Data API v3</strong></p>
          <p>3. Create OAuth 2.0 credentials → Web Application</p>
          <p>4. Add redirect URI: <code className="px-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#ccccee" }}>http://localhost:3000/api/auth/google/callback</code></p>
          <p>5. Add to .env.local:</p>
          <code className="block mt-1 px-2 py-1.5 rounded text-[10px]" style={{ background: "rgba(0,0,0,0.4)", color: "#9D4EDD" }}>
            NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id{"\n"}
            GOOGLE_CLIENT_SECRET=your_secret
          </code>
        </div>

        <div>
          <p className="font-bold mb-1" style={{ color: "#ccccee" }}>🟢 Spotify</p>
          <p>1. Go to <a href="https://developer.spotify.com/dashboard" target="_blank" className="underline" style={{ color: "#1DB954" }}>developer.spotify.com/dashboard</a></p>
          <p>2. Create an app → Settings → Redirect URIs</p>
          <p>3. Add: <code className="px-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#ccccee" }}>http://localhost:3000/api/auth/spotify/callback</code></p>
          <p>4. Add to .env.local:</p>
          <code className="block mt-1 px-2 py-1.5 rounded text-[10px]" style={{ background: "rgba(0,0,0,0.4)", color: "#9D4EDD" }}>
            NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id{"\n"}
            SPOTIFY_CLIENT_SECRET=your_secret
          </code>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="px-5 py-8"><div className="remix-shimmer h-8 w-48 rounded mb-4" /></div>}>
      <ProfileInner />
    </Suspense>
  );
}
