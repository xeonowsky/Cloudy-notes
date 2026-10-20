import type { FeatureIcon as Icon } from "@/app/lib/features";

const PATHS: Record<Icon, string> = {
  format: "M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z",
  list: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  color: "M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 22 9.8C22 6 17.5 3 12 3zM7.5 12a1 1 0 1 0 0-.01M10 7.5a1 1 0 1 0 0-.01M15 7.5a1 1 0 1 0 0-.01",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  notes: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
  board: "M3 4h18v12H3zM12 16v4M8 20h8M7 8h4M7 12h7M15 8h2",
};

export default function FeatureIcon({ icon, className = "" }: { icon: Icon; className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid size-10 shrink-0 place-items-center rounded-xl bg-mist text-brand-deep dark:bg-white/5 dark:text-brand ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={PATHS[icon]} />
      </svg>
    </span>
  );
}
