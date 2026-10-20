// Lista zadań na tablicy jest zapisana w kolumnie text jako zwykły Markdown:
//
//   # Nauka Reacta
//   - [x] Komponenty i propsy
//   - [ ] useEffect
//
// Dzięki temu nie potrzeba osobnej tabeli, a treść da się przeczytać
// (i skopiować do notatki) bez żadnego dekodowania.

export type ChecklistItem = { done: boolean; text: string };
export type Checklist = { title: string; items: ChecklistItem[] };

const ITEM = /^\s*[-*] \[( |x|X)\] ?(.*)$/;

export function parseChecklist(text: string): Checklist {
  let title = "";
  const items: ChecklistItem[] = [];
  for (const line of text.split("\n")) {
    const match = ITEM.exec(line);
    if (match) items.push({ done: match[1] !== " ", text: match[2] });
    else if (!title && line.trim()) title = line.replace(/^#+\s*/, "").trim(); // pierwsza "zwykła" linia = tytuł
  }
  return { title, items };
}

export function serializeChecklist({ title, items }: Checklist): string {
  const lines = items.map((item) => `- [${item.done ? "x" : " "}] ${item.text.replace(/\n/g, " ")}`);
  if (title.trim()) lines.unshift(`# ${title.trim()}`);
  return lines.join("\n");
}
