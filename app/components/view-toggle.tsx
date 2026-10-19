import { setNotesView } from "@/app/actions/notes";
import type { NotesView } from "@/app/lib/notes-view";

const OPTIONS: { value: NotesView; label: string; icon: string }[] = [
  { value: "siatka", label: "Siatka", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { value: "lista", label: "Lista", icon: "M4 4h6v16H4zM13 5h7M13 10h7M13 15h7M13 20h4" },
];

// Każda opcja to mały formularz wywołujący Server Action, która zapisuje
// wybór w ciasteczku. Działa nawet bez JavaScriptu.
export default function ViewToggle({ current }: { current: NotesView }) {
  return (
    <div role="group" aria-label="Widok notatek" className="flex rounded-xl bg-mist p-1 dark:bg-white/5">
      {OPTIONS.map((option) => {
        const active = option.value === current;
        return (
          <form key={option.value} action={setNotesView.bind(null, option.value)}>
            <button
              type="submit"
              aria-pressed={active}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm duration-200 ${
                active
                  ? "bg-white font-semibold text-ink shadow-sm dark:bg-[#0f1f1e] dark:text-white"
                  : "text-ink/60 hover:text-ink dark:text-white/60 dark:hover:text-white"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
                aria-hidden
              >
                <path d={option.icon} />
              </svg>
              {option.label}
            </button>
          </form>
        );
      })}
    </div>
  );
}
