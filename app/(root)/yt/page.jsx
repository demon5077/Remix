"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function YTRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, []);
  return null;
}
