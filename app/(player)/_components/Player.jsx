"use client";
/**
 * Player page component — reads from MusicContext, no local audio.
 * When this page loads for a song ID, it calls playSong(id).
 * The global audio in MusicProvider handles everything.
 */
import { useEffect, useState } from "react";
import { useMusicProvider, useNextMusicProvider } from "@/hooks/use-context";
import { getSongsById, getSongsSuggestions } from "@/lib/fetch";
import { Repeat, Repeat1, Download, Share2 } from "lucide-react";
import { IoPause, IoPlay, IoPlaySkipForward } from "react-icons/io5";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import Link from "next/link";
import Next from "@/components/cards/next";

export default function Player({ id }) {
  const {
    music, playSong,
    songData, playing, togglePlay,
    toggleLoop, isLooping,
    currentTime, duration, progress, formatTime, seek,
    audioURL, isLoading,
  } = useMusicProvider();

  const next = useNextMusicProvider();

  // On mount: play this song via global context
  useEffect(() => {
    playSong(id);
  }, [id]);

  const handleSeek = (e) => seek(e[0]);

  const downloadSong = async () => {
    if (!audioURL) return;
    try {
      toast("Starting download…");
      const res  = await fetch(audioURL);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `${songData?.name || "song"}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch { toast.error("Download failed."); }
  };

  const handleShare = () => {
    try { navigator.share({ url: `${window.location.origin}/${id}` }); }
    catch {
      navigator.clipboard?.writeText(`${window.location.origin}/${id}`);
      toast("Link copied!");
    }
  };

  const coverImg = songData?.image?.[2]?.url || songData?.image?.[1]?.url || "";

  return (
    <div className="px-5 md:px-8 lg:px-12 pt-6 pb-4">
      <div
        className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(18,18,32,0.97) 0%, rgba(13,13,24,0.97) 100%)",
          border:     "1px solid rgba(255,0,60,0.1)",
          boxShadow:  "0 8px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Blurred cover bg */}
        {coverImg && (
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:    `url(${coverImg})`,
              backgroundSize:     "cover",
              backgroundPosition: "center",
              filter:             "blur(30px)",
            }}
          />
        )}

        <div className="relative z-10 sm:flex gap-8 items-start">
          {/* Album art */}
          <div className="flex-shrink-0">
            {isLoading || !songData ? (
              <div className="remix-shimmer w-full sm:w-[190px] sm:h-[190px] h-[200px] rounded-2xl" />
            ) : (
              <div className="relative">
                <img
                  src={coverImg}
                  alt={songData?.name}
                  className="blurz w-full sm:w-[190px] sm:h-[190px] h-[200px] object-cover rounded-2xl mx-auto sm:mx-0"
                  style={{
                    boxShadow:  playing
                      ? "0 0 40px rgba(255,0,60,0.35), 0 8px 40px rgba(0,0,0,0.6)"
                      : "0 8px 40px rgba(0,0,0,0.6)",
                    transition: "box-shadow 0.5s ease",
                  }}
                />
                {playing && (
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ border: "2px solid rgba(255,0,60,0.4)", animation: "pulseRing 2s ease-in-out infinite" }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col justify-between mt-5 sm:mt-0">
            {isLoading || !songData ? (
              <div className="space-y-3">
                <div className="remix-shimmer h-6 w-48 rounded" />
                <div className="remix-shimmer h-4 w-24 rounded" />
                <div className="remix-shimmer h-1.5 w-full rounded-full mt-8" />
              </div>
            ) : (
              <>
                {/* Song info */}
                <div>
                  <h1
                    className="text-xl sm:text-2xl font-black leading-tight mb-1"
                    style={{ color: "#e8e8f8", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.02em" }}
                  >
                    {songData.name}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/search/${encodeURIComponent(songData.artists?.primary?.[0]?.name?.toLowerCase().split(" ").join("+") || "")}`}
                      className="text-sm font-semibold transition-colors hover:text-hellfire"
                      style={{ color: "#FF003C" }}
                    >
                      {songData.artists?.primary?.[0]?.name || "Unknown"}
                    </Link>
                    {songData.album?.name && (
                      <>
                        <span style={{ color: "#44445a" }}>·</span>
                        <span className="text-sm" style={{ color: "#8888aa" }}>{songData.album.name}</span>
                      </>
                    )}
                  </div>
                  {songData.language && (
                    <span
                      className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                      style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)", color: "#9D4EDD", fontFamily: "Orbitron, sans-serif" }}
                    >
                      {songData.language}
                    </span>
                  )}
                </div>

                {/* Seek bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="relative">
                    <Slider onValueChange={handleSeek} value={[currentTime]} max={duration || 100} className="w-full" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 left-0 h-1 rounded-full pointer-events-none"
                      style={{
                        width:      `${progress}%`,
                        background: "linear-gradient(to right, #8B0000, #FF003C, #9D4EDD)",
                        boxShadow:  "0 0 8px rgba(255,0,60,0.5)",
                        transition: "width 0.1s linear",
                      }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", fontSize: "0.6rem" }}>{formatTime(currentTime)}</span>
                    <span style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", fontSize: "0.6rem" }}>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={togglePlay}
                    className="flex items-center gap-2.5 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-200 active:scale-95"
                    style={{
                      background: playing ? "linear-gradient(135deg, #8B0000, #FF003C)" : "rgba(255,0,60,0.12)",
                      color:      "white",
                      border:     playing ? "none" : "1px solid rgba(255,0,60,0.3)",
                      boxShadow:  playing ? "0 0 24px rgba(255,0,60,0.45)" : "none",
                      fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.06em",
                    }}
                  >
                    {playing ? <><IoPause className="w-4 h-4" /> Pause</> : <><IoPlay className="w-4 h-4" /> Play</>}
                  </button>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={toggleLoop}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                      style={{
                        color:      isLooping ? "#FF003C" : "#44445a",
                        background: isLooping ? "rgba(255,0,60,0.1)" : "transparent",
                        border:     "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      {isLooping ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={downloadSong}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                      style={{ color: "#44445a", border: "1px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#FF003C"}
                      onMouseLeave={e => e.currentTarget.style.color = "#44445a"}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                      style={{ color: "#44445a", border: "1px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#9D4EDD"}
                      onMouseLeave={e => e.currentTarget.style.color = "#44445a"}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Next up */}
      {next?.nextData && (
        <div className="mt-5">
          <p className="remix-section-title mb-3">Up Next</p>
          <Next name={next.nextData.name} artist={next.nextData.artist} image={next.nextData.image} id={next.nextData.id} />
        </div>
      )}
    </div>
  );
}
