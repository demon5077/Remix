"use client";
import { createContext, useContext, useCallback, useReducer, useRef } from "react";

// ── State shape ───────────────────────────────────────────────────────────────
const initial = {
  currentVideo: null,   // YTItem
  queue:        [],     // YTItem[]
  history:      [],     // YTItem[]
  playing:      false,
  playerReady:  false,
  shuffle:      false,
  repeat:       "none", // "none" | "one" | "all"
};

function reducer(state, action) {
  switch (action.type) {
    case "PLAY": {
      const video = action.payload;
      if (!video) return state;
      const history = state.currentVideo
        ? [state.currentVideo, ...state.history.filter(v => v.id !== state.currentVideo.id)].slice(0, 50)
        : state.history;
      // Persist
      try {
        const recent = JSON.parse(localStorage.getItem("remix:yt:recent") || "[]");
        const updated = [{ id: video.id, title: video.title, thumbnail: video.thumbnail, channelTitle: video.channelTitle, ts: Date.now() },
          ...recent.filter(r => r.id !== video.id)].slice(0, 50);
        localStorage.setItem("remix:yt:recent", JSON.stringify(updated));
        localStorage.setItem("remix:yt:last", video.id);
      } catch {}
      return { ...state, currentVideo: video, playing: true, history };
    }
    case "TOGGLE_PLAY":
      return { ...state, playing: !state.playing };
    case "SET_PLAYING":
      return { ...state, playing: action.payload };
    case "SET_READY":
      return { ...state, playerReady: action.payload };
    case "SET_QUEUE":
      return { ...state, queue: action.payload };
    case "ADD_TO_QUEUE": {
      const item = action.payload;
      if (state.queue.find(v => v.id === item.id)) return state;
      return { ...state, queue: [...state.queue, item] };
    }
    case "REMOVE_FROM_QUEUE":
      return { ...state, queue: state.queue.filter((_, i) => i !== action.payload) };
    case "NEXT": {
      if (state.queue.length === 0) return state;
      const next = state.shuffle
        ? state.queue[Math.floor(Math.random() * state.queue.length)]
        : state.queue[0];
      const queue = state.queue.filter(v => v.id !== next.id);
      const history = state.currentVideo
        ? [state.currentVideo, ...state.history].slice(0, 50)
        : state.history;
      return { ...state, currentVideo: next, queue, history, playing: true };
    }
    case "PREV": {
      if (state.history.length === 0) return state;
      const [prev, ...rest] = state.history;
      const queue = state.currentVideo ? [state.currentVideo, ...state.queue] : state.queue;
      return { ...state, currentVideo: prev, history: rest, queue, playing: true };
    }
    case "TOGGLE_SHUFFLE":
      return { ...state, shuffle: !state.shuffle };
    case "SET_REPEAT":
      return { ...state, repeat: action.payload };
    case "STOP":
      return { ...state, currentVideo: null, playing: false };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
export const YTContext = createContext(null);
export const useYT = () => useContext(YTContext);

export function YTProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const iframeRef = useRef(null); // ref to <iframe> element for YT embed

  const playVideo     = useCallback((video) => dispatch({ type: "PLAY", payload: video }), []);
  const togglePlay    = useCallback(() => dispatch({ type: "TOGGLE_PLAY" }), []);
  const setPlaying    = useCallback((v) => dispatch({ type: "SET_PLAYING", payload: v }), []);
  const setReady      = useCallback((v) => dispatch({ type: "SET_READY", payload: v }), []);
  const next          = useCallback(() => dispatch({ type: "NEXT" }), []);
  const prev          = useCallback(() => dispatch({ type: "PREV" }), []);
  const addToQueue    = useCallback((v) => dispatch({ type: "ADD_TO_QUEUE", payload: v }), []);
  const setQueue      = useCallback((q) => dispatch({ type: "SET_QUEUE", payload: q }), []);
  const removeFromQueue = useCallback((i) => dispatch({ type: "REMOVE_FROM_QUEUE", payload: i }), []);
  const toggleShuffle = useCallback(() => dispatch({ type: "TOGGLE_SHUFFLE" }), []);
  const stop          = useCallback(() => dispatch({ type: "STOP" }), []);
  const setRepeat     = useCallback((r) => dispatch({ type: "SET_REPEAT", payload: r }), []);

  // Liked videos (localStorage)
  const getLiked = useCallback(() => {
    try { return JSON.parse(localStorage.getItem("remix:yt:likes") || "[]"); }
    catch { return []; }
  }, []);

  const toggleLike = useCallback((video) => {
    try {
      const likes = JSON.parse(localStorage.getItem("remix:yt:likes") || "[]");
      const exists = likes.find(v => v.id === video.id);
      const next = exists ? likes.filter(v => v.id !== video.id) : [video, ...likes];
      localStorage.setItem("remix:yt:likes", JSON.stringify(next));
    } catch {}
  }, []);

  const isLiked = useCallback((id) => {
    try {
      const likes = JSON.parse(localStorage.getItem("remix:yt:likes") || "[]");
      return likes.some(v => v.id === id);
    } catch { return false; }
  }, []);

  const getRecent = useCallback(() => {
    try { return JSON.parse(localStorage.getItem("remix:yt:recent") || "[]"); }
    catch { return []; }
  }, []);

  return (
    <YTContext.Provider value={{
      ...state,
      iframeRef,
      playVideo, togglePlay, setPlaying, setReady,
      next, prev, addToQueue, setQueue, removeFromQueue,
      toggleShuffle, stop, setRepeat,
      getLiked, toggleLike, isLiked, getRecent,
    }}>
      {children}
    </YTContext.Provider>
  );
}
