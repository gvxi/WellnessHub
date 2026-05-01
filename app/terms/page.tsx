import Link from "next/link";
import Nav from "@/components/shared/Nav";
import Footer from "@/components/shared/Footer";

export const metadata = {
  title: "Terms of Service — WellnessHub",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-light">
      <Nav />
      <div className="max-w-[720px] mx-auto px-5 md:px-10 pt-28 pb-20">
        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-dark/40 mb-10">Last updated: April 2026</p>

        <div className="prose prose-sm max-w-none text-dark/70 space-y-8">
          <section>
            <h2 className="text-base font-semibold text-dark mb-2">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using WellnessHub services, you agree to be bound by these Terms of Service. If you do not
              agree, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">2. Services</h2>
            <p className="leading-relaxed">
              WellnessHub provides an online platform for browsing, booking, and purchasing wellness and beauty services.
              All services listed are provided by qualified professionals. Availability may vary.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">3. Bookings & Payments</h2>
            <p className="leading-relaxed">
              Bookings are confirmed upon receipt of payment. Prices are displayed in Omani Rial (OMR) and are subject
              to change. Cancellations must be made at least 24 hours in advance for a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">4. User Accounts</h2>
            <p className="leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. WellnessHub is not
              liable for any loss resulting from unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">5. Prohibited Conduct</h2>
            <p className="leading-relaxed">
              You agree not to misuse the platform, attempt unauthorized access, post false information, or engage in
              any conduct that may harm WellnessHub or its users.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">6. Limitation of Liability</h2>
            <p className="leading-relaxed">
              WellnessHub is not liable for any indirect, incidental, or consequential damages arising from your use of
              our services. Our total liability shall not exceed the amount paid for the relevant service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">7. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to update these terms at any time. Continued use of the platform after changes
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-dark mb-2">8. Contact</h2>
            <p className="leading-relaxed">
              For questions about these terms, contact us at{" "}
              <a href="mailto:hello@wellnesshub.om" className="text-primary hover:underline">
                hello@wellnesshub.om
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-dark/8 flex gap-6">
          <Link href="/privacy" className="text-sm text-primary hover:underline">Privacy Policy</Link>
          <Link href="/" className="text-sm text-dark/40 hover:text-dark/70">← Back to home</Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
