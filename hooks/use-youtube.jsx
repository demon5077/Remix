"use client";
/**
 * YTProvider — YouTube playback engine for Arise.
 *
 * KEY DESIGN:
 * - ONE iframe, NEVER re-keyed. Once loaded with the first video, all subsequent
 *   track changes use `loadVideoById` via postMessage — no iframe reload.
 *   This is critical for background-tab autoplay: browsers block `autoplay=1`
 *   on new iframes in hidden tabs, but `loadVideoById` on an already-playing
 *   iframe is treated as a continuation and plays without user gesture.
 *
 * PROGRESS TRACKING:
 * - Send `{ event: "listening" }` every 250ms → YT replies with infoDelivery
 *   containing { currentTime, duration } — the only reliable cross-origin approach.
 *
 * A/V SYNC:
 * - Mode switch (audio↔video) = CSS repositioning only, never an iframe reload.
 */
import {
  createContext, useContext, useCallback, useReducer,
  useRef, useEffect, useState,
} from "react";

// ── State machine ─────────────────────────────────────────────────────────────
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

  // iframeReady: true once the first onReady fires — after this we use loadVideoById
  const iframeReadyRef    = useRef(false);
  // Track the last videoId we asked the iframe to load, to avoid duplicate loads
  const loadedIdRef       = useRef(null);

  const [ytVolume,      setYtVolume]      = useState(1);
  const [ytMuted,       setYtMuted]       = useState(false);
  const [ytCurrentTime, setYtCurrentTime] = useState(0);
  const [ytDuration,    setYtDuration]    = useState(0);
  const [ytProgress,    setYtProgress]    = useState(0);

  const playingRef     = useRef(false);
  const currentTimeRef = useRef(0);
  const durationRef    = useRef(0);
  const listeningRef   = useRef(null);
  const autoQueueRef   = useRef(false); // guard to avoid double-fetch

  useEffect(() => { playingRef.current = state.playing; }, [state.playing]);

  // ── postMessage helper ────────────────────────────────────────────────
  const ytCmd = useCallback((cmd, args = []) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: cmd, args }), "*"
      );
    } catch {}
  }, []);

  // ── Load a video into the iframe ──────────────────────────────────────
  // Uses loadVideoById (no iframe reload) so background-tab autoplay works.
  const loadInIframe = useCallback((videoId) => {
    if (!videoId || loadedIdRef.current === videoId) return;
    loadedIdRef.current = videoId;

    if (iframeReadyRef.current) {
      // Iframe already initialised — use loadVideoById (no reload, plays in background)
      ytCmd("loadVideoById", [{ videoId, startSeconds: 0 }]);
    }
    // If iframe not ready yet, the onReady handler will call playVideoById
  }, [ytCmd]);

  // ── Send "listening" every 250ms to get infoDelivery ─────────────────
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

  // ── Message handler ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!data) return;

        if (data.event === "onStateChange") {
          const info = data.info;
          // 1=playing 2=paused 0=ended 3=buffering 5=cued
          if (info === 1) dispatch({ type: "SET_PLAYING", payload: true  });
          if (info === 2) dispatch({ type: "SET_PLAYING", payload: false });
          if (info === 0) {
            // Song ended — advance queue
            dispatch({ type: "SET_PLAYING", payload: false });
            dispatch({ type: "NEXT" });
          }
        }

        if (data.event === "onReady") {
          iframeReadyRef.current = true;
          ytCmd("setVolume", [Math.round(ytVolume * 100)]);
          // If a video is already queued, load it now
          if (state.currentVideo?.id) {
            loadedIdRef.current = null; // reset so loadInIframe proceeds
            loadInIframe(state.currentVideo.id);
          }
        }

        if (data.event === "infoDelivery" && data.info) {
          const { currentTime: ct, duration: dur } = data.info;

          if (typeof ct === "number" && ct >= 0) {
            currentTimeRef.current = ct;
            setYtCurrentTime(ct);
            if (durationRef.current > 0)
              setYtProgress(Math.min(100, (ct / durationRef.current) * 100));
          }

          if (typeof dur === "number" && dur > 0) {
            durationRef.current = dur;
            setYtDuration(dur);
            if (currentTimeRef.current > 0)
              setYtProgress(Math.min(100, (currentTimeRef.current / dur) * 100));
          }

          // Auto-advance 3 s before end as a safety net (in case onStateChange fires late)
          if (dur && dur > 10 && ct && dur - ct < 3 && playingRef.current) {
            dispatch({ type: "SET_PLAYING", payload: false });
            dispatch({ type: "NEXT" });
          }
        }
      } catch {}
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [ytCmd, ytVolume, state.currentVideo?.id, loadInIframe]);

  // ── When currentVideo changes → load into existing iframe ────────────
  useEffect(() => {
    if (!state.currentVideo?.id) return;

    // Reset progress
    currentTimeRef.current = 0;
    durationRef.current    = 0;
    setYtCurrentTime(0);
    setYtDuration(0);
    setYtProgress(0);

    // Load track (no iframe reload — works in background tabs)
    loadInIframe(state.currentVideo.id);

    // Auto-populate queue with related tracks when queue is empty
    autoQueueRef.current = false;
    setTimeout(() => {
      if (autoQueueRef.current) return;
      autoQueueRef.current = true;
      if (state.queue.length === 0) {
        import("@/lib/muzo").then(({ muzoRelated }) => {
          muzoRelated(state.currentVideo.id).then(items => {
            if (!items?.length) return;
            const q = items
              .filter(i => i.videoId || i.id)
              .slice(0, 10)
              .map(i => ({
                id:           i.videoId || i.id,
                title:        i.title   || i.name,
                channelTitle: i.artist  || i.channelTitle || "",
                thumbnail:    i.thumbnail || `https://i.ytimg.com/vi/${i.videoId || i.id}/hqdefault.jpg`,
              }));
            if (q.length > 0) dispatch({ type: "SET_QUEUE", payload: q });
          }).catch(() => {});
        }).catch(() => {});
      }
    }, 500);

    // Add to unified recent list
    try {
      const v   = state.currentVideo;
      const key = "arise:recent";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const item = {
        id: v.id, ytId: v.id, name: v.title, title: v.title,
        artist: v.channelTitle, thumbnail: v.thumbnail, source: "youtube", ts: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(
        [item, ...existing.filter(r => r.id !== v.id)].slice(0, 50)
      ));
    } catch {}

    window.dispatchEvent(new CustomEvent("arise:yt:playing"));
  }, [state.currentVideo?.id]);

  // ── Page Visibility: force playback when tab returns to foreground ────
  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === "visible" && state.playing && state.currentVideo) {
        setTimeout(() => ytCmd("playVideo"), 300);
      }
    };
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [state.playing, state.currentVideo, ytCmd]);

  // ── Mutual exclusion with Saavn ───────────────────────────────────────
  useEffect(() => {
    const h = () => { ytCmd("pauseVideo"); dispatch({ type: "SET_PLAYING", payload: false }); };
    window.addEventListener("arise:saavn:playing", h);
    return () => window.removeEventListener("arise:saavn:playing", h);
  }, [ytCmd]);

  // ── Public API ────────────────────────────────────────────────────────
  const ytSeek = useCallback((s) => {
    const c = Math.max(0, Math.min(s, durationRef.current || s));
    ytCmd("seekTo", [c, true]);
    currentTimeRef.current = c;
    setYtCurrentTime(c);
    if (durationRef.current > 0) setYtProgress(Math.min(100, (c / durationRef.current) * 100));
  }, [ytCmd]);

  const changeYtVolume = useCallback((v) => {
    const c = Math.max(0, Math.min(1, v));
    setYtVolume(c); setYtMuted(c === 0);
    ytCmd("setVolume", [Math.round(c * 100)]);
    if (c === 0) ytCmd("mute"); else ytCmd("unMute");
  }, [ytCmd]);

  const toggleYtMute = useCallback(() => {
    const next = !ytMuted;
    setYtMuted(next);
    if (next) ytCmd("mute"); else ytCmd("unMute");
  }, [ytMuted, ytCmd]);

  const setYtMode = useCallback((m) => {
    dispatch({ type: "SET_YT_MODE", payload: m });
    if (m === "audio") hideIframeContainer();
  }, []);

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
    iframeReadyRef.current = false;
    loadedIdRef.current    = null;
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
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
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
        SINGLE FIXED IFRAME — keyed only once (no `key` prop).
        All track changes use loadVideoById via postMessage.
        This is essential for background-tab autoplay:
        browsers block autoplay on NEW iframes in hidden tabs,
        but loadVideoById on an existing playing iframe is allowed.
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
          transition:    "opacity 0.15s",
        }}
      >
        {/* No `key` prop — this iframe NEVER remounts after initial load */}
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/?enablejsapi=1&autoplay=0&rel=0&modestbranding=1&playsinline=1&fs=1&iv_load_policy=3&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
          title="Arise YT Player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      </div>
      {children}
    </YTContext.Provider>
  );
}

// ── Container position helpers ────────────────────────────────────────────────
export function showIframeOverElement(el) {
  const c = document.getElementById("arise-yt-container");
  if (!c || !el) return;
  requestAnimationFrame(() => {
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    Object.assign(c.style, {
      top: `${r.top}px`, left: `${r.left}px`,
      width: `${r.width}px`, height: `${r.height}px`,
      opacity: "1", pointerEvents: "auto",
      zIndex: "65", borderRadius: "12px",
      overflow: "hidden", transition: "none",
    });
  });
}

export function hideIframeContainer() {
  const c = document.getElementById("arise-yt-container");
  if (!c) return;
  Object.assign(c.style, {
    top: "0", left: "0", width: "1px", height: "1px",
    opacity: "0", pointerEvents: "none", zIndex: "-1", borderRadius: "0",
  });
}
