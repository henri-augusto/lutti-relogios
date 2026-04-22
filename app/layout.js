import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import WhatsAppFloat from "@/components/whatsapp-float";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata = {
  title: "Luti Relógios | Relojoaria Premium",
  description:
    "Seleção premium de relógios com garantia de 12 meses, envio expresso e suporte exclusivo via WhatsApp.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakarta.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#F9F7F4] text-stone-900">
        <div aria-hidden="true" className="grain-overlay" />
        <Header />
        <main>{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
