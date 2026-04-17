"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Phone, Lock, Eye, EyeOff, LogIn, LogOut, User,
  CheckCircle, Upload, Music2, Trash2, Shield, RefreshCw,
  Youtube, Chrome,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  registerUser, verifyEmail, loginUser, resendVerification,
  updateSessionField, persistPlaylist, persistManyPlaylists,
} from "@/lib/arise-auth";
import { parsePlaylistJSON, parseM3U } from "@/lib/playlist-parser";
import {
  startGoogleLogin, startSpotifyLogin,
} from "@/lib/auth";
import {
  isGoogleConnected as isGoogleLoggedIn,
  isSpotifyConnected as isSpotifyLoggedIn,
  getGoogleProfile, getSpotifyProfile,
  clearGoogle as clearGoogleTokens,
  clearSpotify as clearSpotifyTokens,
  fetchYTPlaylists as fetchYouTubePlaylists,
  fetchSpotifyPlaylists,
  saveSession, getSession, clearSession,
} from "@/lib/session";

// ── Spotify SVG icon ───────────────────────────────────────────────────────────
function SpotifyIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

// ── Input field component ──────────────────────────────────────────────────────
function Field({ icon: Icon, label, type = "text", value, onChange, placeholder, right }) {
  return (
    <div>
      <label className="text-xs font-bold mb-1.5 block"
        style={{ color: "#9999bb", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.06em" }}>
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#666688" }} />
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          className="w-full pl-10 py-3 rounded-xl text-sm outline-none transition-all"
          style={{
            paddingRight: right ? "40px" : "16px",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,0,60,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(255,0,60,0.08)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }} />
        {right}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const router = useRouter();
  const [session,      setSession]      = useState(null);
  const [mode,         setMode]         = useState("login");      // login | register
  const [authType,     setAuthType]     = useState("email");
  const [step,         setStep]         = useState("form");       // form | verify
  const [identifier,   setIdentifier]   = useState("");
  const [password,     setPassword]     = useState("");
  const [name,         setName]         = useState("");
  const [showPw,       setShowPw]       = useState(false);
  const [verifyCode,   setVerifyCode]   = useState("");
  const [pendingId,    setPendingId]    = useState("");
  const [loading,      setLoading]      = useState(false);
  const [activeTab,    setActiveTab]    = useState("account");    // account | playlists | connect
  const [googlePl,     setGooglePl]     = useState([]);
  const [spotifyPl,    setSpotifyPl]    = useState([]);
  const [importedPl,   setImportedPl]   = useState([]);
  const [loadingPl,    setLoadingPl]    = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s) loadUserData(s);

    // Handle OAuth callback
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    if (connected === "google") {
      toast.success("Google connected! 🎉");
      window.history.replaceState({}, "", "/login");
      // Reload session (Google callback may have created one)
      const fresh = getSession();
      if (fresh) { setSession(fresh); loadUserData(fresh); }
      // Fire global session change event
      window.dispatchEvent(new CustomEvent("arise:session:changed"));
    }
    if (connected === "spotify") {
      toast.success("Spotify connected! 🎉");
      window.history.replaceState({}, "", "/login");
      window.dispatchEvent(new CustomEvent("arise:session:changed"));
    }
    const err = params.get("error");
    if (err) { toast.error(`Connection failed: ${decodeURIComponent(err)}`); window.history.replaceState({}, "", "/login"); }
  }, []);

  const loadUserData = (s) => {
    const imp = (() => { try { return JSON.parse(localStorage.getItem("arise:imported-playlists") || "[]"); } catch { return []; } })();
    setImportedPl(imp);
  };

  // ── Submit auth form ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) { toast.error("Fill in all fields"); return; }
    setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) { toast.error("Enter your name"); return; }
        const res = await registerUser({ name: name.trim(), identifier: identifier.trim(), password, authType });
        if (res.error) { toast.error(res.error); return; }
        if (res.needsVerification) {
          setPendingId(identifier.trim());
          setStep("verify");
          toast("Check your email for a 6-digit verification code 📧");
        } else {
          // Phone: no verification needed
          saveSession(res.user);
          setSession(res.user);
          loadUserData(res.user);
          window.dispatchEvent(new CustomEvent("arise:session:changed"));
          toast.success(`Welcome to Arise, ${res.user.name}! 🔥`);
        }
      } else {
        const res = await loginUser({ identifier: identifier.trim(), password });
        if (res.error) {
          if (res.needsVerification) { setPendingId(identifier.trim()); setStep("verify"); toast.error("Email not verified — enter the code sent to you"); }
          else toast.error(res.error);
          return;
        }
        saveSession(res.user);
        setSession(res.user);
        loadUserData(res.user);
        toast.success(`Welcome back, ${res.user.name}! 🔥`);
      }
    } finally { setLoading(false); }
  };

  // ── Verify code step ───────────────────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    if (verifyCode.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await verifyEmail({ identifier: pendingId, code: verifyCode });
      if (res.error) { toast.error(res.error); return; }
      saveSession(res.user);
      setSession(res.user);
      setStep("form");
      toast.success("Email verified! Welcome to Arise 🔥");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    const res = await resendVerification({ identifier: pendingId });
    if (res.ok) toast.success("New code sent to your email!");
    else toast.error("Failed to resend — try again");
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setGooglePl([]); setSpotifyPl([]); setImportedPl([]);
    window.dispatchEvent(new CustomEvent("arise:session:changed"));
    toast("Signed out");
  };

  // ── Load OAuth playlists ───────────────────────────────────────────────────
  const loadGooglePlaylists = async () => {
    if (!isGoogleLoggedIn()) { toast.error("Connect Google first"); return; }
    setLoadingPl(true);
    const { playlists, error } = await fetchYouTubePlaylists();
    setLoadingPl(false);
    if (error) { toast.error(error); return; }
    setGooglePl(playlists);
    toast.success(`Loaded ${playlists.length} YouTube playlists`);
  };

  const loadSpotifyPlaylists = async () => {
    if (!isSpotifyLoggedIn()) { toast.error("Connect Spotify first"); return; }
    setLoadingPl(true);
    const { playlists, error } = await fetchSpotifyPlaylists();
    setLoadingPl(false);
    if (error) { toast.error(error); return; }
    setSpotifyPl(playlists);
    toast.success(`Loaded ${playlists.length} Spotify playlists`);
  };

  // ── Import OAuth playlists into account DB ─────────────────────────────────
  const saveOAuthToAccount = async (playlists, source) => {
    if (!session?.id) { toast.error("Sign in first"); return; }
    const normalized = playlists.map(p => ({
      id:         p.id,
      name:       p.name || p.title || "Playlist",
      title:      p.title || p.name,
      thumbnail:  p.thumbnail || "",
      count:      p.count || 0,
      source,
      savedFrom:  source,
      importedAt: Date.now(),
    }));
    const merged = await persistManyPlaylists(session.id, normalized);
    if (merged) {
      setSession(s => ({ ...s, playlists: merged }));
      toast.success(`Saved ${playlists.length} ${source} playlists to your account ✓`);
    }
  };

  // ── Disconnect OAuth ───────────────────────────────────────────────────────
  const handleDisconnect = async (provider) => {
    if (provider === "google")  { clearGoogleTokens();  setGooglePl([]);  }
    if (provider === "spotify") { clearSpotifyTokens(); setSpotifyPl([]); }
    toast(`${provider === "google" ? "Google" : "Spotify"} disconnected. Playlists saved to your account.`);
  };

  // ── Import file (JSON YouTube scrape, Saavn export, M3U) ──────────────────
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target.result;
        let parsed;

        if (file.name.match(/\.m3u8?$/i)) {
          parsed = parseM3U(text, file.name);
        } else if (file.name.endsWith(".json")) {
          parsed = parsePlaylistJSON(text, file.name);
        } else {
          toast.error("Unsupported format — use .json or .m3u");
          return;
        }

        if (!parsed.songs.length) { toast.error("No songs found in file"); return; }

        const pl = {
          id:         Date.now().toString(),
          name:       parsed.playlistName,
          songs:      parsed.songs,
          count:      parsed.songs.length,
          source:     parsed.source || "imported",
          importedAt: Date.now(),
        };

        // Save to localStorage immediately for UI
        const existing = (() => { try { return JSON.parse(localStorage.getItem("arise:imported-playlists") || "[]"); } catch { return []; } })();
        const updated  = [pl, ...existing.filter(p => p.id !== pl.id)];
        localStorage.setItem("arise:imported-playlists", JSON.stringify(updated));
        setImportedPl(updated);

        // Persist to server DB
        if (session?.id) {
          const result = await persistPlaylist(session.id, pl);
          if (result) {
            const s = getSession();
            if (s) saveSession({ ...s, playlists: result });
          }
        }

        toast.success(`Imported "${pl.name}" — ${parsed.songs.length} tracks ✓`);
      } catch (err) {
        console.error("Import error:", err);
        toast.error(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ════════════════════════════════════════════════════════════════════════════
  // VERIFY STEP
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(255,0,60,0.1)", border: "1px solid rgba(255,0,60,0.3)" }}>
              <Mail className="w-8 h-8" style={{ color: "#FF003C" }} />
            </div>
            <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>Check Your Email</h1>
            <p className="text-sm" style={{ color: "#9999bb" }}>We sent a 6-digit code to<br /><span style={{ color: "#FF003C" }}>{pendingId}</span></p>
          </div>

          <div className="p-7 rounded-2xl" style={{ background: "rgba(10,10,20,0.95)", border: "1px solid rgba(255,0,60,0.12)" }}>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: "#9999bb", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.06em" }}>VERIFICATION CODE</label>
                <input type="text" value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" maxLength={6}
                  className="w-full py-4 rounded-xl text-3xl font-black text-center outline-none tracking-[0.5em] transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,0,60,0.5)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }} />
              </div>
              <button type="submit" disabled={loading || verifyCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8B0000, #FF003C)", color: "white", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.08em", boxShadow: "0 0 24px rgba(255,0,60,0.4)" }}>
                <Shield className="w-4 h-4" />
                {loading ? "Verifying…" : "VERIFY & ENTER"}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={handleResend} className="text-xs" style={{ color: "#666688" }}>
                Didn't get it? <span style={{ color: "#FF003C" }}>Resend code</span>
              </button>
            </div>
            <div className="mt-3 text-center">
              <button onClick={() => setStep("form")} className="text-xs" style={{ color: "#444466" }}>← Back to sign in</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOGGED IN — PROFILE DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  if (session) {
    const googleProfile  = isGoogleLoggedIn()  ? getGoogleProfile()  : null;
    const spotifyProfile = isSpotifyLoggedIn() ? getSpotifyProfile() : null;
    const accountPlaylists = session.playlists || [];
    const allPlaylists     = [...accountPlaylists, ...importedPl.filter(p => !accountPlaylists.find(a => a.id === p.id))];

    const TABS = [
      { id: "account",   label: "Profile"    },
      { id: "connect",   label: "Connected"  },
      { id: "playlists", label: `Playlists (${allPlaylists.length})` },
    ];

    return (
      <div className="min-h-screen px-4 md:px-10 py-8 max-w-3xl mx-auto">

        {/* ── Profile header ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl"
          style={{ background: "rgba(18,18,32,0.9)", border: "1px solid rgba(255,0,60,0.1)" }}>
          {/* Avatar — Google photo, session avatar, or initials. Click to upload for email accounts */}
          <label className="relative flex-shrink-0 cursor-pointer group"
            title={session.authType === "google" ? "Google photo" : "Click to change photo"}>
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8B0000, #FF003C)", boxShadow: "0 0 24px rgba(255,0,60,0.35)" }}>
              {(session.avatar || googleProfile?.picture)
                ? <img src={session.avatar || googleProfile?.picture} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                : <span className="text-2xl font-black text-white" style={{ fontFamily: "Orbitron, sans-serif" }}>
                    {(session.name || "?")[0].toUpperCase()}
                  </span>}
            </div>
            {/* Upload overlay for non-Google accounts */}
            {session.authType !== "google" && (
              <>
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.6)" }}>
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => {
                      const avatar = ev.target.result;
                      const updated = { ...session, avatar };
                      saveSession(updated);
                      setSession(updated);
                      window.dispatchEvent(new CustomEvent("arise:session:changed"));
                      toast.success("Profile picture updated!");
                    };
                    reader.readAsDataURL(file);
                  }} />
              </>
            )}
            {(googleProfile || spotifyProfile) && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "#07070d", border: "2px solid rgba(255,0,60,0.2)" }}>
                <CheckCircle className="w-3 h-3" style={{ color: "#22c55e" }} />
              </div>
            )}
          </label>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black truncate" style={{ color: "#e8e8f8", fontFamily: "Orbitron, sans-serif" }}>{session.name}</h2>
            <p className="text-xs truncate mt-0.5" style={{ color: "#9999bb" }}>{session.identifier}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {session.verified && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                  <CheckCircle className="w-2.5 h-2.5" /> Verified
                </span>
              )}
              {googleProfile && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.25)", color: "#4285F4" }}>
                  <Chrome className="w-2.5 h-2.5" /> Google
                </span>
              )}
              {spotifyProfile && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(29,185,84,0.1)", border: "1px solid rgba(29,185,84,0.25)", color: "#1DB954" }}>
                  <SpotifyIcon size={10} /> Spotify
                </span>
              )}
              {session.authType !== "google" && (
                <span className="text-[10px]" style={{ color: "#44445a" }}>Click avatar to change photo</span>
              )}
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all"
            style={{ background: "rgba(255,0,60,0.08)", border: "1px solid rgba(255,0,60,0.15)", color: "#FF003C", fontFamily: "Rajdhani, sans-serif" }}>
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.06em",
                background: activeTab === t.id ? "rgba(255,0,60,0.15)" : "rgba(255,255,255,0.04)",
                border: activeTab === t.id ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.07)",
                color: activeTab === t.id ? "#FF003C" : "#ccccee",
              }}>{t.label}</button>
          ))}
        </div>

        {/* ── ACCOUNT TAB ──────────────────────────────────────────────────── */}
        {activeTab === "account" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Playlists", value: allPlaylists.length, color: "#FF003C" },
                { label: "Connected", value: [googleProfile, spotifyProfile].filter(Boolean).length, color: "#9D4EDD" },
                { label: "Liked",     value: (session.likedSongs || []).length, color: "#FF4444" },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-4 rounded-2xl text-center"
                  style={{ background: "rgba(18,18,32,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-2xl font-black" style={{ color, fontFamily: "Orbitron, sans-serif" }}>{value}</p>
                  <p className="text-[10px] mt-1 tracking-[0.15em] uppercase" style={{ color: "#666688", fontFamily: "Orbitron, sans-serif" }}>{label}</p>
                </div>
              ))}
            </div>

            <Link href="/playlists"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: "linear-gradient(135deg, #8B0000, #FF003C)", color: "white", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.06em", boxShadow: "0 0 20px rgba(255,0,60,0.3)" }}>
              View All Playlists
            </Link>
            <Link href="/recent"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>
              ⏱ Continue Listening
            </Link>
          </div>
        )}

        {/* ── CONNECT TAB ──────────────────────────────────────────────────── */}
        {activeTab === "connect" && (
          <div className="space-y-4">
            <p className="text-xs" style={{ color: "#666688" }}>
              Connect Google or Spotify to import your playlists. When you disconnect, playlists are saved to your Arise account.
            </p>

            {/* Google */}
            <div className="p-5 rounded-2xl" style={{ background: "rgba(18,18,32,0.8)", border: "1px solid rgba(66,133,244,0.15)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Chrome className="w-6 h-6" style={{ color: "#4285F4" }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>Google / YouTube</p>
                    {googleProfile && <p className="text-xs" style={{ color: "#9999bb" }}>{googleProfile.email || googleProfile.name}</p>}
                  </div>
                </div>
                {googleProfile
                  ? <button onClick={() => { saveOAuthToAccount(googlePl, "youtube"); handleDisconnect("google"); }}
                      className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                      style={{ background: "rgba(255,0,60,0.08)", border: "1px solid rgba(255,0,60,0.2)", color: "#FF003C", fontFamily: "Rajdhani, sans-serif" }}>
                      Save & Disconnect
                    </button>
                  : <button onClick={() => { try { startGoogleLogin(); } catch(e) { toast.error(e.message); } }}
                      className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                      style={{ background: "rgba(66,133,244,0.12)", border: "1px solid rgba(66,133,244,0.3)", color: "#4285F4", fontFamily: "Rajdhani, sans-serif" }}>
                      Connect Google
                    </button>
                }
              </div>
              {googleProfile && (
                <div className="flex gap-2">
                  <button onClick={loadGooglePlaylists} disabled={loadingPl}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background: "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.2)", color: "#4285F4", fontFamily: "Rajdhani, sans-serif" }}>
                    <RefreshCw className={`w-3 h-3 ${loadingPl ? "animate-spin" : ""}`} />
                    {loadingPl ? "Loading…" : `Load Playlists (${googlePl.length})`}
                  </button>
                  {googlePl.length > 0 && (
                    <button onClick={() => saveOAuthToAccount(googlePl, "youtube")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontFamily: "Rajdhani, sans-serif" }}>
                      Save to Account
                    </button>
                  )}
                </div>
              )}
              {googlePl.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {googlePl.map(pl => (
                    <div key={pl.id} className="flex items-center gap-2.5 p-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.03)" }}>
                      {pl.thumbnail
                        ? <img src={pl.thumbnail} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        : <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(66,133,244,0.15)" }}><Youtube className="w-4 h-4" style={{ color: "#4285F4" }} /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#ccccee" }}>{pl.title}</p>
                        <p className="text-[10px]" style={{ color: "#666688" }}>{pl.count} tracks</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spotify */}
            <div className="p-5 rounded-2xl" style={{ background: "rgba(18,18,32,0.8)", border: "1px solid rgba(29,185,84,0.15)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <SpotifyIcon size={24} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>Spotify</p>
                    {spotifyProfile && <p className="text-xs" style={{ color: "#9999bb" }}>{spotifyProfile.email || spotifyProfile.display_name}</p>}
                  </div>
                </div>
                {spotifyProfile
                  ? <button onClick={() => { saveOAuthToAccount(spotifyPl, "spotify"); handleDisconnect("spotify"); }}
                      className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                      style={{ background: "rgba(255,0,60,0.08)", border: "1px solid rgba(255,0,60,0.2)", color: "#FF003C", fontFamily: "Rajdhani, sans-serif" }}>
                      Save & Disconnect
                    </button>
                  : <button onClick={() => { try { startSpotifyLogin(); } catch(e) { toast.error(e.message); } }}
                      className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                      style={{ background: "rgba(29,185,84,0.12)", border: "1px solid rgba(29,185,84,0.3)", color: "#1DB954", fontFamily: "Rajdhani, sans-serif" }}>
                      Connect Spotify
                    </button>
                }
              </div>
              {spotifyProfile && (
                <div className="flex gap-2">
                  <button onClick={loadSpotifyPlaylists} disabled={loadingPl}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background: "rgba(29,185,84,0.1)", border: "1px solid rgba(29,185,84,0.2)", color: "#1DB954", fontFamily: "Rajdhani, sans-serif" }}>
                    <RefreshCw className={`w-3 h-3 ${loadingPl ? "animate-spin" : ""}`} />
                    {loadingPl ? "Loading…" : `Load Playlists (${spotifyPl.length})`}
                  </button>
                  {spotifyPl.length > 0 && (
                    <button onClick={() => saveOAuthToAccount(spotifyPl, "spotify")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontFamily: "Rajdhani, sans-serif" }}>
                      Save to Account
                    </button>
                  )}
                </div>
              )}
              {spotifyPl.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {spotifyPl.map(pl => (
                    <div key={pl.id} className="flex items-center gap-2.5 p-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.03)" }}>
                      {pl.thumbnail
                        ? <img src={pl.thumbnail} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        : <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(29,185,84,0.15)" }}><SpotifyIcon size={16} /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#ccccee" }}>{pl.title}</p>
                        <p className="text-[10px]" style={{ color: "#666688" }}>{pl.count} tracks</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Setup note */}
            {(!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && !process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID) && (
              <div className="p-4 rounded-xl text-xs leading-relaxed" style={{ background: "rgba(255,200,0,0.05)", border: "1px solid rgba(255,200,0,0.15)", color: "#aaaacc" }}>
                <p className="font-bold mb-1" style={{ color: "#FFD700" }}>⚙️ OAuth Setup Required</p>
                Add to <code style={{ color: "#FF003C" }}>.env.local</code>:<br />
                <code style={{ color: "#9D4EDD" }}>NEXT_PUBLIC_GOOGLE_CLIENT_ID=...</code><br />
                <code style={{ color: "#9D4EDD" }}>GOOGLE_CLIENT_SECRET=...</code><br />
                <code style={{ color: "#1DB954" }}>NEXT_PUBLIC_SPOTIFY_CLIENT_ID=...</code><br />
                <code style={{ color: "#1DB954" }}>SPOTIFY_CLIENT_SECRET=...</code>
              </div>
            )}
          </div>
        )}

        {/* ── PLAYLISTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "playlists" && (
          <div>
            {/* Import */}
            <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm cursor-pointer transition-all mb-4"
              style={{ background: "rgba(157,78,221,0.08)", border: "1px dashed rgba(157,78,221,0.35)", color: "#9D4EDD", fontFamily: "Rajdhani, sans-serif" }}>
              <Upload className="w-4 h-4" /> Import Playlist (.json or .m3u)
              <input ref={fileRef} type="file" accept=".json,.m3u,.m3u8" className="hidden" onChange={handleImport} />
            </label>

            {allPlaylists.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 rounded-2xl text-center"
                style={{ background: "rgba(18,18,32,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <Music2 className="w-10 h-10 mb-3" style={{ color: "#44445a" }} />
                <p className="text-sm font-semibold" style={{ color: "#ccccee" }}>No playlists yet</p>
                <p className="text-xs mt-1" style={{ color: "#666688" }}>Connect Google/Spotify or import a file</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allPlaylists.map(pl => {
                  const sourceColor = pl.source === "youtube" ? "#4285F4" : pl.source === "spotify" ? "#1DB954" : "#9D4EDD";
                  return (
                    <div key={pl.id} className="flex items-center gap-3 p-3.5 rounded-xl"
                      style={{ background: "rgba(18,18,32,0.7)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {pl.thumbnail
                        ? <img src={pl.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                            style={{ background: `${sourceColor}18` }}>
                            <Music2 className="w-5 h-5" style={{ color: sourceColor }} />
                          </div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>{pl.name || pl.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#666688" }}>
                          {pl.count || pl.songs?.length || 0} tracks ·{" "}
                          <span style={{ color: sourceColor }}>
                            {pl.source === "youtube" ? "YouTube" : pl.source === "spotify" ? "Spotify" : "Imported"}
                          </span>
                        </p>
                      </div>
                      <Link href="/playlists"
                        className="text-xs px-3 py-1.5 rounded-lg font-bold flex-shrink-0"
                        style={{ background: "rgba(255,0,60,0.08)", border: "1px solid rgba(255,0,60,0.15)", color: "#FF003C", fontFamily: "Rajdhani, sans-serif" }}>
                        Open
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AUTH FORM (not logged in)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.4em] uppercase mb-2" style={{ color: "#FF003C", fontFamily: "Orbitron, sans-serif" }}>✦ Rise from the shadows ✦</p>
          <h1 className="text-4xl font-black mb-2"
            style={{ fontFamily: "Orbitron, sans-serif", background: "linear-gradient(135deg, #FF003C, #9D4EDD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {mode === "login" ? "Enter the Gate" : "Join Arise"}
          </h1>
          <p className="text-sm" style={{ color: "#9999bb" }}>
            {mode === "login" ? "Sign in to access your playlists and history." : "Create an account to save everything across devices."}
          </p>
        </div>

        <div className="p-7 rounded-2xl" style={{ background: "rgba(10,10,20,0.95)", border: "1px solid rgba(255,0,60,0.12)", boxShadow: "0 0 60px rgba(255,0,60,0.04)" }}>

          {/* Auth type toggle */}
          <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            {[{ id: "email", label: "Email", icon: Mail }, { id: "phone", label: "Phone", icon: Phone }].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setAuthType(id); setIdentifier(""); }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: authType === id ? "rgba(255,0,60,0.15)" : "transparent",
                  border: authType === id ? "1px solid rgba(255,0,60,0.3)" : "1px solid transparent",
                  color: authType === id ? "#FF003C" : "#9999bb", fontFamily: "Rajdhani, sans-serif",
                }}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <Field icon={User} label="DISPLAY NAME" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            )}
            <Field icon={authType === "email" ? Mail : Phone} label={authType === "email" ? "EMAIL ADDRESS" : "PHONE NUMBER"}
              type={authType === "email" ? "email" : "tel"} value={identifier} onChange={e => setIdentifier(e.target.value)}
              placeholder={authType === "email" ? "you@example.com" : "+91 98765 43210"} />
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: "#9999bb", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.06em" }}>PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#666688" }} />
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,0,60,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(255,0,60,0.08)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#666688" }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #8B0000, #FF003C)", color: "white", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.08em", boxShadow: "0 0 24px rgba(255,0,60,0.4)" }}>
              <LogIn className="w-4 h-4" />
              {loading ? "One moment…" : mode === "login" ? "ENTER THE GATE" : "CREATE ACCOUNT"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-xs" style={{ color: "#444466" }}>or continue with</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* OAuth buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => { try { startGoogleLogin(); } catch(e) { toast.error(e.message); } }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.25)", color: "#4285F4", fontFamily: "Rajdhani, sans-serif" }}>
              <Chrome className="w-4 h-4" /> Google
            </button>
            <button
              onClick={() => { try { startSpotifyLogin(); } catch(e) { toast.error(e.message); } }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.25)", color: "#1DB954", fontFamily: "Rajdhani, sans-serif" }}>
              <SpotifyIcon size={14} /> Spotify
            </button>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs" style={{ color: "#666688" }}>
              {mode === "login" ? "No account yet?" : "Already have one?"}{" "}
              <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setPassword(""); setName(""); }}
                className="font-bold" style={{ color: "#FF003C" }}>
                {mode === "login" ? "Create Account" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
        <p className="text-center mt-4 text-xs" style={{ color: "#444466" }}>
          Email accounts verified via Resend · OAuth via Google &amp; Spotify
        </p>
      </div>
    </div>
  );
}
