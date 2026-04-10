"use client";
import { useState } from "react";
import { useYT } from "@/hooks/use-youtube";
import { IoPlay } from "react-icons/io5";
import { SkipForward, X, ChevronUp } from "lucide-react";
import YTPlayer from "./yt-player";

/**
 * YTMiniBar — shown on mobile when a YT video is active.
 * On desktop the player is shown in the sidebar panel.
 */
export default function YTMiniBar() {
  const { currentVideo, next, stop, queue } = useYT();
  const [open, setOpen] = useState(false);

  if (!currentVideo) return null;

  return (
    <>
      {/* Full-screen modal */}
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" style={{ background: "rgba(0,0,0,0.97)" }}>
          <YTPlayer onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Mini bar */}
      <div
        className="lg:hidden fixed left-0 right-0 z-50"
        style={{
          bottom: "124px", // above Saavn mini player + mobile nav
          background: "rgba(5,5,10,0.97)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,0,0,0.15)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center px-3 h-14 gap-3">
          <button className="flex items-center gap-2.5 flex-1 min-w-0" onClick={() => setOpen(true)}>
            <img src={currentVideo.thumbnail} alt={currentVideo.title}
              className="w-9 h-9 rounded object-cover flex-shrink-0"
              style={{ border: "1px solid rgba(255,0,0,0.3)" }} />
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold truncate" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif", maxWidth: "140px" }}>
                {currentVideo.title}
              </p>
              <p className="text-[10px] truncate" style={{ color: "#8888aa" }}>{currentVideo.channelTitle}</p>
            </div>
            <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "#44445a" }} />
          </button>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={next} disabled={queue.length === 0}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ color: queue.length > 0 ? "#8888aa" : "#2a2a3a" }}>
              <SkipForward className="w-4 h-4" />
            </button>
            <button onClick={stop}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ color: "#44445a" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#FF003C"; e.currentTarget.style.background = "rgba(255,0,60,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#44445a"; e.currentTarget.style.background = "transparent"; }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
