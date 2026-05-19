"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCart } from "@/components/cart-provider";
import { isStripeCheckoutEnabled } from "@/lib/domain/stripe-checkout-enabled";

const links = [
  { href: "/", label: "Início" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/#about", label: "Sobre" },
  { href: "/#revendedores-heading", label: "Revenda" },
];

function NavLink({ link, isAfterHero, onNavigate }) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={`text-sm font-medium transition-all duration-300 ${
        isAfterHero
          ? "rounded-md px-3 py-2 text-[#2F3437] hover:bg-[#F7F6F3]"
          : "rounded-full px-4 py-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      {link.label}
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [isAfterHero, setIsAfterHero] = useState(!isLanding);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const userMenuRef = useRef(null);
  const { openCart, totalItems } = useCart();
  const stripeCheckoutEnabled = isStripeCheckoutEnabled();
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

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  async function handleSignOut() {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await signOut({ callbackUrl: "/" });
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  const navShellClasses = isAfterHero
    ? "rounded-md border-transparent bg-transparent px-0 py-0"
    : "rounded-full border-[#EAEAEA] bg-[#F7F6F3] px-2 py-2";

  return (
    <div className="sticky top-0 z-40 w-full px-3 pt-2 sm:px-4 sm:pt-2.5 lg:px-6">
      <div
        className={`mx-auto w-full max-w-6xl rounded-xl border transition-colors duration-300 ${
          isAfterHero
            ? "border-[#EAEAEA]/70 bg-white/88 shadow-sm backdrop-blur-md backdrop-saturate-150"
            : "border-transparent bg-transparent shadow-none"
        }`}
      >
        <header className="flex w-full min-w-0 items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <button
              type="button"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-panel"
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setIsMobileMenuOpen((previous) => !previous)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#EAEAEA] text-[#2F3437] transition-colors hover:bg-[#F7F6F3] md:hidden"
            >
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
            <Link href="/" className="shrink-0" aria-label="Luti Relógios - início">
              <Image
                src="/image-nossa-historia.jpeg"
                alt="Luti Relógios"
                width={54}
                height={54}
                className="h-10 w-10 rounded-md border border-[#EAEAEA] object-cover sm:h-11 sm:w-11"
              />
            </Link>
          </div>

          <nav
            className={`hidden min-w-0 items-center justify-center gap-1 border transition-all duration-300 md:flex ${navShellClasses}`}
            aria-label="Navegação principal"
          >
            {links.map((link) => (
              <NavLink key={link.href} link={link} isAfterHero={isAfterHero} />
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {isAuthenticated ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  type="button"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsUserMenuOpen((previous) => !previous)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#EAEAEA] px-3 text-sm font-medium text-[#2F3437] transition-colors hover:bg-[#F7F6F3]"
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
                    className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-[#EAEAEA] bg-white p-1 shadow-sm"
                  >
                    <Link
                      href="/perfil"
                      role="menuitem"
                      className="block rounded-md px-3 py-2.5 text-sm text-[#2F3437] transition-colors hover:bg-[#F7F6F3]"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Perfil
                    </Link>
                    <Link
                      href="/compras"
                      role="menuitem"
                      className="block rounded-md px-3 py-2.5 text-sm text-[#2F3437] transition-colors hover:bg-[#F7F6F3]"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Compras
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="block w-full rounded-md px-3 py-2.5 text-left text-sm text-[#B42318] transition-colors hover:bg-[#FEF3F2]"
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
                className="hidden h-10 w-10 items-center justify-center rounded-md border border-[#EAEAEA] text-[#2F3437] transition-colors hover:bg-[#F7F6F3] sm:flex"
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
            {stripeCheckoutEnabled ? (
              <button
                type="button"
                aria-label="Carrinho"
                id="cart-button-anchor"
                onClick={openCart}
                className="relative flex h-10 w-10 items-center justify-center rounded-md bg-[#111111] text-white transition-colors hover:bg-[#333333]"
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
                {totalItems > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-semibold text-slate-900">
                    {totalItems}
                  </span>
                ) : null}
              </button>
            ) : null}
          </div>
        </header>

        {isMobileMenuOpen ? (
          <>
            <button
              type="button"
              aria-label="Fechar menu"
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
              onClick={closeMobileMenu}
            />
            <nav
              id="mobile-nav-panel"
              className="relative z-50 border-t border-[#EAEAEA]/80 px-3 py-3 md:hidden"
              aria-label="Navegação mobile"
            >
              <ul className="flex flex-col gap-1">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-[#2F3437] transition-colors hover:bg-[#F7F6F3]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li className="mt-2 border-t border-[#EAEAEA] pt-2">
                  {isAuthenticated ? (
                    <div className="flex flex-col gap-1">
                      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                        Olá, {displayFirstName}
                      </p>
                      <Link
                        href="/perfil"
                        onClick={closeMobileMenu}
                        className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-[#2F3437] hover:bg-[#F7F6F3]"
                      >
                        Perfil
                      </Link>
                      <Link
                        href="/compras"
                        onClick={closeMobileMenu}
                        className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-[#2F3437] hover:bg-[#F7F6F3]"
                      >
                        Compras
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm font-medium text-[#B42318] hover:bg-[#FEF3F2]"
                      >
                        Sair
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/auth"
                      onClick={closeMobileMenu}
                      className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-[#2F3437] hover:bg-[#F7F6F3]"
                    >
                      Entrar / Criar conta
                    </Link>
                  )}
                </li>
              </ul>
            </nav>
          </>
        ) : null}
      </div>
    </div>
  );
}
