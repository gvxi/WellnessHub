import Link from "next/link";
import Nav from "@/components/shared/Nav";
import Footer from "@/components/shared/Footer";

export const metadata = {
  title: "Privacy Policy — WellnessHub",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-light">
      <Nav />
      <div className="max-w-[720px] mx-auto px-5 md:px-10 pt-28 pb-20">
        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-dark/40 mb-10">Last updated: April 2026</p>

        <div className="prose prose-sm max-w-none text-dark/70 space-y-8">
          <section>
            <h2 className="text-base font-semibold text-dark mb-2">1. Information We Collect</h2>
            <p className="leading-relaxed">
              We collect information you provide directly — such as your name, email address, phone number, and age when
              you create an account or make a booking. We also collect usage data and device information automatically.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">2. How We Use Your Information</h2>
            <p className="leading-relaxed">
              Your information is used to process bookings, send confirmations, improve our services, and communicate
              relevant offers. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">3. Data Storage</h2>
            <p className="leading-relaxed">
              Data is stored securely using Supabase infrastructure hosted in the EU. We apply industry-standard
              encryption at rest and in transit.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">4. Cookies & Local Storage</h2>
            <p className="leading-relaxed">
              We use browser local storage to remember your preferences (such as cart items and favorites). No tracking
              cookies are used for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">5. Third-Party Services</h2>
            <p className="leading-relaxed">
              We use Google OAuth for optional sign-in. Images may be served via Unsplash or our own Supabase Storage.
              Cloudflare Turnstile is used for spam protection during registration.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">6. Your Rights</h2>
            <p className="leading-relaxed">
              You may request deletion of your account and associated data at any time by contacting us. You can also
              update your profile information from your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">7. Children&apos;s Privacy</h2>
            <p className="leading-relaxed">
              Our services are not directed to children under 13. We do not knowingly collect personal data from
              children.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">8. Contact</h2>
            <p className="leading-relaxed">
              For privacy-related requests, contact us at{" "}
              <a href="mailto:privacy@wellnesshub.om" className="text-primary hover:underline">
                privacy@wellnesshub.om
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-dark/8 flex gap-6">
          <Link href="/terms" className="text-sm text-primary hover:underline">Terms of Service</Link>
          <Link href="/" className="text-sm text-dark/40 hover:text-dark/70">← Back to home</Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
