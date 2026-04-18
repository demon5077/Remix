"use client";
import { useEffect, useRef } from "react";

export default function AngelParticles() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create golden dust particles
    const particles = Array.from({ length: 60 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 2.5 + 0.5,
      vx:    (Math.random() - 0.5) * 0.4,
      vy:    -(Math.random() * 0.6 + 0.2),
      alpha: Math.random() * 0.6 + 0.2,
      da:    (Math.random() - 0.5) * 0.008,
      // Some are star-shaped (larger)
      star:  Math.random() > 0.8,
    }));

    const drawStar = (ctx, x, y, r, alpha) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Date.now() * 0.001);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const ox = i === 0 ? 0 : ctx;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.alpha += p.da;

        if (p.alpha <= 0.1) p.da =  Math.abs(p.da);
        if (p.alpha >= 0.9) p.da = -Math.abs(p.da);
        if (p.y < -20) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -20) p.x = canvas.width + 10;
        if (p.x > canvas.width + 20) p.x = -10;

        if (p.star) {
          drawStar(ctx, p.x, p.y, p.r * 2, p.alpha * 0.7);
        } else {
          // Golden glow dot
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
          grd.addColorStop(0, `rgba(255, 215, 0, ${p.alpha})`);
          grd.addColorStop(0.5, `rgba(212, 175, 55, ${p.alpha * 0.5})`);
          grd.addColorStop(1, `rgba(212, 175, 55, 0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener("resize", resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
