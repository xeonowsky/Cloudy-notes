// Stopnie ważności notatki. W bazie zapisujemy liczbę (0–2),
// bo po liczbie łatwo sortować: ORDER BY priority DESC.

export type Priority = 0 | 1 | 2;

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 2, label: "Wysoki" },
  { value: 1, label: "Normalny" },
  { value: 0, label: "Niski" },
];

export function priorityLabel(priority: Priority): string {
  return PRIORITIES.find((p) => p.value === priority)?.label ?? "Normalny";
}
