"use client";

import Link from "next/link";
import Nav from "@/components/shared/Nav";
import Footer from "@/components/shared/Footer";
import { useLang } from "@/lib/lang-context";

export default function PrivacyPage() {
  const { t } = useLang();

  const collectItems = ["s2li1", "s2li2", "s2li3", "s2li4", "s2li5"] as const;
  const useItems = ["s3li1", "s3li2", "s3li3", "s3li4", "s3li5", "s3li6"] as const;
  const thirdPartyItems = ["s6li1", "s6li2", "s6li3", "s6li4", "s6li5", "s6li6"] as const;
  const rightsItems = ["s8li1", "s8li2", "s8li3", "s8li4", "s8li5"] as const;

  return (
    <main className="min-h-screen bg-light">
      <Nav />
      <div className="max-w-[720px] mx-auto px-5 md:px-10 pt-28 pb-20">
        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-2 tracking-tight">{t("privacy.title")}</h1>
        <p className="text-sm text-dark/40 mb-10">{t("privacy.updated")}</p>

        <div className="prose prose-sm max-w-none text-dark/70 space-y-8">

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("privacy.s1h")}</h2>
            <p className="leading-relaxed">{t("privacy.s1b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("privacy.s2h")}</h2>
            <p className="leading-relaxed">{t("privacy.s2intro")}</p>
            <ul className="mt-3 space-y-2 leading-relaxed list-disc pl-5">
              {collectItems.map((k) => (
                <li key={k}>{t(`privacy.${k}`)}</li>
              ))}
            </ul>
            <p className="leading-relaxed mt-3">{t("privacy.s2p2")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("privacy.s3h")}</h2>
            <p className="leading-relaxed">{t("privacy.s3intro")}</p>
            <ul className="mt-3 space-y-2 leading-relaxed list-disc pl-5">
              {useItems.map((k) => (
                <li key={k}>{t(`privacy.${k}`)}</li>
              ))}
            </ul>
            <p className="leading-relaxed mt-3">{t("privacy.s3p2")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("privacy.s4h")}</h2>
            <p className="leading-relaxed">{t("privacy.s4p1")}</p>
            <p className="leading-relaxed mt-3">{t("privacy.s4p2")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("privacy.s5h")}</h2>
            <p className="leading-relaxed">{t("privacy.s5p1")}</p>
            <p className="leading-relaxed mt-3">{t("privacy.s5p2")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("privacy.s6h")}</h2>
            <p className="leading-relaxed">{t("privacy.s6intro")}</p>
            <ul className="mt-3 space-y-2 leading-relaxed list-disc pl-5">
              {thirdPartyItems.map((k) => (
                <li key={k}>{t(`privacy.${k}`)}</li>
              ))}
            </ul>
            <p className="leading-relaxed mt-3">{t("privacy.s6p2")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("privacy.s7h")}</h2>
            <p className="leading-relaxed">{t("privacy.s7b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("privacy.s8h")}</h2>
            <p className="leading-relaxed">{t("privacy.s8intro")}</p>
            <ul className="mt-3 space-y-2 leading-relaxed list-disc pl-5">
              {rightsItems.map((k) => (
                <li key={k}>{t(`privacy.${k}`)}</li>
              ))}
            </ul>
            <p className="leading-relaxed mt-3">{t("privacy.s8p2")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("privacy.s9h")}</h2>
            <p className="leading-relaxed">{t("privacy.s9b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("privacy.s10h")}</h2>
            <p className="leading-relaxed">{t("privacy.s10intro")}</p>
            <ul className="mt-3 space-y-1 leading-relaxed list-none pl-0">
              <li>
                {t("privacy.s10emailLabel")}{" "}
                <a href="mailto:info@wellnesshubom.com" className="text-primary hover:underline">
                  info@wellnesshubom.com
                </a>
              </li>
              <li>
                {t("privacy.s10phoneLabel")}{" "}
                <a href="tel:+96899829821" className="text-primary hover:underline">
                  +968 99829821
                </a>
              </li>
              <li>{t("privacy.s10addressLabel")} {t("privacy.s10address")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("privacy.s11h")}</h2>
            <p className="leading-relaxed">{t("privacy.s11b")}</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-dark/8 flex gap-6">
          <Link href="/terms" className="text-sm text-primary hover:underline">{t("privacy.viewTerms")}</Link>
          <Link href="/" className="text-sm text-dark/40 hover:text-dark/70">{t("privacy.backHome")}</Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
