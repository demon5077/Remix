"use client";
/**
 * MusicProvider — THE single audio element for the entire app.
 * 
 * Architecture:
 * - ONE <audio> ref lives here, never re-created on navigation
 * - All components read state from context; none own their own audio
 * - playSong(id) is the single entry point for playing anything
 * - Playing continues uninterrupted across all page navigations
 */
import { MusicContext } from "@/hooks/use-context";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSongsById } from "@/lib/fetch";

export default function MusicProvider({ children }) {
  const audioRef = useRef(null);

  // ── Song identity ──────────────────────────────────────
  const [musicId,   setMusicId]   = useState(null);
  const [songData,  setSongData]  = useState(null);
  const [audioURL,  setAudioURL]  = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ── Playback state (mirrors audio element) ─────────────
  const [playing,     setPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [volume,      setVolume]      = useState(1);
  const [muted,       setMuted]       = useState(false);
  const [isLooping,   setIsLooping]   = useState(false);

  // ── Queue & library ────────────────────────────────────
  const [queue, setQueue] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);

  // ── UI state ───────────────────────────────────────────
  const [playerOpen, setPlayerOpen] = useState(false); // full-screen modal

  // ── Helpers ────────────────────────────────────────────
  const formatTime = (t) => {
    if (!t || isNaN(t)) return "00:00";
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ── Load song data from API ────────────────────────────
  const loadSong = useCallback(async (id) => {
    if (!id) return;
    setIsLoading(true);
    setSongData(null);
    try {
      const res  = await getSongsById(id);
      const json = await res.json();
      const song = json?.data?.[0];
      if (!song) { setIsLoading(false); return; }
      setSongData(song);
      const url =
        song?.downloadUrl?.[3]?.url ||
        song?.downloadUrl?.[2]?.url ||
        song?.downloadUrl?.[1]?.url ||
        song?.downloadUrl?.[0]?.url || "";
      setAudioURL(url);
    } catch (e) {
      console.error("loadSong failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── playSong — THE public API for playing anything ─────
  const playSong = useCallback((id) => {
    if (!id) return;

    // Same song → toggle play/pause
    if (id === musicId) {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) { audio.play(); setPlaying(true); }
      else              { audio.pause(); setPlaying(false); }
      return;
    }

    setMusicId(id);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(true); // will autoplay once URL is set

    // Persist
    try {
      localStorage.setItem("remix:last", id);
      setRecentlyPlayed(prev => {
        const next = [{ id, ts: Date.now() }, ...prev.filter(r => r.id !== id)].slice(0, 50);
        localStorage.setItem("remix:recent", JSON.stringify(next));
        return next;
      });
    } catch {}
  }, [musicId]);

  // ── stopPlayback ───────────────────────────────────────
  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    setMusicId(null); setSongData(null); setAudioURL("");
    setPlaying(false); setCurrentTime(0); setDuration(0);
    try { localStorage.removeItem("remix:last"); } catch {}
  }, []);

  // ── togglePlay ─────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioURL) return;
    if (audio.paused) { audio.play(); setPlaying(true); }
    else              { audio.pause(); setPlaying(false); }
  }, [audioURL]);

  // ── seek ───────────────────────────────────────────────
  const seek = useCallback((seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || 0));
    setCurrentTime(audio.currentTime);
  }, []);

  // ── volume ─────────────────────────────────────────────
  const changeVolume = useCallback((v) => {
    const audio = audioRef.current;
    if (!audio) return;
    const c = Math.max(0, Math.min(1, v));
    audio.volume = c;
    setVolume(c);
    setMuted(c === 0);
    audio.muted = c === 0;
    try { localStorage.setItem("remix:volume", String(c)); } catch {}
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    audio.muted = next;
    setMuted(next);
  }, [muted]);

  // ── loop ───────────────────────────────────────────────
  const toggleLoop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = !audio.loop;
    setIsLooping(audio.loop);
  }, []);

  // ── When musicId changes → fetch audio data ────────────
  useEffect(() => {
    if (musicId) loadSong(musicId);
  }, [musicId]);

  // ── When audioURL changes → set src and play ──────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioURL) return;
    audio.src = audioURL;
    audio.load();
    // Always autoplay when a new song URL arrives
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  }, [audioURL]);

  // ── Audio element event listeners (mounted once) ───────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay       = () => setPlaying(true);
    const onPause      = () => setPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) setDuration(audio.duration);
    };
    const onLoaded     = () => {
      if (!isNaN(audio.duration)) setDuration(audio.duration);
    };
    const onEnded      = () => {
      if (audio.loop) return;
      if (queue.length > 0) {
        const [next, ...rest] = queue;
        setQueue(rest);
        playSong(next);
      } else {
        setPlaying(false);
      }
    };

    audio.addEventListener("play",        onPlay);
    audio.addEventListener("pause",       onPause);
    audio.addEventListener("timeupdate",  onTimeUpdate);
    audio.addEventListener("loadeddata",  onLoaded);
    audio.addEventListener("ended",       onEnded);

    return () => {
      audio.removeEventListener("play",        onPlay);
      audio.removeEventListener("pause",       onPause);
      audio.removeEventListener("timeupdate",  onTimeUpdate);
      audio.removeEventListener("loadeddata",  onLoaded);
      audio.removeEventListener("ended",       onEnded);
    };
  }, [queue, playSong]);

  // ── Restore last played + volume on mount ──────────────
  useEffect(() => {
    try {
      const last   = localStorage.getItem("remix:last");
      const vol    = parseFloat(localStorage.getItem("remix:volume") || "1");
      const recent = JSON.parse(localStorage.getItem("remix:recent") || "[]");
      if (audioRef.current) {
        audioRef.current.volume = vol;
        setVolume(vol);
      }
      setRecentlyPlayed(recent);
      if (last) {
        setMusicId(last);
        // Don't autoplay on restore — just load metadata
        loadSong(last).then(() => {
          setPlaying(false); // loaded but paused on restore
        });
      }
    } catch {}
  }, []);


  // ── Mutual exclusion: pause when YouTube starts playing ────────
  useEffect(() => {
    const handler = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        audio.pause();
        setPlaying(false);
      }
    };
    window.addEventListener("remix:yt:playing", handler);
    return () => window.removeEventListener("remix:yt:playing", handler);
  }, []);

  // ── Global keyboard shortcuts ──────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      if (e.code === "Space")                    { e.preventDefault(); togglePlay(); }
      if (e.code === "KeyM")                     { toggleMute(); }
      if (e.code === "KeyL")                     { toggleLoop(); }
      if (e.code === "ArrowRight" && e.shiftKey) { seek(currentTime + 10); }
      if (e.code === "ArrowLeft"  && e.shiftKey) { seek(Math.max(0, currentTime - 10)); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, toggleMute, toggleLoop, seek, currentTime]);

  return (
    <MusicContext.Provider value={{
      // Identity
      music: musicId, setMusic: playSong,
      songData, audioURL, isLoading,
      // Controls
      playing, togglePlay, playSong,
      seek, seekTo: seek,
      toggleLoop, isLooping,
      toggleMute, muted,
      volume, changeVolume,
      stopPlayback,
      // State
      currentTime, duration, progress, formatTime,
      // Queue & history
      queue, setQueue,
      recentlyPlayed,
      // UI
      playerOpen, setPlayerOpen,
      // Legacy compat shims
      current: currentTime,
      setCurrent: setCurrentTime,
      downloadProgress: 0, setDownloadProgress: () => {},
    }}>
      {/* THE single <audio> element for the whole app — never unmounts */}
      <audio ref={audioRef} preload="auto" />
      {children}
    </MusicContext.Provider>
  );
}
