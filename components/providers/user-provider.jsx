"use client";
import { UserContext } from "@/hooks/use-context";
import { useState, useEffect, useCallback } from "react";

/**
 * UserProvider — handles user auth state, liked songs, and settings.
 * Uses localStorage for persistence (no backend required).
 * Google OAuth is shimmed — you can wire up NextAuth later.
 */
export default function UserProvider({ children }) {
  const [user, setUser]   = useState(null);   // { name, email, avatar }
  const [liked, setLiked] = useState(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("remix:liked") || "[]"); }
    catch { return []; }
  });
  const [playlists, setPlaylists] = useState(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("remix:playlists") || "[]"); }
    catch { return []; }
  });

  // ── Restore session ──────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("remix:user");
      if (saved) setUser(JSON.parse(saved));
    } catch {}
  }, []);

  // ── Persist liked ────────────────────────────────
  useEffect(() => {
    localStorage.setItem("remix:liked", JSON.stringify(liked));
  }, [liked]);

  // ── Persist playlists ────────────────────────────
  useEffect(() => {
    localStorage.setItem("remix:playlists", JSON.stringify(playlists));
  }, [playlists]);

  // ── Google login (shimmed) ───────────────────────
  const loginWithGoogle = useCallback(() => {
    // In production: wire to NextAuth signIn("google")
    // For now: use a demo user
    const demo = {
      name:   "RemiX User",
      email:  "user@remix.app",
      avatar: null,
      id:     "local-" + Date.now(),
    };
    setUser(demo);
    localStorage.setItem("remix:user", JSON.stringify(demo));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("remix:user");
  }, []);

  // ── Like toggle ──────────────────────────────────
  const toggleLike = useCallback((song) => {
    setLiked(prev => {
      const exists = prev.find(s => s.id === song.id);
      if (exists) return prev.filter(s => s.id !== song.id);
      return [{ ...song, likedAt: Date.now() }, ...prev];
    });
  }, []);

  const isLiked = useCallback((id) => liked.some(s => s.id === id), [liked]);

  // ── Playlist management ───────────────────────────
  const createPlaylist = useCallback((name) => {
    const pl = { id: Date.now().toString(), name, songs: [], createdAt: Date.now() };
    setPlaylists(prev => [pl, ...prev]);
    return pl.id;
  }, []);

  const addToPlaylist = useCallback((playlistId, song) => {
    setPlaylists(prev => prev.map(pl =>
      pl.id === playlistId
        ? { ...pl, songs: pl.songs.find(s => s.id === song.id) ? pl.songs : [...pl.songs, song] }
        : pl
    ));
  }, []);

  const removeFromPlaylist = useCallback((playlistId, songId) => {
    setPlaylists(prev => prev.map(pl =>
      pl.id === playlistId
        ? { ...pl, songs: pl.songs.filter(s => s.id !== songId) }
        : pl
    ));
  }, []);

  return (
    <UserContext.Provider value={{
      user, loginWithGoogle, logout,
      liked, toggleLike, isLiked,
      playlists, createPlaylist, addToPlaylist, removeFromPlaylist,
    }}>
      {children}
    </UserContext.Provider>
  );
}
