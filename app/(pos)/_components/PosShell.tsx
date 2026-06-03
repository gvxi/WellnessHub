"use client";

import { LangProvider } from "@/lib/lang-context";
import type { ReactNode } from "react";

export default function PosShell({ children }: { children: ReactNode }) {
  return <LangProvider>{children}</LangProvider>;
}
