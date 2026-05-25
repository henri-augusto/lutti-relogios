import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import WhatsAppFloat from "@/components/whatsapp-float";
import AuthSessionProvider from "@/components/session-provider";
import { CartProvider } from "@/components/cart-provider";
import CartDrawer from "@/components/cart-drawer";
import { isStripeCheckoutEnabled } from "@/lib/domain/stripe-checkout-enabled";

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
  title: "Luti Distribuidora",
  description:
    "Seleção premium de relógios com garantia de 12 meses, envio expresso e suporte exclusivo via WhatsApp.",
};

export default function RootLayout({ children }) {
  const stripeCheckoutEnabled = isStripeCheckoutEnabled();

  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-stone-900">
        <AuthSessionProvider>
          <CartProvider>
            <div aria-hidden="true" className="grain-overlay" />
            <Header />
            <main className="min-w-0">{children}</main>
            <Footer />
            <WhatsAppFloat />
            {stripeCheckoutEnabled ? <CartDrawer /> : null}
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
