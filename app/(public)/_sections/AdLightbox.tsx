"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import type { ApiAd } from "@/lib/supabase/types";
import { resolveImage } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

interface Props {
  ad: ApiAd;
  open: boolean;
  onClose: () => void;
}

export default function AdLightbox({ ad, open, onClose }: Props) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const headline = (isAr && ad.translations?.ar?.headline) ? ad.translations.ar.headline : ad.headline;
  const subtitle = (isAr && ad.translations?.ar?.subtitle) ? ad.translations.ar.subtitle : ad.subtitle;
  const linkUrl = (isAr && ad.translations?.ar?.link_url) ? ad.translations.ar.link_url : ad.link_url;
  const imgUrl = resolveImage(ad.image_url, ad.unsplash_id, 1400);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-dark/90 flex items-center justify-center px-4 py-8"
        >
          <motion.div
            key="lightbox-card"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-light flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 end-3 z-10 w-8 h-8 rounded-full bg-dark/40 backdrop-blur-sm flex items-center justify-center"
            >
              <X size={16} className="text-light" />
            </button>

            {/* Image — natural aspect ratio */}
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt={headline}
                className="w-full h-auto block"
              />
            ) : (
              <div className="w-full h-56 bg-gradient-to-br from-primary to-secondary" />
            )}

            {/* Text + link below image */}
            <div className="px-6 pt-5 pb-6" dir={isAr ? "rtl" : "ltr"}>
              <h3 className="text-xl font-bold text-dark tracking-tight">{headline}</h3>
              {subtitle && (
                <p className="text-dark/55 text-sm mt-1">{subtitle}</p>
              )}
              {linkUrl && (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 w-full justify-center py-3 rounded-2xl
                             bg-primary text-light text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink size={14} />
                  {isAr ? "زيارة الرابط" : "Visit Link"}
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
