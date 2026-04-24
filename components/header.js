"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Início" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/#about", label: "Sobre" },
];

export default function Header() {
  const [isAfterHero, setIsAfterHero] = useState(false);

  useEffect(() => {
    const heroSection = document.getElementById("hero");
    if (!heroSection) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAfterHero(!entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(heroSection);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`sticky top-0 z-40 w-full border-b transition-colors duration-300 ${
        isAfterHero ? "border-[#EAEAEA] bg-white" : "border-transparent bg-transparent"
      }`}
    >
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
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
          <button
            type="button"
            aria-label="Login"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#EAEAEA] text-[#2F3437] transition-colors hover:bg-[#F7F6F3]"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 7a3 3 0 11-6 0 3 3 0 016 0zm-9 11a6 6 0 0112 0"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Carrinho"
            className="flex h-9 w-9 items-center justify-center rounded-md bg-[#111111] text-white transition-colors hover:bg-[#333333]"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4h2l2.2 9.2a1 1 0 00.97.8h8.58a1 1 0 00.97-.76L20 7H7"
              />
              <circle cx="10" cy="19" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="17" cy="19" r="1.4" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
      </header>
    </div>
  );
}
