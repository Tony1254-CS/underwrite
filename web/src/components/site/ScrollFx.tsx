"use client";

import { useEffect } from "react";

/**
 * Scroll motion for the landing page, in one place.
 *  - [data-reveal]  fades and lifts into view once
 *  - [data-grow]    a bar that grows from zero to data-f when it scrolls into view
 *
 * Nothing is hidden until GSAP has loaded, so if it never does (offline, blocked) the page is
 * simply static and complete. With prefers-reduced-motion this does nothing at all.
 * GSAP is imported dynamically, after first paint, and only on this page.
 */
export function ScrollFx() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let revert: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 28 },
            { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-grow]").forEach((el) => {
          const to = Number(el.dataset.f ?? 1);
          gsap.fromTo(
            el,
            { scaleX: 0 },
            { scaleX: to, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } },
          );
        });
      });
      revert = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return null;
}
