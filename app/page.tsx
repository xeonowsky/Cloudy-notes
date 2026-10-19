import Image from "next/image";
import Link from "next/link";
import FeatureIcon from "./components/feature-icon";
import { FEATURES } from "./lib/features";
import { getCurrentUser } from "./lib/session";

export default async function Home() {
  // Przyciski w hero zależą od tego, czy ktoś jest zalogowany
  const user = await getCurrentUser();

  return (
    <div className="relative isolate flex flex-1 flex-col items-center overflow-hidden font-sans">
      {/* Hero. <section> zamiast <main>, bo <main> jest już w layout.tsx */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-12 pb-20 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:pt-20 lg:pb-28">
        <div className="max-w-xl">
          <h1 className="text-[2.75rem] leading-[1.05] font-semibold tracking-[-0.03em] text-ink sm:text-[3.5rem] dark:text-white">
            Zapisuj pomysły, zanim odpłyną
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink/70 dark:text-white/70">
            Cloudy Notes to darmowa aplikacja do notatek w przeglądarce. Formatowanie, listy zadań i kolorowe
            karty, bez instalowania czegokolwiek.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {user ? (
              <Link
                href="/notatki"
                className="rounded-xl bg-brand-deep px-6 py-3.5 font-semibold text-white duration-200 hover:bg-[#174744] focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none dark:bg-brand dark:text-ink"
              >
                Przejdź do notatek
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-xl bg-brand-deep px-6 py-3.5 font-semibold text-white duration-200 hover:bg-[#174744] focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none dark:bg-brand dark:text-ink"
                >
                  Załóż darmowe konto
                </Link>
                <Link
                  href="/logowanie"
                  className="rounded-xl border-[1.5px] border-line px-6 py-3.5 font-semibold text-ink duration-200 hover:border-brand-deep hover:bg-mist dark:border-white/15 dark:text-white dark:hover:bg-white/5"
                >
                  Zaloguj się
                </Link>
              </>
            )}
          </div>
          {!user && (
            <p className="mt-4 text-sm text-ink/55 dark:text-white/55">
              Bez karty płatniczej i bez limitu notatek.
            </p>
          )}
        </div>

        <div className="relative">
          {/* Miękka "mgiełka" w kolorze marki za zdjęciem */}
          <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-mist dark:bg-[#12302e]" />
          <Image
            src="/images/note.webp"
            alt="Notes w kształcie chmury leżący na drewnianym biurku"
            width={989}
            height={672}
            priority
            className="h-auto w-full rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(22,48,47,0.5)]"
          />
        </div>
      </section>

      {/* Możliwości — tu prowadzą linki z menu (/#formatowanie itd.) */}
      <section id="mozliwosci" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-24">
        <h2 className="text-[2rem] leading-tight font-semibold tracking-[-0.02em] text-ink dark:text-white">
          Wszystko, czego potrzebuje dobra notatka
        </h2>
        <p className="mt-3 max-w-xl text-ink/65 dark:text-white/65">
          Bez zbędnych funkcji. Piszesz, formatujesz i wracasz do tego, co ważne.
        </p>

        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            // scroll-mt-24 — kotwica nie chowa się pod przyklejonym menu
            <li key={feature.id} id={feature.id} className="flex scroll-mt-24 gap-4">
              <FeatureIcon icon={feature.icon} className="size-12" />
              <div>
                <h3 className="text-lg font-semibold text-ink dark:text-white">{feature.title}</h3>
                <p className="mt-1 leading-relaxed text-ink/65 dark:text-white/65">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>

        {!user && (
          <Link
            href="/register"
            className="mt-12 inline-flex rounded-xl bg-brand-deep px-6 py-3 font-semibold text-white duration-200 hover:bg-[#174744] focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none dark:bg-brand dark:text-ink"
          >
            Załóż darmowe konto
          </Link>
        )}
      </section>
    </div>
  );
}
