"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import Markdown from "./markdown";
import SubmitButton from "./submit-button";
import { NOTE_COLORS, type NoteColor } from "@/app/lib/note-colors";
import type { NoteFormState } from "@/app/lib/definitions";
import { PRIORITIES, type Priority } from "@/app/lib/priority";

type ToolId =
  | "bold"
  | "italic"
  | "strike"
  | "highlight"
  | "code"
  | "link"
  | "h1"
  | "h2"
  | "ul"
  | "ol"
  | "todo"
  | "quote"
  | "hr";

type NoteAction = (state: NoteFormState, formData: FormData) => Promise<NoteFormState>;

interface NoteEditorProps {
  action: NoteAction;
  submitLabel: string;
  initial?: { title: string; content: string; color: NoteColor; priority: Priority; pinned: boolean };
}

export default function NoteEditor({ action, submitLabel, initial }: NoteEditorProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [content, setContent] = useState(initial?.content ?? "");
  const [color, setColor] = useState<NoteColor>(initial?.color ?? "white");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Wysyłamy formularz ręcznie zamiast przez <form action>, bo React 19
  // po <form action> czyści pola — a po błędzie walidacji nie chcemy
  // stracić treści notatki.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  // ---------- Pasek formatowania ----------

  // Zmienia tekst i po odświeżeniu ustawia zaznaczenie w textarea
  function applyEdit(next: string, selStart: number, selEnd: number) {
    setContent(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  }

  // Otacza zaznaczenie znacznikami, np. **zaznaczenie**
  function wrap(before: string, after = before, placeholder = "tekst") {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = content.slice(start, end) || placeholder;
    const next = content.slice(0, start) + before + selected + after + content.slice(end);
    applyEdit(next, start + before.length, start + before.length + selected.length);
  }

  // Dodaje prefiks na początku każdej zaznaczonej linii, np. "- " albo "# "
  function prefixLines(makePrefix: (index: number) => string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const lineEndIdx = content.indexOf("\n", end);
    const lineEnd = lineEndIdx === -1 ? content.length : lineEndIdx;

    const block = content
      .slice(lineStart, lineEnd)
      .split("\n")
      .map((line, i) => makePrefix(i) + line)
      .join("\n");

    const next = content.slice(0, lineStart) + block + content.slice(lineEnd);
    applyEdit(next, lineStart, lineStart + block.length);
  }

  // Wstawia gotowy fragment w miejscu kursora
  function insert(snippet: string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const next = content.slice(0, start) + snippet + content.slice(end);
    applyEdit(next, start + snippet.length, start + snippet.length);
  }

  // Pasek narzędzi jako zwykłe dane — co pokazać na przycisku.
  // Co ma się stać po kliknięciu, decyduje funkcja runTool niżej.
  const tools: { id: ToolId; label: string; title: string; className?: string }[] = [
    { id: "bold", label: "B", title: "Pogrubienie (Ctrl+B)", className: "font-bold" },
    { id: "italic", label: "I", title: "Kursywa (Ctrl+I)", className: "italic" },
    { id: "strike", label: "S", title: "Przekreślenie", className: "line-through" },
    { id: "highlight", label: "Zakreśl", title: "Zakreślacz", className: "bg-yellow-200 px-1 rounded" },
    { id: "h1", label: "H1", title: "Duży nagłówek" },
    { id: "h2", label: "H2", title: "Mniejszy nagłówek" },
    { id: "ul", label: "• Lista", title: "Lista punktowana" },
    { id: "ol", label: "1. Lista", title: "Lista numerowana" },
    { id: "todo", label: "☑ Zadania", title: "Checklista" },
    { id: "quote", label: "❝ Cytat", title: "Cytat" },
    { id: "code", label: "</>", title: "Kod", className: "font-mono" },
    { id: "link", label: "Link", title: "Link" },
    { id: "hr", label: "—", title: "Linia oddzielająca" },
  ];

  function runTool(id: ToolId) {
    switch (id) {
      case "bold":
        return wrap("**");
      case "italic":
        return wrap("*");
      case "strike":
        return wrap("~~");
      case "highlight":
        return wrap("==");
      case "code":
        return wrap("`");
      case "link":
        return wrap("[", "](https://)", "opis linku");
      case "h1":
        return prefixLines(() => "# ");
      case "h2":
        return prefixLines(() => "## ");
      case "ul":
        return prefixLines(() => "- ");
      case "ol":
        return prefixLines((i) => `${i + 1}. `);
      case "todo":
        return prefixLines(() => "- [ ] ");
      case "quote":
        return prefixLines(() => "> ");
      case "hr":
        return insert("\n---\n");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      runTool("bold");
    } else if (key === "i") {
      event.preventDefault();
      runTool("italic");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-5 border-2 rounded-2xl p-6 sm:p-8 text-gray-900 duration-300 ${NOTE_COLORS[color].card}`}
    >
      {state?.message && (
        <p role="alert" className="rounded-lg bg-red-50 border border-red-200 text-red-600 p-3 text-sm">
          {state.message}
        </p>
      )}

      {/* Tytuł */}
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="font-bold">
          Tytuł
        </label>
        <input
          id="title"
          name="title"
          defaultValue={initial?.title}
          maxLength={100}
          placeholder="Np. Pomysły na weekend"
          aria-invalid={!!state?.errors?.title}
          className="border-2 border-blue-300 bg-white p-3 rounded-2xl outline-none focus:border-[#68cbc7] text-lg"
        />
        {state?.errors?.title && <p className="text-sm text-red-500">{state.errors.title[0]}</p>}
      </div>

      {/* Treść: zakładki Edycja / Podgląd */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-bold">Treść</span>
          <div className="flex rounded-full border-2 border-[#68cbc7] overflow-hidden text-sm">
            {(["edit", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-1 cursor-pointer duration-300 ${
                  tab === t ? "bg-[#68cbc7] text-white" : "bg-white hover:bg-[#68cbc7]/10"
                }`}
              >
                {t === "edit" ? "Edycja" : "Podgląd"}
              </button>
            ))}
          </div>
        </div>

        {tab === "edit" && (
          <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Formatowanie">
            {tools.map((tool) => (
              <button
                key={tool.title}
                type="button"
                title={tool.title}
                onClick={() => runTool(tool.id)}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-sm hover:border-[#68cbc7] hover:bg-[#68cbc7]/10 duration-200 cursor-pointer"
              >
                <span className={tool.className}>{tool.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* textarea zostaje w DOM także w podglądzie (hidden), żeby trafiła do FormData */}
        <textarea
          ref={textareaRef}
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={14}
          placeholder={"Zacznij pisać…\n\nZaznacz tekst i użyj przycisków powyżej, żeby go sformatować."}
          className={`border-2 border-blue-300 bg-white p-4 rounded-2xl outline-none focus:border-[#68cbc7] font-mono text-sm leading-relaxed resize-y ${
            tab === "edit" ? "" : "hidden"
          }`}
        />

        {tab === "preview" && (
          <div className="min-h-64 bg-white/60 border-2 border-dashed border-gray-300 rounded-2xl p-5">
            {content.trim() ? (
              <Markdown content={content} />
            ) : (
              <p className="text-gray-400">Nic tu jeszcze nie ma.</p>
            )}
          </div>
        )}

        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {state?.errors?.content?.[0] && <span className="text-red-500">{state.errors.content[0]}</span>}
          </span>
          <span>{content.length} / 20 000</span>
        </div>
      </div>

      {/* Kategoria = kolor karty */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">Kategoria</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(NOTE_COLORS) as NoteColor[]).map((key) => (
            <label key={key} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={key}
                checked={color === key}
                onChange={() => setColor(key)}
                className="peer sr-only"
              />
              <span
                className={`flex items-center gap-2 rounded-full border-2 border-black/10 bg-white px-3 py-1.5 text-sm duration-200 peer-checked:border-brand-deep peer-checked:font-semibold peer-focus-visible:ring-4 peer-focus-visible:ring-brand/40`}
              >
                <span
                  aria-hidden
                  className={`size-4 rounded-full border border-black/10 ${NOTE_COLORS[key].swatch}`}
                />
                {NOTE_COLORS[key].category}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Ważność */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">Ważność</legend>
        <div className="flex w-fit rounded-xl border-2 border-black/10 bg-white p-1">
          {PRIORITIES.slice()
            .reverse()
            .map((p) => (
              <label key={p.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  defaultChecked={(initial?.priority ?? 1) === p.value}
                  className="peer sr-only"
                />
                <span
                  className={`block rounded-lg px-4 py-1.5 text-sm duration-200 peer-checked:font-semibold peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-brand/40 ${
                    p.value === 2 ? "peer-checked:bg-danger" : "peer-checked:bg-brand-deep"
                  }`}
                >
                  {p.label}
                </span>
              </label>
            ))}
        </div>
        {state?.errors?.priority && <p className="text-sm text-red-500">{state.errors.priority[0]}</p>}
      </fieldset>

      {/* Przypięcie */}
      <label className="flex items-center gap-3 cursor-pointer w-fit">
        <input
          type="checkbox"
          name="pinned"
          defaultChecked={initial?.pinned}
          className="size-5 accent-[#68cbc7]"
        />
        <span>Przypnij na górze listy</span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-48">
          <SubmitButton pending={pending} text={submitLabel} pendingText="Zapisywanie…" />
        </div>
        <Link href="/notatki" className="text-sm hover:text-[#68cbc7] duration-300 mt-2">
          Anuluj
        </Link>
      </div>
    </form>
  );
}
