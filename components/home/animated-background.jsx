"use client";
import { useEffect, useRef, useState } from "react";
import { getTheme } from "@/lib/theme";

// ── Dark theme: fire & smoke particles (canvas) ───────────────────────────────
function DarkParticles() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    // Fire + smoke particles
    const particles = Array.from({ length: 70 }, () => createParticle(canvas));

    function createParticle(canvas) {
      const isFire = Math.random() > 0.4;
      return {
        x:     Math.random() * canvas.width,
        y:     canvas.height + Math.random() * 100,
        r:     Math.random() * (isFire ? 4 : 10) + (isFire ? 1 : 5),
        vx:    (Math.random() - 0.5) * 0.6,
        vy:    -(Math.random() * 1.2 + 0.3),
        alpha: Math.random() * 0.5 + 0.1,
        life:  1,
        decay: Math.random() * 0.008 + 0.003,
        isFire,
        hue:   isFire ? Math.random() * 30 + 0   // red-orange
                       : 0,                        // grey smoke
      };
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.alpha = p.life * (p.isFire ? 0.5 : 0.18);

        if (p.life <= 0 || p.y < -50) {
          particles[i] = createParticle(canvas);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        if (p.isFire) {
          // Fire — warm gradient blob
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2);
          grd.addColorStop(0,   `hsla(${p.hue}, 100%, 70%, ${p.alpha})`);
          grd.addColorStop(0.5, `hsla(${p.hue + 15}, 100%, 40%, ${p.alpha * 0.6})`);
          grd.addColorStop(1,   `hsla(${p.hue + 30}, 100%, 20%, 0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        } else {
          // Smoke — grey drift upward
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          grd.addColorStop(0, `rgba(80,40,40,${p.alpha * 0.7})`);
          grd.addColorStop(1, `rgba(20,10,10,0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
          p.r += 0.05; // smoke expands
          p.vx += (Math.random() - 0.5) * 0.04;
        }
        ctx.restore();
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.55 }} />;
}

// ── Light theme: golden dust (canvas) ────────────────────────────────────────
function LightParticles() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 60 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 2.5 + 0.5,
      vx:    (Math.random() - 0.5) * 0.4,
      vy:    -(Math.random() * 0.5 + 0.15),
      alpha: Math.random() * 0.5 + 0.2,
      da:    (Math.random() - 0.5) * 0.007,
      star:  Math.random() > 0.75,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        p.alpha += p.da;
        if (p.alpha < 0.1) p.da = Math.abs(p.da);
        if (p.alpha > 0.9) p.da = -Math.abs(p.da);
        if (p.y < -20)  { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -20)    p.x = canvas.width + 10;
        if (p.x > canvas.width + 20) p.x = -10;

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        grd.addColorStop(0, `rgba(255,215,0,${p.alpha})`);
        grd.addColorStop(0.5, `rgba(212,175,55,${p.alpha * 0.4})`);
        grd.addColorStop(1, "rgba(212,175,55,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animRef.current); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.6 }} />;
}

// ── Ambient orb backgrounds ───────────────────────────────────────────────────
const DARK_ORBS  = [
  { cx: "10%", cy: "20%", r: 300, color: "rgba(139,0,0,0.07)",   dur: "18s", delay: "0s" },
  { cx: "80%", cy: "70%", r: 250, color: "rgba(124,58,237,0.06)", dur: "22s", delay: "4s" },
  { cx: "50%", cy: "50%", r: 200, color: "rgba(255,0,60,0.04)",   dur: "15s", delay: "8s" },
  { cx: "30%", cy: "80%", r: 180, color: "rgba(157,78,221,0.05)", dur: "20s", delay: "2s" },
  { cx: "70%", cy: "10%", r: 220, color: "rgba(139,0,0,0.06)",    dur: "25s", delay: "6s" },
];
const LIGHT_ORBS = [
  { cx: "10%", cy: "20%", r: 350, color: "rgba(255,215,0,0.10)",  dur: "18s", delay: "0s" },
  { cx: "80%", cy: "70%", r: 280, color: "rgba(212,175,55,0.08)", dur: "22s", delay: "4s" },
  { cx: "50%", cy: "50%", r: 220, color: "rgba(255,200,0,0.06)",  dur: "15s", delay: "8s" },
  { cx: "30%", cy: "80%", r: 200, color: "rgba(255,220,50,0.07)", dur: "20s", delay: "2s" },
  { cx: "70%", cy: "10%", r: 250, color: "rgba(212,175,55,0.09)", dur: "25s", delay: "6s" },
];

export default function AnimatedBackground() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(getTheme());
    const h = (e) => setTheme(e.detail);
    window.addEventListener("arise:theme:changed", h);
    return () => window.removeEventListener("arise:theme:changed", h);
  }, []);

  const isLight = theme === "light";
  const orbs    = isLight ? LIGHT_ORBS : DARK_ORBS;
  const baseBg  = isLight
    ? "radial-gradient(ellipse at 15% 20%, rgba(255,215,0,0.08) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(212,175,55,0.06) 0%, transparent 50%)"
    : "radial-gradient(ellipse at 15% 20%, rgba(139,0,0,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(124,58,237,0.05) 0%, transparent 50%)";

  return (
    <>
      {/* Canvas particles — fire+smoke (dark) or golden dust (light) */}
      {isLight ? <LightParticles /> : <DarkParticles />}

      {/* Ambient orb background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute inset-0" style={{ background: baseBg }} />
        {orbs.map((orb, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              left: orb.cx, top: orb.cy,
              width: orb.r, height: orb.r,
              transform: "translate(-50%,-50%)",
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
    </>
  );
}
