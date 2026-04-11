"use client";
/**
 * YTProvider — manages YouTube playback.
 *
 * KEY ARCHITECTURE:
 * - The <iframe> lives in a FIXED div that is ALWAYS in the DOM (never moved, never unmounted)
 * - Audio-only mode: same iframe, we just hide the fixed div with CSS (audio keeps playing)
 * - Video mode: we show the fixed div OR clone its position into the modal slot via CSS
 * - This is the only way to guarantee audio never stops
 *
 * Mutual exclusion: when YT starts playing, it pauses Saavn via window event.
 * When Saavn starts playing, YT gets paused via the same mechanism.
 */
import {
  createContext, useContext, useCallback, useReducer, useRef, useEffect, useState,
} from "react";

const initial = {
  currentVideo: null,
  queue:        [],
  history:      [],
  playing:      false,
  shuffle:      false,
  repeat:       "none",
  ytMode:       "audio", // "audio" | "video" — default is AUDIO for music streaming
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
        const rec = JSON.parse(localStorage.getItem("remix:yt:recent") || "[]");
        localStorage.setItem("remix:yt:recent", JSON.stringify(
          [{ id: v.id, title: v.title, thumbnail: v.thumbnail, channelTitle: v.channelTitle, ts: Date.now() },
            ...rec.filter(r => r.id !== v.id)].slice(0, 50)
        ));
        localStorage.setItem("remix:yt:last", v.id);
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
        ...state,
        currentVideo: pick,
        queue: state.queue.filter(v => v.id !== pick.id),
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

// Global ref so the iframe container div can be accessed outside React
let _iframeContainerRef = null;

export function YTProvider({ children }) {
  const [state, dispatch]     = useReducer(reducer, initial);
  const iframeRef             = useRef(null);
  const containerRef          = useRef(null); // the always-mounted fixed div
  const [iframeKey, setIframeKey] = useState(0); // force remount on new video

  // Keep global ref in sync
  useEffect(() => { _iframeContainerRef = containerRef.current; }, []);

  // ── postMessage YT API control ─────────────────────────────────
  const ytCmd = useCallback((cmd, args = []) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: cmd, args }),
        "*"
      );
    } catch {}
  }, []);

  // Listen for YT iframe API state events
  useEffect(() => {
    const handler = (e) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onStateChange") {
          if (data.info === 1) dispatch({ type: "SET_PLAYING", payload: true  });
          if (data.info === 2) dispatch({ type: "SET_PLAYING", payload: false });
          if (data.info === 0) { // ended
            dispatch({ type: "SET_PLAYING", payload: false });
            dispatch({ type: "NEXT" });
          }
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // ── Mutual exclusion: pause Saavn when YT plays ────────────────
  useEffect(() => {
    if (state.playing && state.currentVideo) {
      window.dispatchEvent(new CustomEvent("remix:yt:playing"));
    }
  }, [state.playing, state.currentVideo]);

  // ── When video changes, remount iframe ─────────────────────────
  useEffect(() => {
    if (state.currentVideo) setIframeKey(k => k + 1);
  }, [state.currentVideo?.id]);

  // ── Public API ─────────────────────────────────────────────────
  const playVideo   = useCallback((v) => dispatch({ type: "PLAY", payload: v }), []);
  const ytPlay      = useCallback(() => { ytCmd("playVideo");  dispatch({ type: "SET_PLAYING", payload: true  }); }, [ytCmd]);
  const ytPause     = useCallback(() => { ytCmd("pauseVideo"); dispatch({ type: "SET_PLAYING", payload: false }); }, [ytCmd]);
  const togglePlay  = useCallback(() => {
    if (state.playing) ytPause(); else ytPlay();
  }, [state.playing, ytPlay, ytPause]);
  const next           = useCallback(() => dispatch({ type: "NEXT" }), []);
  const prev           = useCallback(() => dispatch({ type: "PREV" }), []);
  const addToQueue     = useCallback((v) => dispatch({ type: "ADD_TO_QUEUE", payload: v }), []);
  const setQueue       = useCallback((q) => dispatch({ type: "SET_QUEUE", payload: q }), []);
  const removeFromQueue= useCallback((i) => dispatch({ type: "REMOVE_FROM_QUEUE", payload: i }), []);
  const toggleShuffle  = useCallback(() => dispatch({ type: "TOGGLE_SHUFFLE" }), []);
  const stop           = useCallback(() => { ytCmd("pauseVideo"); dispatch({ type: "STOP" }); }, [ytCmd]);
  const setRepeat      = useCallback((r) => dispatch({ type: "SET_REPEAT", payload: r }), []);
  const setYtMode      = useCallback((m) => dispatch({ type: "SET_YT_MODE", payload: m }), []);

  const getLiked  = useCallback(() => { try { return JSON.parse(localStorage.getItem("remix:yt:likes") || "[]"); } catch { return []; } }, []);
  const toggleLike= useCallback((video) => {
    try {
      const likes = JSON.parse(localStorage.getItem("remix:yt:likes") || "[]");
      localStorage.setItem("remix:yt:likes", JSON.stringify(
        likes.find(v => v.id === video.id) ? likes.filter(v => v.id !== video.id) : [video, ...likes]
      ));
    } catch {}
  }, []);
  const isLiked   = useCallback((id) => { try { return JSON.parse(localStorage.getItem("remix:yt:likes") || "[]").some(v => v.id === id); } catch { return false; } }, []);
  const getRecent = useCallback(() => { try { return JSON.parse(localStorage.getItem("remix:yt:recent") || "[]"); } catch { return []; } }, []);

  const isAudio = state.ytMode === "audio";
  const isVideo = state.ytMode === "video";

  return (
    <YTContext.Provider value={{
      ...state,
      iframeRef, containerRef,
      playVideo, togglePlay, ytPlay, ytPause,
      next, prev, addToQueue, setQueue, removeFromQueue,
      toggleShuffle, stop, setRepeat, setYtMode,
      getLiked, toggleLike, isLiked, getRecent,
    }}>
      {/*
        FIXED IFRAME CONTAINER — always mounted, never moves.
        - Audio mode: position fixed but off-screen visually (opacity 0, 1x1px)
          but browser still plays audio because it's in the DOM
        - Video mode (in modal): we use CSS to make it cover the slot element
        The iframe is NEVER detached from the DOM. Moving it would reset playback.
      */}
      <div
        ref={containerRef}
        id="yt-iframe-container"
        style={{
          position:  "fixed",
          // Default: off-screen (audio-only mode or modal closed)
          // The modal overrides these via an inline style on this element
          top:       0,
          left:      0,
          width:     "1px",
          height:    "1px",
          overflow:  "hidden",
          zIndex:    state.currentVideo ? 55 : -1,
          opacity:   isVideo ? 1 : 0,
          pointerEvents: isVideo ? "auto" : "none",
          background: "#000",
          borderRadius: "0",
          transition: "opacity 0.2s",
        }}
      >
        {state.currentVideo && (
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={`https://www.youtube.com/embed/${state.currentVideo.id}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`}
            title={state.currentVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        )}
      </div>

      {children}
    </YTContext.Provider>
  );
}

// Helper: position the fixed iframe container to cover a given DOM element
// Called by the modal when showing video mode
export function positionIframeOver(slotEl) {
  const container = document.getElementById("yt-iframe-container");
  if (!container || !slotEl) return;
  const rect = slotEl.getBoundingClientRect();
  container.style.top    = `${rect.top}px`;
  container.style.left   = `${rect.left}px`;
  container.style.width  = `${rect.width}px`;
  container.style.height = `${rect.height}px`;
  container.style.borderRadius = "12px";
  container.style.overflow = "hidden";
}

// Helper: send iframe back to off-screen audio-only position
export function hideIframeToBackground() {
  const container = document.getElementById("yt-iframe-container");
  if (!container) return;
  container.style.top    = "0";
  container.style.left   = "0";
  container.style.width  = "1px";
  container.style.height = "1px";
  container.style.borderRadius = "0";
  container.style.overflow = "hidden";
}
