"use client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Logo from "@/components/page/logo";

export default function LoginPage() {
  const { loginWithGoogle, loginWithSpotify, isLoggedIn, googleUser, spotifyUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) router.replace("/playlists");
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,0,0,0.12) 0%, transparent 70%)", animation: "driftA 18s ease-in-out infinite alternate" }} />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", animation: "driftB 22s ease-in-out infinite alternate" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Logo />
          <p className="text-xs uppercase tracking-[0.3em] mt-3"
            style={{ color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}>
            Rise. Listen. Ascend.
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl p-8 space-y-4"
          style={{
            background: "rgba(12,12,22,0.95)",
            border:     "1px solid rgba(255,0,60,0.12)",
            boxShadow:  "0 8px 60px rgba(0,0,0,0.5)",
          }}>
          <h1 className="text-2xl font-black text-center mb-2"
            style={{ fontFamily: "Orbitron, sans-serif", color: "#f0f0ff" }}>
            Enter the Realm
          </h1>
          <p className="text-xs text-center mb-6"
            style={{ color: "#8888aa", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}>
            Connect your accounts to import playlists, sync your library and unlock the full infernal experience.
          </p>

          {/* Google / YouTube */}
          <button onClick={loginWithGoogle}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-100"
            style={{
              background: googleUser ? "rgba(255,0,60,0.12)" : "rgba(255,255,255,0.04)",
              border:     googleUser ? "1px solid rgba(255,0,60,0.35)" : "1px solid rgba(255,255,255,0.1)",
              color:      "#e8e8f8",
              fontFamily: "Rajdhani, sans-serif",
              letterSpacing: "0.04em",
            }}>
            {/* Google logo */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleUser ? (
              <span className="flex-1 text-left">Connected as {googleUser.name || googleUser.email}</span>
            ) : (
              <span className="flex-1 text-left">Continue with Google / YouTube</span>
            )}
            {googleUser && <span style={{ color: "#FF003C", fontSize: "0.7rem" }}>✓</span>}
          </button>

          {/* Spotify */}
          <button onClick={loginWithSpotify}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-100"
            style={{
              background: spotifyUser ? "rgba(29,185,84,0.12)" : "rgba(255,255,255,0.04)",
              border:     spotifyUser ? "1px solid rgba(29,185,84,0.35)" : "1px solid rgba(255,255,255,0.1)",
              color:      "#e8e8f8",
              fontFamily: "Rajdhani, sans-serif",
              letterSpacing: "0.04em",
            }}>
            {/* Spotify logo */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            {spotifyUser ? (
              <span className="flex-1 text-left">Connected as {spotifyUser.display_name || spotifyUser.email}</span>
            ) : (
              <span className="flex-1 text-left">Continue with Spotify</span>
            )}
            {spotifyUser && <span style={{ color: "#1DB954", fontSize: "0.7rem" }}>✓</span>}
          </button>

          {(googleUser || spotifyUser) && (
            <button onClick={() => router.push("/playlists")}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
              style={{
                background:  "linear-gradient(135deg, #8B0000, #FF003C)",
                color:       "white",
                fontFamily:  "Orbitron, sans-serif",
                letterSpacing: "0.08em",
                boxShadow:   "0 0 20px rgba(255,0,60,0.35)",
              }}>
              VIEW MY PLAYLISTS →
            </button>
          )}

          <p className="text-[10px] text-center mt-4"
            style={{ color: "#44445a", fontFamily: "Rajdhani, sans-serif" }}>
            Arise never stores your credentials. OAuth tokens are kept locally in your browser.
            Configure Client IDs in your .env.local file.
          </p>
        </div>
      </div>
    </div>
  );
}
