import AddMenu, { type AddKind } from "./add-menu";

export type Tool = "select" | "hand" | "rect" | "text" | "connect";

type Props = {
  tool: Tool;
  scale: number;
  onTool: (tool: Tool) => void;
  onAdd: (kind: AddKind) => void;
  onZoom: (factor: number) => void;
  onFit: () => void;
  fullscreen: boolean;
  onFullscreen: () => void;
};

const btn =
  "flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium duration-200 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none";
const idle = "text-ink/70 hover:bg-mist dark:text-white/70 dark:hover:bg-white/5";
const active = "bg-mist text-brand-deep dark:bg-white/10 dark:text-brand";

// Ikony jako małe SVG — bez dodatkowej biblioteki
const icons: Record<Tool, React.ReactNode> = {
  select: <path d="M5 3l10 6-4.5 1.2L8.8 15z" />,
  // dłoń: cztery palce + kciuk
  hand: (
    <path d="M7 10V4.5a1.25 1.25 0 0 1 2.5 0V9m0-5.5v-.75a1.25 1.25 0 0 1 2.5 0V9m0-5a1.25 1.25 0 0 1 2.5 0V10m0-3.5a1.25 1.25 0 0 1 2.5 0V12a6 6 0 0 1-6 6h-.6a5 5 0 0 1-3.9-1.9L3.3 12.6a1.3 1.3 0 0 1 2-1.7L7 12.5" />
  ),
  rect: <rect x="3.5" y="5" width="13" height="10" rx="2" />,
  text: <path d="M4 5h12M10 5v11M7.5 16h5" />,
  connect: (
    <>
      <circle cx="4.5" cy="15.5" r="2" />
      <circle cx="15.5" cy="4.5" r="2" />
      <path d="M6 14 14 6" />
    </>
  ),
};

const TOOLS: { tool: Tool; label: string; key: string }[] = [
  { tool: "select", label: "Zaznacz", key: "V" },
  { tool: "hand", label: "Rączka", key: "H / spacja" },
  { tool: "rect", label: "Prostokąt", key: "R" },
  { tool: "text", label: "Tekst", key: "T" },
  { tool: "connect", label: "Połącz", key: "C" },
];

export default function Toolbar({ tool, scale, onTool, onAdd, onZoom, onFit, fullscreen, onFullscreen }: Props) {
  return (
    <div className="absolute top-4 left-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-1 rounded-xl border border-line bg-white/95 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#0f1f1e]/95">
      <AddMenu onAdd={onAdd} />

      <span aria-hidden className="mx-1 h-6 w-px bg-line dark:bg-white/10" />

      {/* role="radiogroup": dokładnie jedno narzędzie jest aktywne */}
      <div role="radiogroup" aria-label="Narzędzia" className="flex items-center gap-1">
        {TOOLS.map(({ tool: t, label, key }) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tool === t}
            onClick={() => onTool(t)}
            title={`${label} (${key})`}
            className={`${btn} ${tool === t ? active : idle}`}
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
              {icons[t]}
            </svg>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <span aria-hidden className="mx-1 h-6 w-px bg-line dark:bg-white/10" />

      <button type="button" onClick={() => onZoom(1 / 1.2)} aria-label="Oddal" className={`${btn} ${idle}`}>
        −
      </button>
      <span className="w-11 text-center text-xs text-ink/60 tabular-nums dark:text-white/60">{Math.round(scale * 100)}%</span>
      <button type="button" onClick={() => onZoom(1.2)} aria-label="Przybliż" className={`${btn} ${idle}`}>
        +
      </button>
      <button type="button" onClick={onFit} className={`${btn} ${idle}`}>
        Dopasuj
      </button>

      <span aria-hidden className="mx-1 h-6 w-px bg-line dark:bg-white/10" />

      <button
        type="button"
        onClick={onFullscreen}
        aria-pressed={fullscreen}
        title={fullscreen ? "Wyjdź z pełnego ekranu (F lub Esc)" : "Pełny ekran (F)"}
        className={`${btn} ${fullscreen ? active : idle}`}
      >
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {fullscreen ? (
            <path d="M8 3v5H3M12 3v5h5M17 12h-5v5M3 12h5v5" />
          ) : (
            <path d="M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5" />
          )}
        </svg>
        <span className="hidden sm:inline">{fullscreen ? "Wyjdź" : "Pełny ekran"}</span>
      </button>
    </div>
  );
}
