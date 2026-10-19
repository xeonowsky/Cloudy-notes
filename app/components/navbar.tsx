import Image from "next/image";
import Link from "next/link";
import NavLinks, { type NavLink } from "./nav/nav-links";
import FeaturesMenu from "./nav/features-menu";
import MobileMenu from "./nav/mobile-menu";
import { getCurrentUser } from "../lib/session";
import { logout } from "../actions/auth";

export default async function MainNavbar() {
  const user = await getCurrentUser();

  // Lewa strona: nawigacja po aplikacji (tylko dla zalogowanych)
  const appLinks: NavLink[] = user
    ? [
        { name: "Notatki", href: "/notatki" },
        { name: "Konto", href: "/konto" },
      ]
    : [];
  // Prawa strona: linki ogólne
  const contactLink: NavLink[] = [{ name: "Kontakt", href: "/contact" }];

  return (
    // sticky + półprzezroczyste tło z rozmyciem: menu zostaje na górze przy przewijaniu
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-[#0a0a0a]/85">
      <nav aria-label="Menu główne" className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="mr-2 shrink-0 rounded-lg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
          {/* logo-cropped.webp = Logo.webp przycięte do samej treści (bez pustych marginesów) */}
          <Image src="/images/logo-cropped.webp" width={634} height={406} alt="Cloudy Notes — strona główna" priority className="h-11 w-auto" />
        </Link>

        {/* Lewa strona */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLinks links={appLinks} />
          <FeaturesMenu loggedIn={!!user} />
        </div>

        {/* Prawa strona */}
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <NavLinks links={contactLink} />
          <span aria-hidden className="mx-1 h-6 w-px bg-line dark:bg-white/10" />

          {user ? (
            <>
              <Link
                href="/konto"
                className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 duration-200 hover:bg-mist dark:hover:bg-white/5"
              >
                <span
                  aria-hidden
                  className="grid size-8 place-items-center rounded-full bg-brand-deep text-sm font-semibold text-white"
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-32 truncate text-sm font-medium text-ink dark:text-white">{user.name}</span>
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-ink/65 duration-200 hover:bg-mist hover:text-ink dark:text-white/65 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  Wyloguj
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/logowanie"
                className="rounded-lg px-3 py-2 text-[0.9375rem] font-medium text-ink duration-200 hover:bg-mist dark:text-white dark:hover:bg-white/5"
              >
                Zaloguj się
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-deep px-4 py-2 text-[0.9375rem] font-semibold text-white duration-200 hover:bg-[#174744] focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none dark:bg-brand dark:text-ink dark:hover:bg-[#7fd6d2]"
              >
                Załóż konto
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto md:hidden">
          <MobileMenu links={[...appLinks, ...contactLink]} userName={user?.name ?? null} />
        </div>
      </nav>
    </header>
  );
}
