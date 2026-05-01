"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer id="about" className="border-t border-dark/8 bg-light">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo + tagline */}
        <div className="flex items-center gap-3">
          <Image
            src="/media/Logo.svg"
            alt="WellnessHub"
            width={32}
            height={32}
            className="w-8 h-8 object-contain opacity-80"
          />
          <p className="text-dark/40 text-sm">{t("footer.copyright")}</p>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6">
          {[
            { key: "footer.services", href: "/#fitness" },
            { key: "footer.about",    href: "/about" },
            { key: "footer.terms",    href: "/terms" },
            { key: "footer.privacy",  href: "/privacy" },
          ].map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className="text-sm text-dark/40 hover:text-primary transition-colors duration-200"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
