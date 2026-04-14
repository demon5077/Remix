"use client";
import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Static deep gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 15% 20%, rgba(139,0,0,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(124,58,237,0.05) 0%, transparent 50%)",
        }}
      />

      {/* Floating orbs — CSS animated */}
      {[
        { cx: "10%",  cy: "20%", r: 300, color: "rgba(139,0,0,0.06)",   dur: "18s", delay: "0s"   },
        { cx: "80%",  cy: "70%", r: 250, color: "rgba(124,58,237,0.05)", dur: "22s", delay: "4s"   },
        { cx: "50%",  cy: "50%", r: 200, color: "rgba(255,0,60,0.03)",   dur: "15s", delay: "8s"   },
        { cx: "30%",  cy: "80%", r: 180, color: "rgba(157,78,221,0.04)", dur: "20s", delay: "2s"   },
        { cx: "70%",  cy: "10%", r: 220, color: "rgba(139,0,0,0.05)",   dur: "25s", delay: "6s"   },
      ].map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: orb.cx,
            top:  orb.cy,
            width:  orb.r,
            height: orb.r,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(40px)",
            animation: `floatOrb ${orb.dur} ease-in-out ${orb.delay} infinite alternate`,
          }}
        />
      ))}

      {/* Subtle scanlines */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 4px)",
        }}
      />

      <style>{`
        @keyframes floatOrb {
          0%   { transform: translate(-50%, -50%) scale(1);    opacity: 0.6; }
          33%  { transform: translate(-44%, -56%) scale(1.08); opacity: 0.8; }
          66%  { transform: translate(-56%, -44%) scale(0.92); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
