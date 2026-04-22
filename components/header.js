import Link from "next/link";

const links = [
  { href: "/", label: "Início" },
  { href: "/catalogo", label: "Catálogo" },
];

const whatsappHref = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5500000000000"}`;

export default function Header() {
  return (
    <div className="sticky top-0 z-40 flex justify-center px-4 py-4">
      <header className="flex w-full max-w-xl items-center justify-between rounded-full border border-stone-200/70 bg-white/80 pl-5 pr-2 py-2 shadow-[0_2px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl">

        <Link
          href="/"
          className="font-serif text-[0.9375rem] font-bold tracking-tight text-stone-900 transition-opacity hover:opacity-70"
        >
          Luti
        </Link>

        <nav className="flex items-center gap-0.5" aria-label="Navegação principal">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-stone-500 transition-all duration-300 hover:bg-stone-100 hover:text-stone-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white transition-all duration-300 hover:bg-stone-700 active:scale-95"
        >
          WhatsApp
        </a>
      </header>
    </div>
  );
}
