"use client";
/**
 * YTPlayer — embeds YouTube iframe + shows queue/related.
 * Lives in the right sidebar panel on desktop, or as bottom sheet on mobile.
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { useYT } from "@/hooks/use-youtube";
import { getRelatedVideos } from "@/lib/youtube";
import {
  SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Heart, Plus, X, List, PlayCircle, ChevronDown,
} from "lucide-react";
import { IoPause, IoPlay } from "react-icons/io5";
import { toast } from "sonner";

export default function YTPlayer({ onClose }) {
  const {
    currentVideo, playing, queue, history,
    togglePlay, next, prev, addToQueue, setQueue,
    removeFromQueue, toggleShuffle, shuffle,
    setRepeat, repeat, stop,
    toggleLike, isLiked, getLiked,
  } = useYT();

  const [related,      setRelated]      = useState([]);
  const [loadingRel,   setLoadingRel]   = useState(false);
  const [activeTab,    setActiveTab]    = useState("queue"); // queue | related
  const [liked,        setLiked]        = useState(false);
  const iframeRef = useRef(null);

  // Load related videos when track changes
  useEffect(() => {
    if (!currentVideo) return;
    setLiked(isLiked(currentVideo.id));
    setLoadingRel(true);
    getRelatedVideos(currentVideo.id).then(({ items }) => {
      const valid = items.filter(Boolean).slice(0, 20);
      setRelated(valid);
      // Auto-fill queue if empty
      if (valid.length > 0 && queue.length === 0) {
        setQueue(valid.slice(0, 8));
      }
      setLoadingRel(false);
    });
  }, [currentVideo?.id]);

  const handleLike = () => {
    if (!currentVideo) return;
    toggleLike(currentVideo);
    setLiked(prev => !prev);
    toast(liked ? "Removed from Liked" : "❤️ Added to Liked");
  };

  const cycleRepeat = () => {
    const modes = ["none", "one", "all"];
    const idx   = modes.indexOf(repeat);
    setRepeat(modes[(idx + 1) % modes.length]);
  };

  if (!currentVideo) return null;

  const TABS = ["queue", "related"];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "rgba(5,5,10,0.98)" }}>

      {/* Close button (mobile modal only) */}
      {onClose && (
        <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif" }}>Now Playing</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,0,60,0.1)", border: "1px solid rgba(255,0,60,0.2)", color: "#FF003C" }}>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── YouTube iframe ────────────────────────────── */}
      <div className="flex-shrink-0 w-full aspect-video bg-black relative">
        <iframe
          ref={iframeRef}
          key={currentVideo.id}
          src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
          title={currentVideo.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      {/* ── Song info + controls ──────────────────────── */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2"
        style={{ borderBottom: "1px solid rgba(255,0,60,0.06)" }}>

        {/* Title + like */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-snug line-clamp-2"
              style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>
              {currentVideo.title}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "#8888aa" }}>{currentVideo.channelTitle}</p>
          </div>
          <button onClick={handleLike}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
            style={{
              background: liked ? "rgba(255,0,60,0.15)" : "rgba(255,255,255,0.05)",
              border:     liked ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color:      liked ? "#FF003C" : "#44445a",
            }}>
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-between">
          {/* Shuffle */}
          <button onClick={toggleShuffle}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ color: shuffle ? "#FF003C" : "#44445a", background: shuffle ? "rgba(255,0,60,0.08)" : "transparent" }}>
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          {/* Prev */}
          <button onClick={prev}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ color: history.length > 0 ? "#8888aa" : "#2a2a3a" }}>
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play/Pause — note: iframe controls playback, this is visual only */}
          <button
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "linear-gradient(135deg, #8B0000, #FF003C)",
              boxShadow:  "0 0 18px rgba(255,0,60,0.5)",
            }}
            onClick={() => {
              // We can't control iframe playback directly without YT API JS
              // This button is intentionally a visual indicator
              toast("Use the video controls to play/pause", { duration: 2000 });
            }}
          >
            <IoPlay className="w-5 h-5 text-white ml-0.5" />
          </button>

          {/* Next */}
          <button onClick={next}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ color: queue.length > 0 ? "#8888aa" : "#2a2a3a" }}>
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Repeat */}
          <button onClick={cycleRepeat}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ color: repeat !== "none" ? "#FF003C" : "#44445a", background: repeat !== "none" ? "rgba(255,0,60,0.08)" : "transparent" }}>
            {repeat === "one" ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Queue / Related tabs ──────────────────────── */}
      <div className="flex gap-1 px-4 pt-3 pb-2 flex-shrink-0">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-3 py-1 rounded-full text-[0.58rem] font-bold uppercase tracking-widest transition-all"
            style={{
              fontFamily: "Orbitron, sans-serif",
              background: activeTab === tab ? "rgba(255,0,60,0.15)" : "transparent",
              border:     activeTab === tab ? "1px solid rgba(255,0,60,0.3)" : "1px solid rgba(255,255,255,0.06)",
              color:      activeTab === tab ? "#FF003C" : "#44445a",
            }}>
            {tab === "queue" ? `Queue (${queue.length})` : "Related"}
          </button>
        ))}
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">

        {/* Queue */}
        {activeTab === "queue" && (
          <>
            {queue.length === 0 && (
              <p className="text-xs text-center py-8" style={{ color: "#44445a" }}>
                Queue empty — add videos with the + button
              </p>
            )}
            {queue.map((item, i) => item && (
              <YTQueueRow
                key={item.id + i}
                item={item}
                index={i}
                onPlay={() => {
                  const rest = [...queue];
                  rest.splice(i, 1);
                  setQueue(rest);
                  const { playVideo } = useYT();
                  // Can't call hook in callback, use a workaround
                }}
                onRemove={() => removeFromQueue(i)}
                isActive={currentVideo?.id === item.id}
              />
            ))}
          </>
        )}

        {/* Related */}
        {activeTab === "related" && (
          <>
            {loadingRel && (
              <div className="space-y-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-2 p-2 rounded-xl" style={{ background: "rgba(18,18,32,0.4)" }}>
                    <div className="remix-shimmer w-16 h-9 rounded-md flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="remix-shimmer h-3 w-3/4 rounded" />
                      <div className="remix-shimmer h-2.5 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loadingRel && related.map((item) => item && (
              <YTRelatedRow key={item.id} item={item} isActive={currentVideo?.id === item.id} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function YTQueueRow({ item, index, onRemove, isActive }) {
  const { playVideo } = useYT();
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all duration-200"
      style={{
        background: isActive ? "rgba(255,0,60,0.1)" : "rgba(18,18,32,0.5)",
        border:     isActive ? "1px solid rgba(255,0,60,0.25)" : "1px solid rgba(255,255,255,0.04)",
      }}
      onClick={() => playVideo(item)}
    >
      <span className="w-4 text-center text-[0.58rem] flex-shrink-0"
        style={{ color: isActive ? "#FF003C" : "#44445a", fontFamily: "Orbitron, sans-serif" }}>
        {isActive ? "▶" : index + 1}
      </span>
      <img src={item.thumbnail} alt={item.title}
        className="w-[52px] h-[29px] rounded object-cover flex-shrink-0"
        style={{ background: "rgba(18,18,32,0.8)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold line-clamp-1" style={{ color: isActive ? "#FF003C" : "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>{item.title}</p>
        <p className="text-[10px] truncate" style={{ color: "#8888aa" }}>{item.channelTitle}</p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: "#FF003C" }}>
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function YTRelatedRow({ item, isActive }) {
  const { playVideo, addToQueue } = useYT();
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all duration-200 group"
      style={{
        background: isActive ? "rgba(255,0,60,0.1)" : "rgba(18,18,32,0.5)",
        border:     isActive ? "1px solid rgba(255,0,60,0.25)" : "1px solid rgba(255,255,255,0.04)",
      }}
      onClick={() => playVideo(item)}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(24,24,40,0.9)"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "rgba(18,18,32,0.5)"; }}
    >
      <div className="relative flex-shrink-0">
        <img src={item.thumbnail} alt={item.title}
          className="w-[52px] h-[29px] rounded object-cover"
          style={{ background: "rgba(18,18,32,0.8)" }} />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <IoPlay className="w-3 h-3 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold line-clamp-1" style={{ color: isActive ? "#FF003C" : "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>{item.title}</p>
        <p className="text-[10px] truncate" style={{ color: "#8888aa" }}>{item.channelTitle}</p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); addToQueue(item); toast("Added to queue"); }}
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "#FF003C" }}>
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}
