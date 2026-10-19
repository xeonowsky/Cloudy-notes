// Te same reguły co w SignupSchema (definitions.ts) — tutaj tylko do podpowiedzi
// na żywo. Ostateczne sprawdzenie i tak robi serwer.
const RULES = [
  { label: "Co najmniej 8 znaków", test: (v: string) => v.length >= 8 },
  { label: "Litera", test: (v: string) => /[a-zA-Z]/.test(v) },
  { label: "Cyfra", test: (v: string) => /[0-9]/.test(v) },
];

export default function PasswordRequirements({ value, showErrors }: { value: string; showErrors: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm" aria-label="Wymagania hasła">
      {RULES.map((rule) => {
        const met = rule.test(value);
        const failed = !met && showErrors;
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 duration-200 ${
              met
                ? "text-brand-deep dark:text-brand"
                : failed
                  ? "text-danger dark:text-[#f9a8a0]"
                  : "text-ink/50 dark:text-white/45"
            }`}
          >
            <span
              className={`grid size-4 place-items-center rounded-[5px] border-[1.5px] duration-200 ${
                met ? "border-brand-deep bg-brand-deep dark:border-brand dark:bg-brand" : "border-current"
              }`}
              aria-hidden
            >
              {met && (
                <svg viewBox="0 0 12 12" className="size-2.5 text-white dark:text-ink" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m2.5 6.2 2.3 2.3 4.7-5" />
                </svg>
              )}
            </span>
            {rule.label}
            <span className="sr-only">{met ? " — spełnione" : " — niespełnione"}</span>
          </li>
        );
      })}
    </ul>
  );
}
