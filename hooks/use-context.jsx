"use client";
import { createContext, useContext } from "react";

// Single source of truth for all audio + playback state
export const MusicContext = createContext(null);
// Queue/next song context (player page only)
export const NextContext  = createContext(null);
// User/auth/library context
export const UserContext  = createContext(null);

export const useMusicProvider    = () => useContext(MusicContext);
export const useNextMusicProvider = () => useContext(NextContext);
export const useUserProvider     = () => useContext(UserContext);
