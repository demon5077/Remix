"use client";
/**
 * UnifiedModal — Full-screen player.
 *
 * Desktop layout:
 * ┌──────────────────────┬─────────────────────┐
 * │  LEFT: Player        │  RIGHT: Queue/List   │
 * │  420px fixed width   │  flex-1 remainder    │
 * └──────────────────────┴─────────────────────┘
 *
 * Mobile: stacked, scrollable.
 *
 * YouTube audio: iframe lives in a FIXED container in YTProvider.
 * In audio mode: container is 1x1px off-screen, audio keeps playing.
 * In video mode: we position the container to cover the slot div using
 * showIframeOverElement() / hideIframeContainer() from use-youtube.
 */
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useMusicProvider } from "@/hooks/use-context";
import { useYT, showIframeOverElement, hideIframeContainer } from "@/hooks/use-youtube";
import { getUnifiedRecent } from "@/components/providers/music-provider";
import { getSongsSuggestions } from "@/lib/fetch";
import { getRelatedVideos, searchYT } from "@/lib/youtube";
import { muzoRelated, muzoSearch } from "@/lib/muzo";
import {
  ChevronDown, Repeat, Repeat1, Volume2, VolumeX,
  Download, Share2, Heart, Plus, X, SkipBack, SkipForward, Shuffle,
  Music2, Video, Play,
} from "lucide-react";
import { IoPause, IoPlay } from "react-icons/io5";
import Link from "next/link";
import { toast } from "sonner";

