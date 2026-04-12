"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code  = params.get("code");
    const state = params.get("state");
    if (code && state) {
      // Pass to main app via URL params — AuthProvider picks this up
      router.replace(`/?spotify_code=${code}&spotify_state=${state}`);
    } else {
      router.replace("/");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p style={{ color: "#8888aa", fontFamily: "Orbitron, sans-serif", fontSize: "0.75rem" }}>
        COMPLETING AUTHENTICATION…
      </p>
    </div>
  );
}

export default function CallbackPage() {
  return <Suspense fallback={null}><CallbackInner /></Suspense>;
}
