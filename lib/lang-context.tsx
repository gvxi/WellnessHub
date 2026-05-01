"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

export type Lang = "en" | "ar";

type Messages = typeof en;

const MESSAGES: Record<Lang, Messages> = { en, ar };

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LangContext = createContext<LangContextType | null>(null);

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be inside LangProvider");
  return ctx;
}

function resolve(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return path;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : path;
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wh_lang") as Lang | null;
      if (stored === "en" || stored === "ar") setLangState(stored);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("wh_lang", lang); } catch {}
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  function setLang(l: Lang) { setLangState(l); }

  const messages = MESSAGES[lang] as unknown as Record<string, unknown>;
  const t = (key: string) => resolve(messages, key);

  return (
    <LangContext value={{ lang, setLang, t, isRTL: lang === "ar" }}>
      {children}
    </LangContext>
  );
}
