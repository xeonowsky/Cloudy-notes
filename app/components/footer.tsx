import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "../lib/session";

export default async function Footer() {
  const user = await getCurrentUser();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: "Aplikacja",
      links: user
        ? [
            { name: "Moje notatki", href: "/notatki" },
            { name: "Nowa notatka", href: "/notatki/nowa" },
            { name: "Konto", href: "/konto" },
          ]
        : [
            { name: "Możliwości", href: "/#mozliwosci" },
            { name: "Załóż konto", href: "/register" },
            { name: "Zaloguj się", href: "/logowanie" },
          ],
    },
    {
      title: "Informacje",
      links: [
        { name: "Regulamin", href: "/regulamin" },
        { name: "Polityka prywatności", href: "/polityka-prywatnosci" },
        { name: "Kontakt", href: "/contact" },
      ],
    },
  ];

  return (
    <footer className="relative mt-auto text-ink dark:text-white">
      {/* Pas chmur — górna krawędź stopki, ten sam motyw co na stronach logowania */}
      <svg
        aria-hidden
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="block h-10 w-full text-mist sm:h-14 dark:text-[#0f1f1e]"
        fill="currentColor"
      >
        <path d="M0 60V38c40-20 92-24 128-6 22-26 76-34 112-10 30-24 92-26 124 4 34-22 88-20 116 8 30-26 96-30 128 2 28-20 78-18 104 6 34-24 98-26 130 4 30-20 82-20 112 4 34-22 92-24 124 2 26-14 64-14 122 4v42z" />
      </svg>

      <div className="bg-mist dark:bg-[#0f1f1e]">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-6 pb-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-xs">
            <Link
              href="/"
              className="inline-block rounded-lg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <Image
                src="/images/logo-cropped.webp"
                width={634}
                height={406}
                alt="Cloudy Notes — strona główna"
                className="h-14 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink/65 dark:text-white/60">
              Darmowa aplikacja do notatek w przeglądarce. Formatowanie, listy zadań i kolorowe karty.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink/65 duration-200 hover:text-brand-deep hover:underline hover:decoration-brand hover:underline-offset-4 dark:text-white/60 dark:hover:text-brand"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-t border-ink/10 dark:border-white/10">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-ink/55 dark:text-white/50">
            <p>© {year} Cloudy Notes</p>
            <p>Twoje notatki widzisz tylko ty.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
