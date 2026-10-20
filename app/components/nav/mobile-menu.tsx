"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import type { NavLink } from "./nav-links";
import { FEATURES } from "@/app/lib/features";
import { isToolActive, TOOLS } from "@/app/lib/tools";

interface MobileMenuProps {
  links: NavLink[];
  userName: string | null;
}

// Menu na telefony oparte o <details>: działa nawet bez JavaScriptu.
// key={pathname} sprawia, że po przejściu na inną stronę React tworzy
// element od nowa — więc menu samo się zamyka.
export default function MobileMenu({ links, userName }: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <details key={pathname} className="group relative md:hidden">
      <summary
        aria-label="Menu"
        className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-line text-ink duration-200 hover:bg-mist dark:border-white/15 dark:text-white dark:hover:bg-white/5 [&::-webkit-details-marker]:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-5 group-open:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <svg viewBox="0 0 24 24" className="hidden size-5 group-open:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </summary>

      <div className="absolute top-12 right-0 z-50 w-72 rounded-2xl border border-line bg-white p-2 shadow-[0_24px_48px_-24px_rgba(22,48,47,0.4)] dark:border-white/10 dark:bg-[#0f1f1e]">
        {userName && (
          <p className="px-3 pt-2 pb-3 text-sm text-ink/60 dark:text-white/60">
            Zalogowano jako <span className="font-semibold text-ink dark:text-white">{userName}</span>
          </p>
        )}

        {/* Narzędzia — tylko dla zalogowanych */}
        {userName && (
          <>
            <p className="px-3 pt-1 pb-1 text-sm font-semibold text-ink/50 dark:text-white/50">Narzędzia</p>
            <ul className="mb-2 flex flex-col border-b border-line pb-2 dark:border-white/10">
              {TOOLS.map((tool) => {
                const active = isToolActive(tool, pathname);
                return (
                  <li key={tool.href}>
                    <Link
                      href={tool.href}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-xl px-3 py-2.5 duration-200 hover:bg-mist dark:hover:bg-white/5 ${
                        active ? "bg-mist font-semibold text-ink dark:bg-white/5 dark:text-white" : "text-ink/75 dark:text-white/75"
                      }`}
                    >
                      {tool.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <ul className="flex flex-col">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-xl px-3 py-2.5 duration-200 hover:bg-mist dark:hover:bg-white/5 ${
                    active ? "bg-mist font-semibold text-ink dark:bg-white/5 dark:text-white" : "text-ink/75 dark:text-white/75"
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-2 border-t border-line px-3 pt-3 pb-1 text-sm font-semibold text-ink/50 dark:border-white/10 dark:text-white/50">
          Możliwości
        </p>
        <ul className="flex flex-col">
          {FEATURES.map((feature) => (
            <li key={feature.id}>
              <Link
                href={`/#${feature.id}`}
                className="block rounded-xl px-3 py-2 text-ink/75 duration-200 hover:bg-mist dark:text-white/75 dark:hover:bg-white/5"
              >
                {feature.title}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-2 border-t border-line pt-2 dark:border-white/10">
          {userName ? (
            <form action={logout}>
              <button
                type="submit"
                className="w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-ink/75 duration-200 hover:bg-mist dark:text-white/75 dark:hover:bg-white/5"
              >
                Wyloguj się
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-2 p-1">
              <Link
                href="/logowanie"
                className="rounded-xl border border-line px-3 py-2.5 text-center font-medium text-ink duration-200 hover:bg-mist dark:border-white/15 dark:text-white"
              >
                Zaloguj się
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-deep px-3 py-2.5 text-center font-semibold text-white duration-200 hover:bg-[#174744]"
              >
                Załóż konto
              </Link>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
