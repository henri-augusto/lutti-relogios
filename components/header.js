import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catalogo" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-serif text-xl font-bold text-slate-900">
          Luti Relogios
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
