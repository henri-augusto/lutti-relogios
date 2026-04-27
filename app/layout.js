import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import WhatsAppFloat from "@/components/whatsapp-float";
import AuthSessionProvider from "@/components/session-provider";
import { FavoritesProvider } from "@/components/favorites-context";
import { CartProvider } from "@/components/cart-provider";
import CartDrawer from "@/components/cart-drawer";

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
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-stone-900">
        <AuthSessionProvider>
          <FavoritesProvider>
            <CartProvider>
              <div aria-hidden="true" className="grain-overlay" />
              <Header />
              <main>{children}</main>
              <Footer />
              <WhatsAppFloat />
              <CartDrawer />
            </CartProvider>
          </FavoritesProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
