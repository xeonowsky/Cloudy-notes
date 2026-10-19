import type { ReactNode } from "react";
import SampleNotes, { type SampleNote } from "./sample-notes";

interface AuthShellProps {
  title: string;
  subtitle: string;
  notes: SampleNote[];
  caption: string;
  children: ReactNode;
}

// Wspólny układ stron logowania i rejestracji:
// po lewej formularz, po prawej "niebo" z przykładowymi notatkami.
export default function AuthShell({ title, subtitle, notes, caption, children }: AuthShellProps) {
  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 pt-6 pb-12 sm:pt-10 lg:grid-cols-2 lg:gap-14">
      <section className="flex items-center">
        <div className="mx-auto w-full max-w-[26rem] lg:mr-2 lg:ml-auto">
          <h1 className="text-[2.5rem] leading-[1.1] font-semibold tracking-[-0.025em] text-ink dark:text-[#e3f1f0]">
            {title}
          </h1>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink/70 dark:text-[#e3f1f0]/70">
            {subtitle}
          </p>
          <div className="mt-9">{children}</div>
        </div>
      </section>

      {/* Panel dekoracyjny — ukryty na telefonach i dla czytników ekranu */}
      <aside
        aria-hidden
        className="relative hidden min-h-[38rem] flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-mist px-10 pt-12 pb-28 lg:flex dark:bg-[#12302e]"
      >
        <SampleNotes notes={notes} />
        <p className="relative z-10 mt-10 max-w-xs text-center text-sm leading-relaxed text-ink/65 dark:text-[#e3f1f0]/60">
          {caption}
        </p>
        <CloudBank />
      </aside>
    </div>
  );
}

function CloudBank() {
  return (
    <svg
      viewBox="0 0 600 140"
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 h-32 w-full text-white dark:text-white/[0.06]"
      fill="currentColor"
    >
      <path d="M0 140V92c26-24 66-30 96-12 16-40 70-52 104-22 22-36 84-40 112-2 30-26 80-24 102 8 30-30 88-26 110 12 26-16 52-14 76 4v62z" opacity="0.55" />
      <path d="M0 140v-30c34-22 78-20 100 4 24-30 76-34 104-4 28-24 74-22 96 6 26-22 70-20 92 6 30-24 82-20 104 8 30-18 72-14 104 10v0z" />
    </svg>
  );
}
