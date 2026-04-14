"use client";
/**
 * YTProvider — YouTube playback engine for Arise.
 *
 * KEY ARCHITECTURE:
 * - ONE fixed container div holds the iframe. NEVER moves, NEVER unmounts.
 * - Audio mode: container is 1×1px invisible — browser keeps playing audio.
 * - Video mode: container's CSS is set to cover the slot element's bounding rect.
 *
 * PROGRESS TRACKING (fixed):
 * - Poll getCurrentTime + getDuration every 500ms while playing.
 * - Expose ytCurrentTime, ytDuration, ytProgress (0-100) to all consumers.
 * - ytSeek(seconds) sends seekTo command to iframe.
 */
import { createContext, useContext, useCallback, useReducer, useRef, useEffect, useState } from "react";

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
  const [state, dispatch]       = useReducer(reducer, initial);
  const iframeRef               = useRef(null);
  const containerRef            = useRef(null);
  const [videoId,  setVideoId]  = useState(null);
  const [ytVolume, setYtVolume] = useState(1);
  const [ytMuted,  setYtMuted]  = useState(false);

  // ── Real-time progress state ──────────────────────────────────────────
  const [ytCurrentTime, setYtCurrentTime] = useState(0);
  const [ytDuration,    setYtDuration]    = useState(0);
  const [ytProgress,    setYtProgress]    = useState(0); // 0-100
  const pollRef = useRef(null);

  // postMessage command helper
  const ytCmd = useCallback((cmd, args = []) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: cmd, args }), "*"
      );
    } catch {}
  }, []);

  // ── Seek to a position (seconds) ─────────────────────────────────────
  const ytSeek = useCallback((seconds) => {
    ytCmd("seekTo", [seconds, true]);
    // Optimistically update UI
    setYtCurrentTime(seconds);
    setYtProgress(ytDuration > 0 ? (seconds / ytDuration) * 100 : 0);
  }, [ytCmd, ytDuration]);

  // ── Poll getCurrentTime + getDuration every 500ms ─────────────────────
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    if (!state.playing || !state.currentVideo) return;

    pollRef.current = setInterval(() => {
      try {
        // Ask iframe for current time
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "getCurrentTime", args: [] }), "*"
        );
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "getDuration",    args: [] }), "*"
        );
        // Also send listening event for infoDelivery
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "listening" }), "*"
        );
      } catch {}
    }, 500);

    return () => clearInterval(pollRef.current);
  }, [state.playing, state.currentVideo]);

  // Reset progress on video change
  useEffect(() => {
    setYtCurrentTime(0);
    setYtDuration(0);
    setYtProgress(0);
  }, [state.currentVideo?.id]);

  // Volume control
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

  // ── Message handler — parse infoDelivery for time & duration ─────────
  useEffect(() => {
    const handler = (e) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!data) return;

        if (data?.event === "onStateChange") {
          if (data.info === 1) dispatch({ type: "SET_PLAYING", payload: true  });
          if (data.info === 2) dispatch({ type: "SET_PLAYING", payload: false });
          if (data.info === 0) {
            dispatch({ type: "SET_PLAYING", payload: false });
            dispatch({ type: "NEXT" });
          }
        }

        if (data?.event === "onReady") {
          ytCmd("setVolume", [Math.round(ytVolume * 100)]);
          ytCmd("playVideo");
        }

        // ── infoDelivery: the key fix — extract currentTime & duration ──
        if (data?.event === "infoDelivery" && data?.info) {
          const info = data.info;
          const ct  = typeof info.currentTime === "number" ? info.currentTime : null;
          const dur = typeof info.duration    === "number" ? info.duration    : null;

          if (ct  !== null) setYtCurrentTime(ct);
          if (dur !== null && dur > 0) {
            setYtDuration(dur);
            if (ct !== null) setYtProgress((ct / dur) * 100);
          }

          // Auto-advance near end
          if (dur && dur > 10 && ct && dur - ct < 2) {
            dispatch({ type: "SET_PLAYING", payload: false });
            dispatch({ type: "NEXT" });
          }
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [ytCmd, ytVolume]);

  // Mutual exclusion — pause when Saavn fires
  useEffect(() => {
    const handler = () => {
      ytCmd("pauseVideo");
      dispatch({ type: "SET_PLAYING", payload: false });
    };
    window.addEventListener("arise:saavn:playing", handler);
    return () => window.removeEventListener("arise:saavn:playing", handler);
  }, [ytCmd]);

  // When YT plays → pause Saavn
  useEffect(() => {
    if (state.playing && state.currentVideo) {
      window.dispatchEvent(new CustomEvent("arise:yt:playing"));
    }
  }, [state.playing, state.currentVideo]);

  // When video changes → update iframe src
  useEffect(() => {
    setVideoId(state.currentVideo ? state.currentVideo.id : null);
  }, [state.currentVideo?.id]);

  // Public API
  const playVideo       = useCallback((v) => dispatch({ type: "PLAY", payload: v }), []);
  const ytPlay          = useCallback(() => { ytCmd("playVideo");  dispatch({ type: "SET_PLAYING", payload: true  }); }, [ytCmd]);
  const ytPause         = useCallback(() => { ytCmd("pauseVideo"); dispatch({ type: "SET_PLAYING", payload: false }); }, [ytCmd]);
  const togglePlay      = useCallback(() => { if (state.playing) ytPause(); else ytPlay(); }, [state.playing, ytPlay, ytPause]);
  const next            = useCallback(() => dispatch({ type: "NEXT" }), []);
  const prev            = useCallback(() => dispatch({ type: "PREV" }), []);
  const addToQueue      = useCallback((v) => dispatch({ type: "ADD_TO_QUEUE", payload: v }), []);
  const setQueue        = useCallback((q) => dispatch({ type: "SET_QUEUE", payload: q }), []);
  const removeFromQueue = useCallback((i) => dispatch({ type: "REMOVE_FROM_QUEUE", payload: i }), []);
  const toggleShuffle   = useCallback(() => dispatch({ type: "TOGGLE_SHUFFLE" }), []);
  const stop            = useCallback(() => {
    ytCmd("pauseVideo");
    dispatch({ type: "STOP" });
    setVideoId(null);
    hideIframeContainer();
  }, [ytCmd]);
  const setRepeat   = useCallback((r) => dispatch({ type: "SET_REPEAT", payload: r }), []);
  const setYtMode   = useCallback((m) => {
    dispatch({ type: "SET_YT_MODE", payload: m });
    if (m === "audio") hideIframeContainer();
  }, []);

  const getLiked   = useCallback(() => { try { return JSON.parse(localStorage.getItem("arise:yt:likes") || "[]"); } catch { return []; } }, []);
  const toggleLike = useCallback((video) => {
    try {
      const likes = JSON.parse(localStorage.getItem("arise:yt:likes") || "[]");
      localStorage.setItem("arise:yt:likes", JSON.stringify(
        likes.find(v => v.id === video.id) ? likes.filter(v => v.id !== video.id) : [video, ...likes]
      ));
    } catch {}
  }, []);
  const isLiked  = useCallback((id) => { try { return JSON.parse(localStorage.getItem("arise:yt:likes") || "[]").some(v => v.id === id); } catch { return false; } }, []);
  const getRecent = useCallback(() => { try { return JSON.parse(localStorage.getItem("arise:yt:recent") || "[]"); } catch { return []; } }, []);

  // Format time helper
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
      // Real progress values
      ytCurrentTime, ytDuration, ytProgress, ytSeek, ytFormatTime,
      playVideo, togglePlay, ytPlay, ytPause,
      next, prev, addToQueue, setQueue, removeFromQueue,
      toggleShuffle, stop, setRepeat, setYtMode,
      getLiked, toggleLike, isLiked, getRecent,
    }}>
      {/*
        FIXED CONTAINER — always in DOM, never moved.
        Audio: 1×1px, opacity 0 → audio keeps playing silently
        Video: JS sets top/left/width/height to cover the modal slot
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
          transition:    "opacity 0.2s",
        }}
      >
        {videoId && (
          <iframe
            ref={iframeRef}
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1&fs=1`}
            title="Arise YT Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
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
    c.style.top           = `${r.top}px`;
    c.style.left          = `${r.left}px`;
    c.style.width         = `${r.width}px`;
    c.style.height        = `${r.height}px`;
    c.style.opacity       = "1";
    c.style.pointerEvents = "auto";
    c.style.zIndex        = "65";
    c.style.borderRadius  = "12px";
    c.style.overflow      = "hidden";
    c.style.transition    = "none";
  });
}

export function hideIframeContainer() {
  const c = document.getElementById("arise-yt-container");
  if (!c) return;
  c.style.top           = "0";
  c.style.left          = "0";
  c.style.width         = "1px";
  c.style.height        = "1px";
  c.style.opacity       = "0";
  c.style.pointerEvents = "none";
  c.style.zIndex        = "-1";
  c.style.borderRadius  = "0";
}
