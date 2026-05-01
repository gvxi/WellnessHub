import Image from "next/image";
import Link from "next/link";

export default function Footer() {
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
          <p className="text-dark/40 text-sm">
            © 2026 WellnessHub. All rights reserved.
          </p>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6">
          {[
            { label: "Services", href: "/#fitness" },
            { label: "About", href: "/about" },
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm text-dark/40 hover:text-primary transition-colors duration-200"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
