"use client";

import Link from "next/link";
import FeatureIcon from "../feature-icon";
import { useDropdown } from "./use-dropdown";
import { FEATURES } from "@/app/lib/features";

// Rozwijane menu "Możliwości": lista funkcji + karta z wezwaniem do działania (CTA).
// Otwieranie i zamykanie: hook useDropdown (wspólny z menu "Narzędzia").
export default function FeaturesMenu({ loggedIn }: { loggedIn: boolean }) {
  const { open, rootRef, panelId, toggle, close, buttonProps } = useDropdown();

  const cta = loggedIn
    ? { title: "Masz pomysł?", text: "Zapisz go, zanim ucieknie.", label: "Nowa notatka", href: "/notatki/nowa" }
    : { title: "Zacznij za darmo", text: "Konto założysz w minutę. Bez karty i bez limitu notatek.", label: "Załóż konto", href: "/register" };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        {...buttonProps}
        className={`flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-[0.9375rem] duration-200 hover:bg-mist hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none dark:hover:bg-white/5 dark:hover:text-white ${
          open ? "bg-mist text-ink dark:bg-white/5 dark:text-white" : "text-ink/65 dark:text-white/65"
        }`}
      >
        Możliwości
        <svg viewBox="0 0 20 20" className={`size-4 duration-200 ${open ? "rotate-180" : ""}`} fill="currentColor" aria-hidden>
          <path d="M5.2 7.7a.75.75 0 0 1 1.06 0L10 11.44l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.76a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute top-[calc(100%+12px)] left-0 z-50 grid w-[52rem] max-w-[calc(100vw-2rem)] grid-cols-[1fr_14rem] gap-2 rounded-2xl border border-line bg-white p-2 shadow-[0_28px_60px_-28px_rgba(22,48,47,0.45)] dark:border-white/10 dark:bg-[#0f1f1e]"
        >
          <ul className="grid grid-cols-2 gap-1 p-1">
            {FEATURES.map((feature) => (
              <li key={feature.id}>
                <Link
                  href={`/#${feature.id}`}
                  onClick={close}
                  className="flex gap-3 rounded-xl p-3 duration-200 hover:bg-mist/70 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none dark:hover:bg-white/5"
                >
                  <FeatureIcon icon={feature.icon} />
                  <span>
                    <span className="block font-semibold text-ink dark:text-white">{feature.title}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink/60 dark:text-white/60">
                      {feature.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Karta CTA */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-brand-deep p-5 text-white">
            <svg viewBox="0 0 200 80" className="pointer-events-none absolute -right-6 -bottom-2 w-48 text-white/10" fill="currentColor" aria-hidden>
              <path d="M30 80c-17 0-28-10-28-24s12-24 27-23c5-15 19-25 36-25 18 0 33 11 37 27 4-2 8-3 13-3 15 0 27 11 28 25 13 1 23 11 23 23z" />
            </svg>
            <div className="relative">
              <p className="text-lg font-semibold">{cta.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{cta.text}</p>
            </div>
            <Link
              href={cta.href}
              onClick={close}
              className="relative mt-6 rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-brand-deep duration-200 hover:bg-mist focus-visible:ring-4 focus-visible:ring-brand/50 focus-visible:outline-none"
            >
              {cta.label}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
