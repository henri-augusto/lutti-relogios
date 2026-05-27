"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const whatsappHref = `https://wa.me/5511988856382`;

export default function FooterContent({ version }) {
  const pathname = usePathname();
  if (pathname === "/auth" || pathname === "/auth/register" || pathname === "/auth/forgot-password") {
    return null;
  }

  return (
    <footer className="mt-12 border-t border-stone-200/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-serif text-lg font-bold text-stone-900">
              Luti Relógios
            </p>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-stone-400">
              Distribuidora Luti, desde 1994.
            </p>
          </div>

          <nav className="flex items-center gap-6 text-sm text-stone-400" aria-label="Links do rodapé">
            <Link href="/catalogo" className="transition-colors hover:text-stone-700">
              Catálogo
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-stone-700"
            >
              WhatsApp
            </a>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-stone-200/60 pt-6 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Luti Relógios. Todos os direitos reservados.
          </p>
          <p className="text-stone-300">
            Desenvolvido por Logos Agency &middot; v{version}
          </p>
        </div>
      </div>
    </footer>
  );
}
