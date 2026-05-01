"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FirstVisitGuard() {
  const router = useRouter();

  useEffect(() => {
    try {
      if (!localStorage.getItem("au")) {
        router.replace("/about");
      }
    } catch {
      // localStorage unavailable (SSR/private mode) — skip redirect
    }
  }, [router]);

  return null;
}
