"use client";

import Link from "next/link";
import Nav from "@/components/shared/Nav";
import Footer from "@/components/shared/Footer";
import { useLang } from "@/lib/lang-context";

export default function TermsPage() {
  const { t } = useLang();

  return (
    <main className="min-h-screen bg-light">
      <Nav />
      <div className="max-w-[720px] mx-auto px-5 md:px-10 pt-28 pb-20">
        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-2 tracking-tight">{t("terms.title")}</h1>
        <p className="text-sm text-dark/40 mb-10">{t("terms.updated")}</p>

        <div className="prose prose-sm max-w-none text-dark/70 space-y-8">

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s1h")}</h2>
            <p className="leading-relaxed">{t("terms.s1b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s2h")}</h2>
            <p className="leading-relaxed">{t("terms.s2b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s3h")}</h2>
            <p className="leading-relaxed">{t("terms.s3b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s4h")}</h2>
            <p className="leading-relaxed">{t("terms.s4p1")}</p>
            <p className="leading-relaxed mt-3">{t("terms.s4p2")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s5h")}</h2>
            <p className="leading-relaxed">{t("terms.s5p1")}</p>
            <p className="leading-relaxed mt-3">{t("terms.s5p2")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s6h")}</h2>
            <p className="leading-relaxed">{t("terms.s6p1")}</p>
            <p className="leading-relaxed mt-3">{t("terms.s6p2")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s7h")}</h2>
            <p className="leading-relaxed">{t("terms.s7p1")}</p>
            <p className="leading-relaxed mt-3">{t("terms.s7p2")}</p>
            <p className="leading-relaxed mt-3">{t("terms.s7p3")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s8h")}</h2>
            <p className="leading-relaxed">{t("terms.s8p1")}</p>
            <p className="leading-relaxed mt-3">{t("terms.s8p2")}</p>
            <p className="leading-relaxed mt-3">{t("terms.s8p3")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s9h")}</h2>
            <p className="leading-relaxed">{t("terms.s9b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s10h")}</h2>
            <p className="leading-relaxed">{t("terms.s10b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s11h")}</h2>
            <p className="leading-relaxed">{t("terms.s11p1")}</p>
            <p className="leading-relaxed mt-3">
              {t("terms.s11p2")}{" "}
              <Link href="/privacy" className="text-primary hover:underline">{t("terms.viewPrivacy")}</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s12h")}</h2>
            <p className="leading-relaxed">{t("terms.s12b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s13h")}</h2>
            <p className="leading-relaxed">{t("terms.s13b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s14h")}</h2>
            <p className="leading-relaxed">{t("terms.s14b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s15h")}</h2>
            <p className="leading-relaxed">{t("terms.s15b")}</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">{t("terms.s16h")}</h2>
            <p className="leading-relaxed">{t("terms.s16intro")}</p>
            <ul className="mt-3 space-y-1 leading-relaxed list-none pl-0">
              <li>
                {t("terms.s16emailLabel")}{" "}
                <a href="mailto:info@wellnesshubom.com" className="text-primary hover:underline">
                  info@wellnesshubom.com
                </a>
              </li>
              <li>
                {t("terms.s16phoneLabel")}{" "}
                <a href="tel:+96899829821" className="text-primary hover:underline">
                  +968 99829821
                </a>
              </li>
              <li>{t("terms.s16addressLabel")} {t("terms.s16address")}</li>
            </ul>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-dark/8 flex gap-6">
          <Link href="/privacy" className="text-sm text-primary hover:underline">{t("terms.viewPrivacy")}</Link>
          <Link href="/" className="text-sm text-dark/40 hover:text-dark/70">{t("terms.backHome")}</Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
