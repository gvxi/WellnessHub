import Nav from "@/components/shared/Nav";
import Footer from "@/components/shared/Footer";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="overflow-x-hidden w-full max-w-full min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1">{children}</div>
      <Footer />
    </main>
  );
}
