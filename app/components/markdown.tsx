import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────
// Prosty renderer Markdowna → elementy Reacta.
//
// Dlaczego własny i dlaczego bez dangerouslySetInnerHTML?
// Zamieniamy tekst na komponenty Reacta, a React sam escapuje tekst.
// Jeśli ktoś wpisze <script>, zobaczy go jako zwykły tekst — XSS niemożliwy.
//
// Obsługiwane:
//   # ## ###        nagłówki          **tekst**   pogrubienie
//   - lista         * lista           *tekst*     kursywa
//   1. lista numerowana               ~~tekst~~   przekreślenie
//   - [ ] / - [x]   checklista        ==tekst==   zakreślacz
//   > cytat         --- linia         `kod`       kod w linii
//   ```  blok kodu  ```               [tekst](https://adres)  link
// ─────────────────────────────────────────────────────────────

// ---------- Elementy w linii (pogrubienie, kursywa, linki…) ----------

const INLINE_PATTERN =
  /(\*\*[^*]+\*\*|~~[^~]+~~|==[^=]+==|`[^`]+`|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g;

function renderInline(text: string, keyPrefix = "i"): ReactNode[] {
  // split z grupą w regexie zostawia dopasowania w tablicy:
  // "a **b** c" → ["a ", "**b**", " c"]
  return text
    .split(INLINE_PATTERN)
    .filter((part) => part !== "")
    .map((part, i) => {
      const key = `${keyPrefix}-${i}`;

      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={key}>{renderInline(part.slice(2, -2), key)}</strong>;
      }
      if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) {
        return <s key={key}>{renderInline(part.slice(2, -2), key)}</s>;
      }
      if (part.startsWith("==") && part.endsWith("==") && part.length > 4) {
        return (
          <mark key={key} className="bg-yellow-200 rounded px-0.5">
            {renderInline(part.slice(2, -2), key)}
          </mark>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code key={key} className="bg-black/10 rounded px-1 py-0.5 text-[0.9em] font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <em key={key}>{renderInline(part.slice(1, -1), key)}</em>;
      }

      const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (link) {
        const [, label, href] = link;
        // Tylko bezpieczne protokoły — "javascript:alert(1)" nie przejdzie
        if (/^(https?:\/\/|mailto:)/i.test(href)) {
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3a9e9a] underline hover:text-[#68cbc7]"
            >
              {label}
            </a>
          );
        }
        return <span key={key}>{label}</span>;
      }

      return part;
    });
}

// ---------- Bloki (nagłówki, listy, cytaty…) ----------

type ListItem = { text: string; checked?: boolean };

export default function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;

  // Zbiera kolejne linie pasujące do wzorca (np. wszystkie punkty listy)
  const collect = (pattern: RegExp): RegExpMatchArray[] => {
    const matches: RegExpMatchArray[] = [];
    let m: RegExpMatchArray | null;
    while (i < lines.length && (m = lines[i].match(pattern))) {
      matches.push(m);
      i++;
    }
    return matches;
  };

  while (i < lines.length) {
    const line = lines[i];
    const key = `b-${i}`;

    // Pusta linia — odstęp między blokami
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Blok kodu ``` … ```
    if (line.trim().startsWith("```")) {
      i++;
      const code: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // pomiń zamykające ```
      blocks.push(
        <pre key={key} className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm font-mono">
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Nagłówki
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const children = renderInline(heading[2], key);
      if (level === 1) blocks.push(<h2 key={key} className="text-2xl font-bold">{children}</h2>);
      else if (level === 2) blocks.push(<h3 key={key} className="text-xl font-bold">{children}</h3>);
      else blocks.push(<h4 key={key} className="text-lg font-semibold">{children}</h4>);
      i++;
      continue;
    }

    // Linia pozioma
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(<hr key={key} className="border-black/15" />);
      i++;
      continue;
    }

    // Cytat
    if (/^>\s?/.test(line)) {
      const quote = collect(/^>\s?(.*)$/).map((m) => m[1]);
      blocks.push(
        <blockquote key={key} className="border-l-4 border-[#68cbc7] pl-4 italic text-gray-700">
          {quote.map((q, j) => (
            <p key={j}>{renderInline(q, `${key}-${j}`)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    // Checklista — musi być sprawdzona PRZED zwykłą listą, bo też zaczyna się od "- "
    if (/^[-*]\s+\[[ xX]\]\s/.test(line)) {
      const items: ListItem[] = collect(/^[-*]\s+\[([ xX])\]\s+(.*)$/).map((m) => ({
        checked: m[1] !== " ",
        text: m[2],
      }));
      blocks.push(
        <ul key={key} className="flex flex-col gap-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={item.checked}
                readOnly
                disabled
                className="mt-1.5 accent-[#68cbc7]"
              />
              <span className={item.checked ? "line-through text-gray-500" : ""}>
                {renderInline(item.text, `${key}-${j}`)}
              </span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Lista punktowana
    if (/^[-*]\s+/.test(line)) {
      const items = collect(/^[-*]\s+(.*)$/).map((m) => m[1]);
      blocks.push(
        <ul key={key} className="list-disc pl-6 flex flex-col gap-1">
          {items.map((text, j) => (
            <li key={j}>{renderInline(text, `${key}-${j}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Lista numerowana
    if (/^\d+\.\s+/.test(line)) {
      const items = collect(/^\d+\.\s+(.*)$/).map((m) => m[1]);
      blocks.push(
        <ol key={key} className="list-decimal pl-6 flex flex-col gap-1">
          {items.map((text, j) => (
            <li key={j}>{renderInline(text, `${key}-${j}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Akapit — zbieramy kolejne "zwykłe" linie
    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3}\s|>|[-*]\s|\d+\.\s|```|-{3,}$)/.test(lines[i])
    ) {
      paragraph.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key}>
        {paragraph.map((text, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {renderInline(text, `${key}-${j}`)}
          </span>
        ))}
      </p>,
    );
  }

  return <div className="flex flex-col gap-3 leading-relaxed break-words">{blocks}</div>;
}