export default function UnifiedModal({ open, onClose, activeSource }) {
  const saavn = useMusicProvider() || {};
  const yt    = useYT() || {};

  // Auto-detect the correct tab from what is currently playing
  const computedTab = yt.currentVideo ? "yt" : (saavn.music ? "saavn" : "yt");
  const [tab, setTab] = useState(computedTab);
  const videoSlotRef             = useRef(null);

  // Saavn state
  const [saavnSugg,  setSaavnSugg] = useState([]);
  const [saavnLoad,  setSaavnLoad] = useState(false);
  const [saavnLiked, setSaavnLike] = useState(false);
  const [saavnTab,   setSaavnTab]  = useState("related");

  // YT state
  const [ytRelated,  setYtRelated] = useState([]);
  const [ytLoad,     setYtLoad]    = useState(false);
  const [ytLiked,    setYtLiked]   = useState(false);
  const [ytTab,      setYtTab]     = useState("queue");

  // Sync tab with source
  // Sync tab whenever playback source changes
  useEffect(() => {
    if (yt.currentVideo) setTab("yt");
    else if (saavn.music) setTab("saavn");
  }, [yt.currentVideo?.id, saavn.music]);
  
  useEffect(() => { if (activeSource) setTab(activeSource); }, [activeSource]);

  // ── Position iframe over the video slot ──────────────────────────
  // Uses ResizeObserver to fire once the slot element is actually painted.
  useEffect(() => {
    if (!open || tab !== "yt" || yt.ytMode !== "video") {
      hideIframeContainer();
      return;
    }

    let ro = null;
    let attempts = 0;

    function tryPosition() {
      const slot = videoSlotRef.current;
      if (!slot) {
        if (++attempts < 20) setTimeout(tryPosition, 50);
        return;
      }
      showIframeOverElement(slot);

      // Keep in sync on resize
      ro = new ResizeObserver(() => showIframeOverElement(slot));
      ro.observe(slot);
      window.addEventListener("resize", () => showIframeOverElement(slot));
    }

    const t = setTimeout(tryPosition, 80); // give React one tick to paint the slot

    return () => {
      clearTimeout(t);
      if (ro) ro.disconnect();
      hideIframeContainer();
    };
  }, [open, tab, yt.ytMode]);

  // ── Load data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!saavn.music || !open) return;
    setSaavnLoad(true);
    getSongsSuggestions(saavn.music, 20)
      .then(r => r.json())
      .then(d => {
        const songs = d?.data || [];
        setSaavnSugg(songs);
        saavn.setQueue(prev => prev.length === 0 ? songs.slice(0, 10) : prev);
        setSaavnLike(JSON.parse(localStorage.getItem("remix:likes") || "[]").includes(saavn.music));
      })
      .catch(() => {})
      .finally(() => setSaavnLoad(false));
  }, [saavn.music, open]);

  useEffect(() => {
    if (!yt.currentVideo || !open) return;
    setYtLoad(true);
    setYtRelated([]);
    // Try Muzo first (no API key needed), fall back to RapidAPI
    muzoRelated(yt.currentVideo.id).then(muzoItems => {
      if (muzoItems?.length) {
        const valid = muzoItems.filter(i => i.videoId || i.id).slice(0, 20).map(i => ({
          id:           i.videoId || i.id,
          title:        i.title   || i.name,
          channelTitle: i.artist  || i.channelTitle || "",
          thumbnail:    i.thumbnail || `https://i.ytimg.com/vi/${i.videoId || i.id}/mqdefault.jpg`,
          durationText: i.duration || "",
        }));
        setYtRelated(valid);
        if (valid.length > 0 && (yt.queue || []).length === 0) yt.setQueue?.(valid.slice(0, 8));
        setYtLiked(yt.isLiked?.(yt.currentVideo.id) || false);
        setYtLoad(false);
      } else {
        // Fallback to RapidAPI
        return getRelatedVideos(yt.currentVideo.id).then(({ items }) => {
          const valid = items.filter(Boolean).slice(0, 20);
          setYtRelated(valid);
          if (valid.length > 0 && (yt.queue || []).length === 0) yt.setQueue?.(valid.slice(0, 8));
          setYtLiked(yt.isLiked?.(yt.currentVideo.id) || false);
          setYtLoad(false);
        });
      }
    }).catch(() => setYtLoad(false));
  }, [yt.currentVideo?.id, open]);

  // ── When Saavn tab + video mode: find YT song and play audio ─────
  const [saavnYtSearching, setSaavnYtSearching] = useState(false);
  const findYtForSaavn = async () => {
    if (!saavn.songData) return;
    const q = `${saavn.songData.name} ${saavn.songData.artists?.primary?.[0]?.name || ""} official`;
    setSaavnYtSearching(true);
    // Try Muzo first
    const muzoItems = await muzoSearch(q, "songs", 3).catch(() => []);
    if (muzoItems?.length) {
      const first = muzoItems[0];
      const vid   = { id: first.videoId || first.id, title: first.title, channelTitle: (first.artists || []).map(a => a.name || a).join(", "), thumbnail: first.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${first.videoId || first.id}/mqdefault.jpg` };
      yt.playVideo(vid);
      setSaavnYtSearching(false);
      setTab("yt");
      toast("🎬 Opened YouTube version");
      return;
    }
    const { items } = await searchYT(q, "video");
    setSaavnYtSearching(false);
    if (items?.[0]) {
      yt.playVideo(items[0]);
      setTab("yt");
      toast("🎬 Opened YouTube version");
    } else {
      toast.error("YouTube version not found");
    }
  };

  // ── Actions ─────────────────────────────────────────────────────
  const toggleSaavnLike = () => {
    try {
      const likes = JSON.parse(localStorage.getItem("remix:likes") || "[]");
      const next  = saavnLiked ? likes.filter(id => id !== saavn.music) : [...likes, saavn.music];
      localStorage.setItem("remix:likes", JSON.stringify(next));
      setSaavnLike(!saavnLiked);
      toast(!saavnLiked ? "❤️ Added to Liked" : "Removed from Liked");
    } catch {}
  };

  const toggleYtLike = () => {
    if (!yt.currentVideo) return;
    yt.toggleLike(yt.currentVideo);
    setYtLiked(!ytLiked);
    toast(!ytLiked ? "❤️ Added to Liked" : "Removed from Liked");
  };

  const downloadSaavn = async () => {
    if (!saavn.audioURL) return;
    try {
      toast("Downloading from the depths…");
      const blob = await fetch(saavn.audioURL).then(r => r.blob());
      Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `${saavn.songData?.name || "song"}.mp3`,
      }).click();
      toast.success("Extracted from the void!");
    } catch { toast.error("Download failed"); }
  };

  const playSaavnNext = () => {
    const [next, ...rest] = saavn.queue;
    if (next) { saavn.setQueue(rest); saavn.playSong(next?.id || next); }
    else if (saavnSugg[0]) saavn.playSong(saavnSugg[0].id);
  };

  const playSaavnPrev = () => {
    if (saavn.currentTime > 3) { saavn.seek(0); return; }
    if (saavn.recentlyPlayed?.length > 1) saavn.playSong(saavn.recentlyPlayed[1].id);
  };

  const seekSaavn = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    saavn.seek(((e.clientX - rect.left) / rect.width) * (saavn.duration || 0));
  }, [saavn.seek, saavn.duration]);

  if (!open) return null;

  const hasSaavn  = !!saavn.music;
  const hasYT     = !!yt.currentVideo;
  const bgImg     = tab === "saavn"
    ? (saavn.songData?.image?.[2]?.url || "")
    : (yt.currentVideo?.thumbnail || "");

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "rgba(2,2,8,0.98)" }}>

      {/* ── Ambient bg ─────────────────────────────────────────── */}
      {bgImg && (
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "blur(80px) saturate(2)", opacity: 0.06,
          }} />
      )}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(139,0,0,0.08) 0%, rgba(2,2,8,0.85) 100%)" }} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 h-14 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,0,60,0.08)" }}>

        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: "rgba(255,0,60,0.1)", border: "1px solid rgba(255,0,60,0.2)", color: "#FF003C" }}>
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* Source tabs — only when both are active */}
        {hasSaavn && hasYT ? (
          <div className="flex rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
            <TabBtn active={tab === "saavn"} onClick={() => setTab("saavn")} color="#FF003C">
              <Music2 className="w-3 h-3" /> Saavn
            </TabBtn>
            <TabBtn active={tab === "yt"} onClick={() => setTab("yt")} color="#FF4444">
              <Video className="w-3 h-3" /> YouTube
            </TabBtn>
          </div>
        ) : (
          <p className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)", fontFamily: "Orbitron, sans-serif" }}>
            {tab === "yt" ? "— YouTube —" : "— Now Playing —"}
          </p>
        )}

        {/* Like */}
        <button onClick={tab === "saavn" ? toggleSaavnLike : toggleYtLike}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: (tab === "saavn" ? saavnLiked : ytLiked) ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "var(--border-subtle)",
            border:     (tab === "saavn" ? saavnLiked : ytLiked) ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.08)",
            color:      (tab === "saavn" ? saavnLiked : ytLiked) ? "#FF003C" : "var(--text-faint)",
          }}>
          <Heart className={`w-4 h-4 ${(tab === "saavn" ? saavnLiked : ytLiked) ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* ── Body: LEFT player + RIGHT queue ────────────────────── */}
      <div className="relative z-10 flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

        {/* ══════ LEFT PANEL ══════ */}
        <div className="flex flex-col lg:w-[440px] xl:w-[500px] flex-shrink-0 px-6 sm:px-10 pt-6 pb-4 overflow-y-auto lg:border-r"
          style={{ borderColor: "color-mix(in srgb, var(--accent) 7%, transparent)" }}>

          {/* ── SAAVN ── */}
          {tab === "saavn" && (
            <>
              {/* Album art */}
              <div className="flex justify-center mb-6 flex-shrink-0">
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden"
                  style={{
                    boxShadow: saavn.playing
                      ? "0 0 60px rgba(255,0,60,0.5), 0 8px 40px rgba(0,0,0,0.8)"
                      : "0 8px 40px rgba(0,0,0,0.8)",
                    transition: "box-shadow 0.5s",
                  }}>
                  {saavn.isLoading
                    ? <div className="remix-shimmer w-full h-full" />
                    : <img src={saavn.songData?.image?.[2]?.url || ""} alt={saavn.songData?.name || ""}
                        className="w-full h-full object-cover"
                        style={{ border: "2px solid rgba(255,0,60,0.2)" }} />
                  }
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start justify-between gap-3 mb-4 flex-shrink-0">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-black truncate"
                    style={{ color: "#f0f0ff", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.02em" }}>
                    {saavn.songData?.name || "Summoning…"}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Link href={`/search/${encodeURIComponent(saavn.songData?.artists?.primary?.[0]?.name || "")}`}
                      className="text-sm font-semibold transition-colors" style={{ color: "#FF003C" }} onClick={onClose}>
                      {saavn.songData?.artists?.primary?.[0]?.name || ""}
                    </Link>
                    {saavn.songData?.album?.name && (
                      <><span style={{ color: "var(--text-faint)" }}>·</span>
                      <span className="text-xs truncate max-w-[160px]" style={{ color: "var(--text-muted)" }}>
                        {saavn.songData.album.name}
                      </span></>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                  <BtnRound onClick={downloadSaavn} title="Download to your realm"><Download className="w-4 h-4" /></BtnRound>
                  <BtnRound onClick={() => {
                    const url = `${window.location.origin}/${saavn.music}`;
                    navigator.share?.({ url }) || navigator.clipboard?.writeText(url);
                    toast("Link cast into the void!");
                  }} title="Share"><Share2 className="w-4 h-4" /></BtnRound>
                  {/* Watch on YouTube */}
                  <BtnRound onClick={findYtForSaavn} title="Watch on YouTube" loading={saavnYtSearching}>
                    <Video className="w-4 h-4" style={{ color: "#FF4444" }} />
                  </BtnRound>
                </div>
              </div>

              {/* Seek bar */}
              <SeekBar progress={saavn.progress} onClick={seekSaavn}
                timeLeft={saavn.formatTime(saavn.currentTime)} timeRight={saavn.formatTime(saavn.duration)} />

              {/* Transport */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <CtrlBtn onClick={saavn.toggleLoop} active={saavn.isLooping} activeColor="#FF003C">
                  {saavn.isLooping ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                </CtrlBtn>
                <CtrlBtn onClick={playSaavnPrev}><SkipBack className="w-5 h-5" /></CtrlBtn>
                <BigPlayBtn playing={saavn.playing} onClick={saavn.togglePlay} />
                <CtrlBtn onClick={playSaavnNext}><SkipForward className="w-5 h-5" /></CtrlBtn>
                <CtrlBtn onClick={saavn.toggleMute} active={saavn.muted}>
                  {saavn.muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </CtrlBtn>
              </div>

              {/* Volume */}
              <VolumeSlider
                value={saavn.muted ? 0 : saavn.volume}
                muted={saavn.muted}
                onChange={v => saavn.changeVolume(v)}
                onToggle={saavn.toggleMute}
              />
            </>
          )}

          {/* ── YOUTUBE ── */}
          {tab === "yt" && (
            <>
              {/* Audio/Video mode toggle */}
              <div className="flex justify-center mb-4 flex-shrink-0">
                <div className="flex rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
                  <TabBtn active={yt.ytMode === "audio"} onClick={() => { yt.setYtMode("audio"); hideIframeContainer(); }} color="#FF003C">
                    <Music2 className="w-3 h-3" /> Audio Only
                  </TabBtn>
                  <TabBtn active={yt.ytMode === "video"} onClick={() => yt.setYtMode("video")} color="#FF4444">
                    <Video className="w-3 h-3" /> Video
                  </TabBtn>
                </div>
              </div>

              {/* Video slot — iframe gets positioned OVER this via CSS */}
              {yt.ytMode === "video" && (
                <div
                  ref={videoSlotRef}
                  className="w-full rounded-xl flex-shrink-0 mb-4 bg-black overflow-hidden"
                  style={{ aspectRatio: "16/9", minHeight: "160px" }}
                />
              )}

              {/* Audio mode: thumbnail */}
              {yt.ytMode === "audio" && (
                <div className="flex justify-center mb-5 flex-shrink-0">
                  <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-2xl overflow-hidden"
                    style={{
                      boxShadow: "0 0 50px rgba(255,30,0,0.4), 0 8px 40px rgba(0,0,0,0.8)",
                      border:    "2px solid rgba(255,30,0,0.2)",
                    }}>
                    <img src={yt.currentVideo?.thumbnail} alt={yt.currentVideo?.title}
                      className="w-full h-full object-cover" />
                    {/* Audio-only overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.55)" }}>
                      <Music2 className="w-10 h-10 mb-2" style={{ color: "rgba(255,255,255,0.5)" }} />
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Orbitron, sans-serif" }}>
                        Audio Only
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* YT Info */}
              <div className="flex items-start justify-between gap-2 mb-4 flex-shrink-0">
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl font-black leading-snug line-clamp-2"
                    style={{ color: "#f0f0ff", fontFamily: "Rajdhani, sans-serif" }}>
                    {yt.currentVideo?.title || ""}
                  </p>
                  <p className="text-sm mt-1 truncate" style={{ color: "var(--text-muted)" }}>
                    {yt.currentVideo?.channelTitle || ""}
                  </p>
                </div>
              </div>

              {/* YT progress bar — real-time from ytProgress, seekable via ytSeek */}
              <div className="mb-4 flex-shrink-0">
                <div
                  className="relative w-full h-1.5 rounded-full cursor-pointer group"
                  style={{ background: "var(--border-subtle)" }}
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    if (yt.ytSeek && yt.ytDuration > 0) yt.ytSeek(pct * yt.ytDuration);
                  }}
                >
                  <div
                    className="h-full rounded-full transition-none"
                    style={{
                      width:      `${yt.ytProgress || 0}%`,
                      background: "linear-gradient(to right, #8B0000, #FF003C, #FF4444)",
                      boxShadow:  "0 0 6px rgba(255,0,60,0.4)",
                    }}
                  />
                  {/* Thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      left:       `calc(${yt.ytProgress || 0}% - 7px)`,
                      background: "#FF4444",
                      boxShadow:  "0 0 6px #FF4444",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span style={{ color: "var(--text-muted)", fontFamily: "Orbitron, sans-serif", fontSize: "0.55rem" }}>
                    {yt.ytFormatTime ? yt.ytFormatTime(yt.ytCurrentTime || 0) : "0:00"}
                  </span>
                  <span style={{ color: "var(--text-faint)", fontFamily: "Orbitron, sans-serif", fontSize: "0.55rem" }}>
                    {yt.ytFormatTime && yt.ytDuration > 0
                      ? yt.ytFormatTime(yt.ytDuration)
                      : (yt.currentVideo?.durationText || "")}
                  </span>
                </div>
              </div>

              {/* YT transport */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <CtrlBtn onClick={yt.toggleShuffle} active={yt.shuffle} activeColor="#FF003C">
                  <Shuffle className="w-5 h-5" />
                </CtrlBtn>
                <CtrlBtn onClick={yt.prev}><SkipBack className="w-5 h-5" /></CtrlBtn>
                <BigPlayBtn playing={yt.playing} onClick={yt.togglePlay} />
                <CtrlBtn onClick={yt.next} dimmed={yt.queue.length === 0}><SkipForward className="w-5 h-5" /></CtrlBtn>
                <CtrlBtn onClick={() => {
                  const modes = ["none","one","all"];
                  yt.setRepeat(modes[(modes.indexOf(yt.repeat)+1) % modes.length]);
                }} active={yt.repeat !== "none"} activeColor="#FF003C">
                  {yt.repeat === "one" ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                </CtrlBtn>
              </div>
            </>
          )}
        </div>

        {/* ══════ RIGHT PANEL: Queue / Related ══════ */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Tab bar */}
          <div className="flex gap-1.5 px-5 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,0,60,0.06)" }}>
            {(tab === "saavn" ? ["related","queue","recent"] : ["queue","related"]).map(t => (
              <button key={t}
                onClick={() => tab === "saavn" ? setSaavnTab(t) : setYtTab(t)}
                className="px-3 py-1.5 rounded-full transition-all"
                style={{
                  fontFamily: "Orbitron, sans-serif", fontSize: "0.55rem",
                  fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                  background: (tab === "saavn" ? saavnTab : ytTab) === t ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent",
                  border:     (tab === "saavn" ? saavnTab : ytTab) === t ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  color:      (tab === "saavn" ? saavnTab : ytTab) === t ? "#FF003C" : "var(--text-faint)",
                }}>
                {t === "queue"
                  ? `Queue (${tab === "saavn" ? saavn.queue.length : yt.queue.length})`
                  : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">

            {tab === "saavn" && saavnTab === "related" && (
              <>
                {saavnLoad && <Shimmer />}
                {!saavnLoad && saavnSugg.length === 0 && <EmptyState text="No souls found in the void" />}
                {!saavnLoad && saavnSugg.map(s => (
                  <SongRow key={s.id} image={s.image?.[1]?.url} name={s.name}
                    artist={s.artists?.primary?.[0]?.name} isCurrent={s.id === saavn.music}
                    onPlay={() => saavn.playSong(s.id)}
                    onQueue={() => saavn.setQueue(prev =>
                      prev.find(q => (q?.id||q) === s.id) ? prev : [...prev, s])} />
                ))}
              </>
            )}

            {tab === "saavn" && saavnTab === "queue" && (
              <>
                {saavn.queue.length === 0 && <EmptyState text="The queue lies empty — add souls to fill it" />}
                {saavn.queue.map((item, i) => {
                  const id   = item?.id || item;
                  const sugg = saavnSugg.find(s => s.id === id);
                  return (
                    <SongRow key={`q-${id}-${i}`}
                      image={sugg?.image?.[1]?.url || item?.image?.[1]?.url}
                      name={sugg?.name || item?.name || id}
                      artist={sugg?.artists?.primary?.[0]?.name || item?.artists?.primary?.[0]?.name}
                      isCurrent={id === saavn.music} index={i+1}
                      onPlay={() => {
                        const rest = [...saavn.queue]; rest.splice(i,1);
                        saavn.setQueue(rest); saavn.playSong(id);
                      }} />
                  );
                })}
              </>
            )}

            {tab === "saavn" && saavnTab === "recent" && (() => {
              const recentAll = getUnifiedRecent().slice(0, 25);
              return (
                <>
                  {recentAll.length === 0 && <EmptyState text="Your past is as dark as the void — play something" />}
                  {recentAll.map((item, i) => {
                    const ytId = item.ytId || (/^[A-Za-z0-9_-]{11}$/.test(item.id||"") ? item.id : null);
                    const thumb = item.thumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg` : null);
                    return (
                      <SongRow key={`rec-${i}`} image={thumb}
                        name={item.name || item.title || "Unknown"} artist={item.artist || ""}
                        isCurrent={ytId === yt.currentVideo?.id}
                        onPlay={() => {
                          if (ytId) yt.playVideo({ id: ytId, title: item.name||item.title, channelTitle: item.artist, thumbnail: thumb });
                        }} />
                    );
                  })}
                </>
              );
            })()}

            {tab === "yt" && ytTab === "queue" && (
              <>
                {yt.queue.length === 0 && <EmptyState text="Queue is barren — summon videos with +" />}
                {yt.queue.map((item, i) => item && (
                  <YTRow key={`ytq-${item.id}-${i}`} item={item}
                    isActive={yt.currentVideo?.id === item.id} index={i+1}
                    onPlay={() => { yt.setQueue(yt.queue.filter((_,j) => j!==i)); yt.playVideo(item); }}
                    onRemove={() => yt.removeFromQueue(i)} />
                ))}
              </>
            )}

            {tab === "yt" && ytTab === "related" && (
              <>
                {ytLoad && <Shimmer />}
                {!ytLoad && ytRelated.length === 0 && <EmptyState text="No related souls found" />}
                {!ytLoad && ytRelated.map(item => item && (
                  <YTRow key={`ytr-${item.id}`} item={item}
                    isActive={yt.currentVideo?.id === item.id}
                    onPlay={() => yt.playVideo(item)}
                    onQueue={() => { yt.addToQueue(item); toast("Added to the queue of the damned"); }} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small reusable components ─────────────────────────────────────────────────

function TabBtn({ active, onClick, color, children }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all"
      style={{
        fontFamily:  "Orbitron, sans-serif", letterSpacing: "0.08em",
        background:  active ? `${color}22` : "transparent",
        color:       active ? color : "var(--text-faint)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>
      {children}
    </button>
  );
}

function BtnRound({ onClick, title, loading, children }) {
  return (
    <button onClick={onClick} title={title}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
      style={{ color: loading ? "#FF003C" : "var(--text-faint)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {children}
    </button>
  );
}

function CtrlBtn({ onClick, active, activeColor = "#FF003C", dimmed, children }) {
  return (
    <button onClick={onClick}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
      style={{
        color:      active ? activeColor : dimmed ? "var(--text-faint)" : "var(--text-muted)",
        background: active ? `${activeColor}18` : "transparent",
        border:     active ? `1px solid ${activeColor}44` : "1px solid rgba(255,255,255,0.06)",
      }}>
      {children}
    </button>
  );
}

function BigPlayBtn({ playing, onClick }) {
  return (
    <button onClick={onClick}
      className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
      style={{
        background: "linear-gradient(135deg, #8B0000, #FF003C)",
        boxShadow:  playing
          ? "0 0 35px rgba(255,0,60,0.7), 0 0 70px rgba(255,0,60,0.3)"
          : "0 0 18px rgba(255,0,60,0.3)",
        transition: "box-shadow 0.3s",
      }}>
      {playing
        ? <IoPause className="w-7 h-7 text-white" />
        : <IoPlay  className="w-7 h-7 text-white ml-1" />}
    </button>
  );
}

function SeekBar({ progress, onClick, timeLeft, timeRight }) {
  return (
    <div className="mb-4 flex-shrink-0">
      <div className="relative w-full h-1.5 rounded-full cursor-pointer group"
        style={{ background: "var(--border-subtle)" }} onClick={onClick}>
        <div className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
          style={{
            width:      `${progress}%`,
            background: "linear-gradient(to right, #8B0000, #FF003C, #9D4EDD)",
            boxShadow:  "0 0 8px rgba(255,0,60,0.6)",
            transition: "width 0.1s linear",
          }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 7px)`, background: "#FF003C", boxShadow: "0 0 10px rgba(255,0,60,0.9)" }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span style={{ color: "var(--text-muted)", fontFamily: "Orbitron, sans-serif", fontSize: "0.58rem" }}>{timeLeft}</span>
        <span style={{ color: "var(--text-muted)", fontFamily: "Orbitron, sans-serif", fontSize: "0.58rem" }}>{timeRight}</span>
      </div>
    </div>
  );
}

function VolumeSlider({ value, muted, onChange, onToggle }) {
  return (
    <div className="flex items-center gap-3 mb-2 flex-shrink-0">
      <button onClick={onToggle}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
        style={{ color: muted ? "var(--text-faint)" : "var(--text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {muted || value === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
      <div className="flex-1 relative h-1.5 rounded-full cursor-pointer group"
        style={{ background: "var(--border-subtle)" }}
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          onChange((e.clientX - rect.left) / rect.width);
        }}>
        <div className="h-full rounded-full"
          style={{
            width:      `${value * 100}%`,
            background: "linear-gradient(to right, #7C3AED, #9D4EDD)",
            transition: "width 0.1s",
          }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${value * 100}% - 7px)`, background: "#9D4EDD" }} />
      </div>
    </div>
  );
}

function SongRow({ image, name, artist, isCurrent, index, onPlay, onQueue }) {
  return (
    <button onClick={onPlay}
      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all duration-200 group"
      style={{
        background: isCurrent ? "rgba(255,0,60,0.1)" : "var(--bg-card)",
        border:     isCurrent ? "1px solid rgba(255,0,60,0.25)" : "1px solid rgba(255,255,255,0.04)",
      }}
      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = "var(--bg-card-hover)"; }}
      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "var(--bg-card)"; }}>
      {index !== undefined && (
        <span className="w-5 text-center text-[0.55rem] flex-shrink-0"
          style={{ color: isCurrent ? "#FF003C" : "var(--text-faint)", fontFamily: "Orbitron, sans-serif" }}>
          {isCurrent ? "▶" : index}
        </span>
      )}
      <img src={image || ""} alt={name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        style={{ background: "var(--bg-card)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate"
          style={{ color: isCurrent ? "#FF003C" : "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>{name}</p>
        {artist && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{artist}</p>}
      </div>
      {onQueue && (
        <button onClick={e => { e.stopPropagation(); onQueue(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "#9D4EDD", border: "1px solid rgba(157,78,221,0.3)" }}>
          <Plus className="w-3 h-3" />
        </button>
      )}
    </button>
  );
}

function YTRow({ item, isActive, index, onPlay, onQueue, onRemove }) {
  // Always ensure thumbnail — fallback to i.ytimg.com if missing
  const thumb = item.thumbnail || (item.id ? `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg` : "");
  return (
    <button onClick={onPlay}
      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all duration-200 group"
      style={{
        background: isActive ? "rgba(255,30,0,0.1)" : "var(--bg-card)",
        border:     isActive ? "1px solid rgba(255,30,0,0.25)" : "1px solid rgba(255,255,255,0.04)",
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-card-hover)"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-card)"; }}>
      {index !== undefined && (
        <span className="w-5 text-center text-[0.55rem] flex-shrink-0"
          style={{ color: isActive ? "#FF4444" : "var(--text-faint)", fontFamily: "Orbitron, sans-serif" }}>
          {isActive ? "▶" : index}
        </span>
      )}
      <img src={thumb} alt={item.title}
        className="w-[56px] h-[32px] rounded object-cover flex-shrink-0"
        style={{ background: "var(--bg-card)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold line-clamp-1"
          style={{ color: isActive ? "#FF4444" : "var(--text-secondary)", fontFamily: "Rajdhani, sans-serif" }}>{item.title}</p>
        <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{item.channelTitle}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {onQueue && (
          <button onClick={e => { e.stopPropagation(); onQueue(); }}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ color: "#9D4EDD", border: "1px solid rgba(157,78,221,0.3)" }}>
            <Plus className="w-3 h-3" />
          </button>
        )}
        {onRemove && (
          <button onClick={e => { e.stopPropagation(); onRemove(); }}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ color: "#FF4444", border: "1px solid rgba(255,30,0,0.3)" }}>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </button>
  );
}

function Shimmer() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: "var(--bg-card)" }}>
          <div className="remix-shimmer w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="remix-shimmer h-3 w-4/5 rounded" />
            <div className="remix-shimmer h-2.5 w-3/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-xs leading-relaxed max-w-[200px]" style={{ color: "var(--text-faint)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.04em" }}>
        {text}
      </p>
    </div>
  );
}
