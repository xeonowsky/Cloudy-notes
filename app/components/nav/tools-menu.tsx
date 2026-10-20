"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FeatureIcon from "../feature-icon";
import { useDropdown } from "./use-dropdown";
import { isToolActive, TOOLS } from "@/app/lib/tools";

// Rozwijane menu "Narzędzia" (Notatki, Board) — po prawej stronie nagłówka,
// obok Kontaktu. Panel jest wyrównany do prawej (right-0), żeby nie wychodził
// poza ekran. Przycisk jest podkreślony, gdy jesteś w którymś z narzędzi.
export default function ToolsMenu() {
  const { open, rootRef, panelId, toggle, close, buttonProps } = useDropdown();
  const pathname = usePathname();
  const inTool = TOOLS.some((tool) => isToolActive(tool, pathname));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        {...buttonProps}
        className={`relative flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-[0.9375rem] duration-200 hover:bg-mist hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none dark:hover:bg-white/5 dark:hover:text-white ${
          open ? "bg-mist text-ink dark:bg-white/5 dark:text-white" : inTool ? "font-semibold text-ink dark:text-white" : "text-ink/65 dark:text-white/65"
        } ${inTool ? "after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-brand" : ""}`}
      >
        Narzędzia
        <svg viewBox="0 0 20 20" className={`size-4 duration-200 ${open ? "rotate-180" : ""}`} fill="currentColor" aria-hidden>
          <path d="M5.2 7.7a.75.75 0 0 1 1.06 0L10 11.44l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.76a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute top-[calc(100%+12px)] right-0 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-2 shadow-[0_28px_60px_-28px_rgba(22,48,47,0.45)] dark:border-white/10 dark:bg-[#0f1f1e]"
        >
          <ul className="flex flex-col gap-1">
            {TOOLS.map((tool) => {
              const active = isToolActive(tool, pathname);
              return (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={`flex gap-3 rounded-xl p-3 duration-200 hover:bg-mist/70 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none dark:hover:bg-white/5 ${
                      active ? "bg-mist/70 dark:bg-white/5" : ""
                    }`}
                  >
                    <FeatureIcon icon={tool.icon} />
                    <span>
                      <span className="block font-semibold text-ink dark:text-white">{tool.title}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-ink/60 dark:text-white/60">
                        {tool.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
