"use client";
/**
 * YTProvider — YouTube playback engine for Arise.
 *
 * PROGRESS TRACKING (real, cross-origin):
 * - The iframe URL includes `enablejsapi=1&origin=<window.origin>`
 * - We send a `listening` postMessage every 250ms → YT responds with infoDelivery
 * - infoDelivery contains {currentTime, duration, playerState, volume}
 * - This is the only reliable way to get real-time progress cross-origin
 *
 * VIDEO/AUDIO SYNC:
 * - ONE iframe, always in DOM. Mode switch = CSS repositioning only, no reload.
 * - When switching audio→video, we seekTo the current time so video snaps in sync.
 */
import {
  createContext, useContext, useCallback, useReducer,
  useRef, useEffect, useState,
} from "react";

const initial = {
  currentVideo: null,
  queue:        [],
  history:      [],
  playing:      false,
  shuffle:      false,
  repeat:       "none",
  ytMode:       "audio",
};

function reducer(state, action) {
  switch (action.type) {
    case "PLAY": {
      const v = action.payload;
      if (!v) return state;
      const history = state.currentVideo
        ? [state.currentVideo, ...state.history.filter(h => h.id !== state.currentVideo.id)].slice(0, 50)
        : state.history;
      try {
        const rec = JSON.parse(localStorage.getItem("arise:yt:recent") || "[]");
        localStorage.setItem("arise:yt:recent", JSON.stringify(
          [{ id: v.id, title: v.title, thumbnail: v.thumbnail, channelTitle: v.channelTitle, ts: Date.now() },
            ...rec.filter(r => r.id !== v.id)].slice(0, 50)
        ));
        localStorage.setItem("arise:yt:last", v.id);
      } catch {}
      return { ...state, currentVideo: v, playing: true, history };
    }
    case "SET_PLAYING":       return { ...state, playing: action.payload };
    case "SET_QUEUE":         return { ...state, queue: action.payload };
    case "SET_YT_MODE":       return { ...state, ytMode: action.payload };
    case "ADD_TO_QUEUE": {
      const item = action.payload;
      if (state.queue.find(v => v.id === item.id)) return state;
      return { ...state, queue: [...state.queue, item] };
    }
    case "REMOVE_FROM_QUEUE": return { ...state, queue: state.queue.filter((_, i) => i !== action.payload) };
    case "NEXT": {
      if (state.queue.length === 0) return state;
      const pick = state.shuffle
        ? state.queue[Math.floor(Math.random() * state.queue.length)]
        : state.queue[0];
      return {
        ...state, currentVideo: pick,
        queue:   state.queue.filter(v => v.id !== pick.id),
        history: state.currentVideo ? [state.currentVideo, ...state.history].slice(0, 50) : state.history,
        playing: true,
      };
    }
    case "PREV": {
      if (state.history.length === 0) return state;
      const [p, ...rest] = state.history;
      return {
        ...state, currentVideo: p, history: rest,
        queue: state.currentVideo ? [state.currentVideo, ...state.queue] : state.queue,
        playing: true,
      };
    }
    case "TOGGLE_SHUFFLE": return { ...state, shuffle: !state.shuffle };
    case "SET_REPEAT":     return { ...state, repeat: action.payload };
    case "STOP":           return { ...state, currentVideo: null, playing: false };
    default:               return state;
  }
}

export const YTContext = createContext(null);
export const useYT = () => useContext(YTContext);

