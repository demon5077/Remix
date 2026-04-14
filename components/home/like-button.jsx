"use client";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export default function LikeButton({ songId, size = "sm", className = "" }) {
  const [liked,    setLiked]    = useState(false);
  const [animate,  setAnimate]  = useState(false);

  useEffect(() => {
    if (!songId) return;
    try {
      const likes = JSON.parse(localStorage.getItem("arise:likes") || "[]");
      setLiked(likes.includes(songId));
    } catch {}
  }, [songId]);

  const toggle = (e) => {
    e.stopPropagation();
    try {
      const likes = JSON.parse(localStorage.getItem("arise:likes") || "[]");
      let updated;
      if (liked) {
        updated = likes.filter(id => id !== songId);
      } else {
        updated = [...likes, songId];
        setAnimate(true);
        setTimeout(() => setAnimate(false), 600);
      }
      localStorage.setItem("arise:likes", JSON.stringify(updated));
      setLiked(!liked);
    } catch {}
  };

  const dim = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const iconDim = size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5";

  return (
    <button
      onClick={toggle}
      className={`${dim} rounded-full flex items-center justify-center transition-all duration-200 ${className}`}
      style={{
        color:      liked ? "#FF003C" : "#44445a",
        background: liked ? "rgba(255,0,60,0.1)" : "transparent",
        border:     liked ? "1px solid rgba(255,0,60,0.25)" : "1px solid rgba(255,255,255,0.06)",
        transform:  animate ? "scale(1.35)" : "scale(1)",
      }}
      onMouseEnter={e => {
        if (!liked) {
          e.currentTarget.style.color = "#FF003C";
          e.currentTarget.style.background = "rgba(255,0,60,0.06)";
        }
      }}
      onMouseLeave={e => {
        if (!liked) {
          e.currentTarget.style.color = "#44445a";
          e.currentTarget.style.background = "transparent";
        }
      }}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart
        className={iconDim}
        fill={liked ? "#FF003C" : "none"}
        style={{ transition: "all 0.2s" }}
      />
    </button>
  );
}
