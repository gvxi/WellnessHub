import Nav from "@/components/shared/Nav";
import Footer from "@/components/shared/Footer";
import AboutContent from "./_components/AboutContent";

export const metadata = {
  title: "About Us — WellnessHub",
  description: "Your destination for wellness, beauty, and self-care in Oman.",
};

export default function AboutPage() {
  return (
    <main className="overflow-x-hidden w-full max-w-full bg-light">
      <Nav />
      <AboutContent />
      <Footer />
    </main>
  );
}
