import type { ReactNode } from "react";
import Link from "next/link";
import { LEGAL, legalIncomplete } from "@/app/lib/legal";

interface LegalPageProps {
  title: string;
  current: "regulamin" | "polityka";
  children: ReactNode;
}

const TABS = [
  { key: "regulamin", label: "Regulamin", href: "/regulamin" },
  { key: "polityka", label: "Polityka prywatności", href: "/polityka-prywatnosci" },
] as const;

export default function LegalPage({ title, current, children }: LegalPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-24 sm:pt-14">
      {legalIncomplete && process.env.NODE_ENV !== "production" && (
        <p className="mb-8 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          Widzisz to tylko w trybie deweloperskim: uzupełnij dane w{" "}
          <code className="font-mono">app/lib/legal.ts</code> przed publikacją strony.
        </p>
      )}

      <nav aria-label="Dokumenty" className="flex gap-1 rounded-xl bg-mist p-1 text-sm w-fit dark:bg-white/5">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={tab.key === current ? "page" : undefined}
            className={`rounded-lg px-4 py-2 duration-200 ${
              tab.key === current
                ? "bg-white font-semibold text-ink shadow-sm dark:bg-[#0f1f1e] dark:text-white"
                : "text-ink/65 hover:text-ink dark:text-white/65 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <h1 className="mt-8 text-[2.5rem] leading-[1.1] font-semibold tracking-[-0.025em] text-ink dark:text-white">
        {title}
      </h1>
      <p className="mt-3 text-sm text-ink/55 dark:text-white/55">Ostatnia aktualizacja: {LEGAL.updated}</p>

      <div className="legal mt-10">{children}</div>
    </div>
  );
}

/** Sekcja dokumentu z nagłówkiem, np. "§ 1. Postanowienia ogólne" */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-semibold text-ink dark:text-white">{title}</h2>
      <div className="mt-4 flex flex-col gap-3 leading-relaxed text-ink/80 dark:text-white/80">
        {children}
      </div>
    </section>
  );
}

/** Lista numerowana punktów (ust. 1, 2, 3…) */
export function Points({ children }: { children: ReactNode }) {
  return (
    <ol className="flex list-decimal flex-col gap-2 pl-6 marker:text-ink/45 dark:marker:text-white/45">
      {children}
    </ol>
  );
}

/** Lista punktowana */
export function Bullets({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-1.5 pl-6 marker:text-brand">{children}</ul>;
}
