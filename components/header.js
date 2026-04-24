"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCart } from "@/components/cart-provider";

const links = [
  { href: "/", label: "Início" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/#about", label: "Sobre" },
];

export default function Header() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [isAfterHero, setIsAfterHero] = useState(!isLanding);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const userMenuRef = useRef(null);
  const { openCart, totalItems } = useCart();
  const isAuthenticated = status === "authenticated" && Boolean(session?.user);
  const displayFirstName = useMemo(() => {
    const fullName = session?.user?.name?.trim();
    if (fullName) {
      return fullName.split(/\s+/)[0];
    }

    const email = session?.user?.email?.trim();
    if (email?.includes("@")) {
      return email.split("@")[0];
    }

    return "Conta";
  }, [session?.user?.email, session?.user?.name]);

  useEffect(() => {
    if (!isLanding) {
      setIsAfterHero(true);
      return undefined;
    }

    const heroSection = document.getElementById("hero");
    if (!heroSection) {
      setIsAfterHero(true);
      return undefined;
    }

    setIsAfterHero(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAfterHero(!entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(heroSection);

    return () => observer.disconnect();
  }, [isLanding]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined;
    }

    function handleOutsideClick(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isUserMenuOpen]);

  async function handleSignOut() {
    setIsUserMenuOpen(false);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="sticky top-0 z-40 w-full px-3 pt-2 sm:px-4 sm:pt-2.5 lg:px-6">
      <div
        className={`mx-auto w-full max-w-6xl rounded-xl border transition-colors duration-300 ${
          isAfterHero
            ? "border-[#EAEAEA]/70 bg-white/88 shadow-sm backdrop-blur-md backdrop-saturate-150"
            : "border-transparent bg-transparent shadow-none"
        }`}
      >
        <header className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="shrink-0" aria-label="Luti Relógios">
          <Image
            src="/image-nossa-historia.jpeg"
            alt="Luti Relógios"
            width={54}
            height={54}
            className="h-11 w-11 rounded-md border border-[#EAEAEA] object-cover"
          />
        </div>

        <nav
          className={`flex items-center justify-center gap-1 border transition-all duration-300 ${
            isAfterHero
              ? "rounded-md border-transparent bg-transparent px-0 py-0"
              : "rounded-full border-[#EAEAEA] bg-[#F7F6F3] px-2 py-2"
          }`}
          aria-label="Navegação principal"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-all duration-300 ${
                isAfterHero
                  ? "rounded-md px-3 py-2 text-[#2F3437] hover:bg-[#F7F6F3]"
                  : "rounded-full px-4 py-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsUserMenuOpen((previous) => !previous)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#EAEAEA] px-3 text-sm font-medium text-[#2F3437] transition-colors hover:bg-[#F7F6F3]"
              >
                <span className="max-w-24 truncate">{displayFirstName}</span>
                <svg
                  className={`h-3 w-3 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isUserMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 rounded-md border border-[#EAEAEA] bg-white p-1 shadow-sm"
                >
                  <Link
                    href="/perfil"
                    role="menuitem"
                    className="block rounded-md px-3 py-2 text-sm text-[#2F3437] transition-colors hover:bg-[#F7F6F3]"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Perfil
                  </Link>
                  <Link
                    href="/compras"
                    role="menuitem"
                    className="block rounded-md px-3 py-2 text-sm text-[#2F3437] transition-colors hover:bg-[#F7F6F3]"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Compras
                  </Link>
                  <Link
                    href="/favoritos"
                    role="menuitem"
                    className="block rounded-md px-3 py-2 text-sm text-[#2F3437] transition-colors hover:bg-[#F7F6F3]"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Favoritos
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#B42318] transition-colors hover:bg-[#FEF3F2]"
                  >
                    Sair
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/auth"
              aria-label="Login"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[#EAEAEA] text-[#2F3437] transition-colors hover:bg-[#F7F6F3]"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </Link>
          )}
          <button
            type="button"
            aria-label="Carrinho"
            id="cart-button-anchor"
            onClick={openCart}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-[#111111] text-white transition-colors hover:bg-[#333333]"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          </button>
          {totalItems > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-xs font-semibold text-slate-900">
              {totalItems}
            </span>
          ) : null}
        </div>
      </header>
      </div>
    </div>
  );
}