export function YTProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const iframeRef         = useRef(null);
  const containerRef      = useRef(null);
  const [videoId,   setVideoId]   = useState(null);
  const [ytVolume,  setYtVolume]  = useState(1);
  const [ytMuted,   setYtMuted]   = useState(false);
  const [ytCurrentTime, setYtCurrentTime] = useState(0);
  const [ytDuration,    setYtDuration]    = useState(0);
  const [ytProgress,    setYtProgress]    = useState(0);

  // Refs for values needed inside setInterval without stale closures
  const playingRef     = useRef(false);
  const currentTimeRef = useRef(0);
  const durationRef    = useRef(0);
  const pollRef        = useRef(null);
  const listeningRef   = useRef(null);

  useEffect(() => { playingRef.current = state.playing; }, [state.playing]);

  // ── postMessage helper ────────────────────────────────────────────────
  const ytCmd = useCallback((cmd, args = []) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: cmd, args }), "*"
      );
    } catch {}
  }, []);

  // ── Send "listening" every 250ms to trigger infoDelivery ─────────────
  // This is the official way to get real-time currentTime from YT iframe API
  useEffect(() => {
    if (listeningRef.current) clearInterval(listeningRef.current);
    if (!state.currentVideo) return;

    listeningRef.current = setInterval(() => {
      try {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "listening", id: 1 }), "*"
        );
      } catch {}
    }, 250);

    return () => clearInterval(listeningRef.current);
  }, [state.currentVideo?.id]);

  // ── Handle all messages from YT iframe ───────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!data) return;

        // State changes: 1=playing, 2=paused, 0=ended, 3=buffering, 5=cued
        if (data.event === "onStateChange") {
          const info = data.info;
          if (info === 1)  dispatch({ type: "SET_PLAYING", payload: true  });
          if (info === 2)  dispatch({ type: "SET_PLAYING", payload: false });
          if (info === 0) {
            dispatch({ type: "SET_PLAYING", payload: false });
            dispatch({ type: "NEXT" });
          }
        }

        // Ready: set volume and autoplay
        if (data.event === "onReady") {
          ytCmd("setVolume", [Math.round(ytVolume * 100)]);
          ytCmd("playVideo");
        }

        // infoDelivery: real currentTime + duration every 250ms
        if (data.event === "infoDelivery" && data.info) {
          const { currentTime: ct, duration: dur, volume: vol, muted } = data.info;

          if (typeof ct === "number" && ct >= 0) {
            currentTimeRef.current = ct;
            setYtCurrentTime(ct);
            if (durationRef.current > 0) {
              setYtProgress(Math.min(100, (ct / durationRef.current) * 100));
            }
          }

          if (typeof dur === "number" && dur > 0) {
            durationRef.current = dur;
            setYtDuration(dur);
            if (currentTimeRef.current > 0) {
              setYtProgress(Math.min(100, (currentTimeRef.current / dur) * 100));
            }
          }

          // Sync volume from iframe if changed externally
          if (typeof vol === "number") {
            const v = vol / 100;
            setYtVolume(prev => Math.abs(prev - v) > 0.05 ? v : prev);
          }

          // Auto-advance 3 seconds before end (buffer for slow connections)
          if (dur && dur > 10 && ct && dur - ct < 3 && playingRef.current) {
            dispatch({ type: "SET_PLAYING", payload: false });
            dispatch({ type: "NEXT" });
          }
        }
      } catch {}
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [ytCmd, ytVolume]);

  // Reset progress when video changes
  useEffect(() => {
    currentTimeRef.current = 0;
    durationRef.current    = 0;
    setYtCurrentTime(0);
    setYtDuration(0);
    setYtProgress(0);
  }, [state.currentVideo?.id]);

  // ── Seek ──────────────────────────────────────────────────────────────
  const ytSeek = useCallback((seconds) => {
    const clampedSecs = Math.max(0, Math.min(seconds, durationRef.current || seconds));
    ytCmd("seekTo", [clampedSecs, true]);
    currentTimeRef.current = clampedSecs;
    setYtCurrentTime(clampedSecs);
    if (durationRef.current > 0) {
      setYtProgress(Math.min(100, (clampedSecs / durationRef.current) * 100));
    }
  }, [ytCmd]);

  // ── Volume ────────────────────────────────────────────────────────────
  const changeYtVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    setYtVolume(clamped);
    setYtMuted(clamped === 0);
    ytCmd("setVolume", [Math.round(clamped * 100)]);
    if (clamped === 0) ytCmd("mute"); else ytCmd("unMute");
  }, [ytCmd]);

  const toggleYtMute = useCallback(() => {
    const next = !ytMuted;
    setYtMuted(next);
    if (next) ytCmd("mute"); else ytCmd("unMute");
  }, [ytMuted, ytCmd]);

  // ── Mode switch (audio ↔ video) with seek-to-sync ────────────────────
  const setYtMode = useCallback((m) => {
    dispatch({ type: "SET_YT_MODE", payload: m });
    if (m === "audio") {
      hideIframeContainer();
    }
    // When switching to video, we DON'T seek — the audio is already at the right position
    // The iframe is the same element, so video resumes exactly where audio was
  }, []);

  // ── Mutual exclusion ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      ytCmd("pauseVideo");
      dispatch({ type: "SET_PLAYING", payload: false });
    };
    window.addEventListener("arise:saavn:playing", handler);
    return () => window.removeEventListener("arise:saavn:playing", handler);
  }, [ytCmd]);

  useEffect(() => {
    if (state.playing && state.currentVideo) {
      window.dispatchEvent(new CustomEvent("arise:yt:playing"));
    }
  }, [state.playing, state.currentVideo]);

  // When video changes → update iframe src + auto-fetch related for queue
  useEffect(() => {
    setVideoId(state.currentVideo ? state.currentVideo.id : null);
    // When a new song starts, auto-populate queue with related if empty
    if (state.currentVideo?.id && state.queue.length === 0) {
      import("@/lib/muzo").then(({ muzoRelated }) => {
        muzoRelated(state.currentVideo.id).then(items => {
          if (!items?.length) return;
          const q = items.filter(i => i.videoId || i.id).slice(0, 10).map(i => ({
            id:           i.videoId || i.id,
            title:        i.title   || i.name,
            channelTitle: i.artist  || i.channelTitle || "",
            thumbnail:    i.thumbnail || `https://i.ytimg.com/vi/${i.videoId || i.id}/hqdefault.jpg`,
          }));
          if (q.length > 0) dispatch({ type: "SET_QUEUE", payload: q });
        }).catch(() => {});
      }).catch(() => {});
    }
  }, [state.currentVideo?.id]);

  // Page Visibility API — resume playback when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && state.playing && state.currentVideo) {
        // Small delay to let browser settle, then ensure playing
        setTimeout(() => {
          ytCmd("playVideo");
        }, 200);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.playing, state.currentVideo, ytCmd]);

  // ── Public API ────────────────────────────────────────────────────────
  const playVideo       = useCallback((v) => dispatch({ type: "PLAY", payload: v }), []);
  const ytPlay          = useCallback(() => { ytCmd("playVideo");  dispatch({ type: "SET_PLAYING", payload: true  }); }, [ytCmd]);
  const ytPause         = useCallback(() => { ytCmd("pauseVideo"); dispatch({ type: "SET_PLAYING", payload: false }); }, [ytCmd]);
  const togglePlay      = useCallback(() => { if (state.playing) ytPause(); else ytPlay(); }, [state.playing, ytPlay, ytPause]);
  const next            = useCallback(() => dispatch({ type: "NEXT" }), []);
  const prev            = useCallback(() => dispatch({ type: "PREV" }), []);
  const addToQueue      = useCallback((v) => dispatch({ type: "ADD_TO_QUEUE", payload: v }), []);
  const setQueue        = useCallback((fn) => dispatch({ type: "SET_QUEUE", payload: typeof fn === "function" ? fn(state.queue) : fn }), [state.queue]);
  const removeFromQueue = useCallback((i) => dispatch({ type: "REMOVE_FROM_QUEUE", payload: i }), []);
  const toggleShuffle   = useCallback(() => dispatch({ type: "TOGGLE_SHUFFLE" }), []);
  const stop            = useCallback(() => {
    ytCmd("pauseVideo");
    dispatch({ type: "STOP" });
    setVideoId(null);
    hideIframeContainer();
  }, [ytCmd]);
  const setRepeat = useCallback((r) => dispatch({ type: "SET_REPEAT", payload: r }), []);

  const getLiked   = useCallback(() => { try { return JSON.parse(localStorage.getItem("arise:yt:likes") || "[]"); } catch { return []; } }, []);
  const toggleLike = useCallback((video) => {
    try {
      const likes = JSON.parse(localStorage.getItem("arise:yt:likes") || "[]");
      localStorage.setItem("arise:yt:likes", JSON.stringify(
        likes.find(v => v.id === video.id) ? likes.filter(v => v.id !== video.id) : [video, ...likes]
      ));
    } catch {}
  }, []);
  const isLiked   = useCallback((id) => { try { return JSON.parse(localStorage.getItem("arise:yt:likes") || "[]").some(v => v.id === id); } catch { return false; } }, []);
  const getRecent = useCallback(() => { try { return JSON.parse(localStorage.getItem("arise:yt:recent") || "[]"); } catch { return []; } }, []);

  const ytFormatTime = useCallback((s) => {
    if (!s || isNaN(s)) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${m}:${String(sec).padStart(2,"0")}`;
  }, []);

  return (
    <YTContext.Provider value={{
      ...state, iframeRef, containerRef,
      ytVolume, ytMuted, changeYtVolume, toggleYtMute,
      ytCurrentTime, ytDuration, ytProgress, ytSeek, ytFormatTime,
      playVideo, togglePlay, ytPlay, ytPause,
      next, prev, addToQueue, setQueue, removeFromQueue,
      toggleShuffle, stop, setRepeat, setYtMode,
      getLiked, toggleLike, isLiked, getRecent,
    }}>
      {/*
        SINGLE FIXED IFRAME — never unmounts, never moves.
        audio mode: 1×1px invisible — audio keeps playing.
        video mode: positioned over the modal slot via showIframeOverElement().
        The SAME iframe element handles both — no reload, perfect A/V sync.
      */}
      <div
        ref={containerRef}
        id="arise-yt-container"
        style={{
          position:      "fixed",
          top:           0,
          left:          0,
          width:         "1px",
          height:        "1px",
          opacity:       0,
          pointerEvents: "none",
          zIndex:        -1,
          overflow:      "hidden",
          background:    "#000",
          borderRadius:  "0",
          transition:    "opacity 0.15s",
        }}
      >
        {videoId && (
          <iframe
            ref={iframeRef}
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1&fs=1&iv_load_policy=3&disablekb=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
            title="Arise YT Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; background-sync"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        )}
      </div>
      {children}
    </YTContext.Provider>
  );
}

// ── Module-level helpers ──────────────────────────────────────────────────────

export function showIframeOverElement(el) {
  const c = document.getElementById("arise-yt-container");
  if (!c || !el) return;
  requestAnimationFrame(() => {
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    Object.assign(c.style, {
      top:           `${r.top}px`,
      left:          `${r.left}px`,
      width:         `${r.width}px`,
      height:        `${r.height}px`,
      opacity:       "1",
      pointerEvents: "auto",
      zIndex:        "65",
      borderRadius:  "12px",
      overflow:      "hidden",
      transition:    "none",
    });
  });
}

export function hideIframeContainer() {
  const c = document.getElementById("arise-yt-container");
  if (!c) return;
  Object.assign(c.style, {
    top:           "0",
    left:          "0",
    width:         "1px",
    height:        "1px",
    opacity:       "0",
    pointerEvents: "none",
    zIndex:        "-1",
    borderRadius:  "0",
  });
}
