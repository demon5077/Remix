"use client";
/**
 * MusicProvider — Unified audio engine.
 *
 * PRIMARY:  YouTube player (via YTContext)
 * FALLBACK: Saavn <audio> element (hidden, only used when YT search fails)
 *
 * When playSong(saavnId) is called:
 *   1. Fetch Saavn metadata to get title + artist
 *   2. Search YouTube Music via Muzo API for that song
 *   3. If found → play in YT player (yt.playVideo)
 *   4. If not found → fall back to Saavn <audio> stream
 *
 * Everything unified into ONE recently-played list (arise:recent)
 */
import { MusicContext } from "@/hooks/use-context";
import { useCallback, useEffect, useRef, useState, useContext } from "react";
import { YTContext } from "@/hooks/use-youtube";
import { getSongsById } from "@/lib/fetch";
import { muzoSearch } from "@/lib/muzo";

const RECENT_KEY = "arise:recent"; // unified recent list

function addToUnifiedRecent(item) {
  try {
    const existing = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    const deduped  = existing.filter(r => !(r.saavnId === item.saavnId && r.ytId === item.ytId));
    localStorage.setItem(RECENT_KEY, JSON.stringify([item, ...deduped].slice(0, 50)));
  } catch {}
}

export function getUnifiedRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
  catch { return []; }
}

