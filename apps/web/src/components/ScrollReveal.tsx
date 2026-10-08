"use client";
import { useEffect } from "react";

/** Révèle au scroll les éléments portant [data-reveal]. Sans JS ou en mouvement réduit, tout reste visible. */
export default function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    const scan = () => document.querySelectorAll("[data-reveal]").forEach((el) => {
      if (!seen.has(el)) { seen.add(el); io.observe(el); }
    });

    root.classList.add("reveal-ready");
    scan();
    const mo = new MutationObserver(scan); // contenu chargé après coup (listes, boutiques)
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); root.classList.remove("reveal-ready"); };
  }, []);
  return null;
}
