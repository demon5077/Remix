"use client";
import { useEffect, useState } from "react";
import { getTheme } from "@/lib/theme";

const DARK_ORBS = [
  { cx: "10%", cy: "20%", r: 300, color: "rgba(139,0,0,0.06)",    dur: "18s", delay: "0s"  },
  { cx: "80%", cy: "70%", r: 250, color: "rgba(124,58,237,0.05)",  dur: "22s", delay: "4s"  },
  { cx: "50%", cy: "50%", r: 200, color: "rgba(255,0,60,0.03)",    dur: "15s", delay: "8s"  },
  { cx: "30%", cy: "80%", r: 180, color: "rgba(157,78,221,0.04)",  dur: "20s", delay: "2s"  },
  { cx: "70%", cy: "10%", r: 220, color: "rgba(139,0,0,0.05)",     dur: "25s", delay: "6s"  },
];

const LIGHT_ORBS = [
  { cx: "10%", cy: "20%", r: 350, color: "rgba(255,215,0,0.10)",   dur: "18s", delay: "0s"  },
  { cx: "80%", cy: "70%", r: 280, color: "rgba(212,175,55,0.08)",   dur: "22s", delay: "4s"  },
  { cx: "50%", cy: "50%", r: 220, color: "rgba(255,200,0,0.06)",    dur: "15s", delay: "8s"  },
  { cx: "30%", cy: "80%", r: 200, color: "rgba(255,220,50,0.07)",   dur: "20s", delay: "2s"  },
  { cx: "70%", cy: "10%", r: 250, color: "rgba(212,175,55,0.09)",   dur: "25s", delay: "6s"  },
];

export default function AnimatedBackground() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(getTheme());
    const h = (e) => setTheme(e.detail);
    window.addEventListener("arise:theme:changed", h);
    return () => window.removeEventListener("arise:theme:changed", h);
  }, []);

  const orbs  = theme === "light" ? LIGHT_ORBS : DARK_ORBS;
  const isLgt = theme === "light";
  const baseBg = isLgt
    ? "radial-gradient(ellipse at 15% 20%, rgba(255,215,0,0.08) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(212,175,55,0.06) 0%, transparent 50%)"
    : "radial-gradient(ellipse at 15% 20%, rgba(139,0,0,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(124,58,237,0.05) 0%, transparent 50%)";

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute inset-0" style={{ background: baseBg }} />
      {orbs.map((orb, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            left: orb.cx, top: orb.cy,
            width: orb.r, height: orb.r,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            animation: `floatOrb ${orb.dur} ease-in-out ${orb.delay} infinite alternate`,
            filter: "blur(1px)",
          }} />
      ))}
      <style>{`
        @keyframes floatOrb {
          0%   { transform: translate(-50%,-50%) scale(1);    }
          50%  { transform: translate(-45%,-55%) scale(1.08); }
          100% { transform: translate(-55%,-45%) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