export default function MusicProvider({ children }) {
  const yt       = useContext(YTContext); // access YT context to route playback
  const audioRef = useRef(null);

  const [musicId,   setMusicId]   = useState(null);
  const [songData,  setSongData]  = useState(null);
  const [audioURL,  setAudioURL]  = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFallback,setIsFallback]= useState(false); // true when using Saavn audio

  const [playing,     setPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [volume,      setVolume]      = useState(1);
  const [muted,       setMuted]       = useState(false);
  const [isLooping,   setIsLooping]   = useState(false);
  const [queue,       setQueue]       = useState([]);

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "00:00";
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ── Load Saavn metadata ──────────────────────────────────────────────
  const loadSaavnMeta = useCallback(async (id) => {
    try {
      const res  = await getSongsById(id);
      const json = await res.json();
      return json?.data?.[0] || null;
    } catch { return null; }
  }, []);

  // ── Main entry: playSong(saavnId) ────────────────────────────────────
  const playSong = useCallback(async (id) => {
    if (!id) return;
    setIsLoading(true);
    setMusicId(id);

    // 1. Fetch Saavn metadata
    const song = await loadSaavnMeta(id);
    if (!song) { setIsLoading(false); return; }
    setSongData(song);

    const title  = song.name || "";
    const artist = song.artists?.primary?.[0]?.name || song.artists?.all?.[0]?.name || "";
    const thumb  = song.image?.[1]?.url || song.image?.[0]?.url || "";

    // 2. Try YouTube Music via Muzo
    try {
      const query   = `${title} ${artist}`.trim();
      const results = await muzoSearch(query, "songs", 3);
      const best    = results?.[0];
      const ytId    = best?.videoId || best?.id;

      if (ytId && yt?.playVideo) {
        yt.playVideo({
          id:           ytId,
          title:        best.title || title,
          channelTitle: (best.artists || []).map(a => a.name || a).join(", ") || artist,
          thumbnail:    best.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`,
          saavnId:      id, // carry original ID for metadata
        });
        setIsFallback(false);
        // Add to unified recent
        addToUnifiedRecent({
          id:       ytId,
          ytId,
          saavnId:  id,
          name:     title,
          title:    title,
          artist,
          thumbnail: thumb || `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`,
          source:   "saavn_yt",
          ts:       Date.now(),
        });
        setIsLoading(false);
        window.dispatchEvent(new CustomEvent("arise:saavn:playing")); // pause any other audio
        return;
      }
    } catch {}

    // 3. Fallback: Saavn audio stream
    const url =
      song?.downloadUrl?.[3]?.url ||
      song?.downloadUrl?.[2]?.url ||
      song?.downloadUrl?.[1]?.url ||
      song?.downloadUrl?.[0]?.url || "";

    setAudioURL(url);
    setIsFallback(true);

    addToUnifiedRecent({
      id:       id,
      saavnId:  id,
      name:     title,
      title:    title,
      artist,
      thumbnail: thumb,
      source:   "saavn",
      ts:       Date.now(),
    });

    setIsLoading(false);
    window.dispatchEvent(new CustomEvent("arise:saavn:playing"));
  }, [loadSaavnMeta, yt]);

  // ── Audio element: only used for Saavn fallback ──────────────────────
  useEffect(() => {
    if (!isFallback || !audioURL || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src    = audioURL;
    audio.volume = volume;
    audio.loop   = isLooping;
    audio.play().catch(() => {});
  }, [audioURL, isFallback]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay    = () => setPlaying(true);
    const onPause   = () => setPlaying(false);
    const onTime    = () => { setCurrentTime(audio.currentTime); if (!isNaN(audio.duration)) setDuration(audio.duration); };
    const onLoaded  = () => { if (!isNaN(audio.duration)) setDuration(audio.duration); };
    const onEnded   = () => {
      if (audio.loop) return;
      if (queue.length > 0) {
        const [next, ...rest] = queue;
        setQueue(rest);
        playSong(typeof next === "string" ? next : next?.id);
      } else setPlaying(false);
    };
    audio.addEventListener("play",       onPlay);
    audio.addEventListener("pause",      onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadeddata", onLoaded);
    audio.addEventListener("ended",      onEnded);
    return () => {
      audio.removeEventListener("play",       onPlay);
      audio.removeEventListener("pause",      onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadeddata", onLoaded);
      audio.removeEventListener("ended",      onEnded);
    };
  }, [queue, playSong, isLooping]);

  // Pause Saavn when YT plays
  useEffect(() => {
    const handler = () => {
      if (isFallback && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setPlaying(false);
      }
    };
    window.addEventListener("arise:yt:playing", handler);
    return () => window.removeEventListener("arise:yt:playing", handler);
  }, [isFallback]);

  const togglePlay   = useCallback(() => {
    if (!isFallback) return; // YT handles its own toggle
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  }, [isFallback]);

  const seek = useCallback((t) => {
    if (!isFallback || !audioRef.current) return;
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  }, [isFallback]);

  const changeVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
    try { localStorage.setItem("remix:volume", String(clamped)); } catch {}
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  }, [muted]);

  const toggleLoop = useCallback(() => {
    const next = !isLooping;
    setIsLooping(next);
    if (audioRef.current) audioRef.current.loop = next;
  }, [isLooping]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    setPlaying(false); setMusicId(null); setSongData(null); setIsFallback(false);
  }, []);

  // Restore volume on mount
  useEffect(() => {
    try {
      const vol = parseFloat(localStorage.getItem("remix:volume") || "1");
      if (audioRef.current) audioRef.current.volume = vol;
      setVolume(vol);
    } catch {}
  }, []);

  return (
    <MusicContext.Provider value={{
      music: musicId, setMusic: playSong,
      songData, audioURL, isLoading, isFallback,
      playing: isFallback ? playing : false, // only expose playing for fallback
      togglePlay, playSong,
      seek, seekTo: seek,
      toggleLoop, isLooping,
      toggleMute, muted,
      volume, changeVolume,
      stopPlayback,
      currentTime: isFallback ? currentTime : 0,
      duration:    isFallback ? duration    : 0,
      progress:    isFallback ? progress    : 0,
      formatTime,
      queue, setQueue,
      recentlyPlayed: [], // use getUnifiedRecent() directly
      playerOpen: false, setPlayerOpen: () => {},
      current: currentTime, setCurrent: setCurrentTime,
      downloadProgress: 0, setDownloadProgress: () => {},
    }}>
      <audio ref={audioRef} preload="auto" style={{ display: "none" }} />
      {children}
    </MusicContext.Provider>
  );
}
