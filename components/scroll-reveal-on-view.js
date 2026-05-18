"use client";

import { useEffect } from "react";

export default function ScrollRevealOnView() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const revealElements = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!revealElements.length) {
      return () => {
        root.classList.remove("reveal-ready");
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const element = entry.target;
          element.classList.add("reveal-in");
          observer.unobserve(element);
        });
      },
      {
        root: null,
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealElements.forEach((element) => {
      const revealDelay = Number(element.getAttribute("data-reveal-delay") || 0);
      element.style.setProperty("--reveal-delay", `${revealDelay}ms`);
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
