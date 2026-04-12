"use client";
import { useMusicProvider } from "@/hooks/use-context";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Trash2, Volume2 } from "lucide-react";

export default function SettingsPage() {
  const { volume, changeVolume, recentlyPlayed } = useMusicProvider();
  const [cleared, setCleared] = useState(false);

  const clearHistory = () => {
    try {
      localStorage.removeItem("remix:recent");
      localStorage.removeItem("remix:last");
      setCleared(true);
      toast.success("History cleared!");
    } catch {}
  };

  const clearLikes = () => {
    try {
      localStorage.removeItem("remix:likes");
      toast.success("Liked songs cleared!");
    } catch {}
  };

  return (
    <div className="px-5 md:px-8 lg:px-10 py-8 max-w-xl">
      <h1 className="text-2xl font-black mb-8" style={{ fontFamily: "Orbitron, sans-serif", color: "#e8e8f8" }}>
        Settings
      </h1>

      <div className="space-y-4">

        {/* Volume */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "rgba(18,18,32,0.7)", border: "1px solid rgba(255,0,60,0.07)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-4 h-4" style={{ color: "#FF003C" }} />
            <p className="text-sm font-bold" style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif" }}>
              Default Volume — {Math.round(volume * 100)}%
            </p>
          </div>
          <Slider
            value={[volume]} max={1} step={0.05}
            onValueChange={(v) => changeVolume(v[0])}
            className="w-full"
          />
        </div>

        {/* Data */}
        <div
          className="p-5 rounded-2xl space-y-3"
          style={{ background: "rgba(18,18,32,0.7)", border: "1px solid rgba(255,0,60,0.07)" }}
        >
          <p className="text-sm font-bold mb-3" style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.1em", fontSize: "0.65rem" }}>
            DATA MANAGEMENT
          </p>
          {[
            { label: "Clear play history",  sub: `${recentlyPlayed.length} tracks`,  action: clearHistory },
            { label: "Clear liked songs",   sub: "Cannot be undone",                  action: clearLikes   },
          ].map(({ label, sub, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 text-left"
              style={{ background: "rgba(255,0,60,0.05)", border: "1px solid rgba(255,0,60,0.1)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,0,60,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,0,60,0.05)"}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "#ccccee", fontFamily: "Rajdhani, sans-serif" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "#8888aa" }}>{sub}</p>
              </div>
              <Trash2 className="w-4 h-4 flex-shrink-0" style={{ color: "#FF003C" }} />
            </button>
          ))}
        </div>

        {/* About */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "rgba(18,18,32,0.7)", border: "1px solid rgba(255,0,60,0.07)" }}
        >
          <p className="text-sm font-bold mb-2" style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.1em", fontSize: "0.65rem" }}>
            ABOUT
          </p>
          <p className="text-sm" style={{ color: "#8888aa", fontFamily: "Rajdhani, sans-serif" }}>
            Arise v2.0 · Built for educational purposes.<br />
            Powered by JioSaavn API · Music data © respective owners.
          </p>
          <p className="text-xs mt-3" style={{ color: "#44445a" }}>
            Keyboard shortcuts: Space (play/pause) · M (mute) · L (loop) · Shift+← / → (seek 10s)
          </p>
        </div>
      </div>
    </div>
  );
}
