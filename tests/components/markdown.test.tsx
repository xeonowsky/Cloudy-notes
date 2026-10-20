import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Markdown from "@/app/components/markdown";

const renderMd = (content: string) => render(<Markdown content={content} />).container;

describe("Markdown", () => {
  it("nagłówki # ## ### zamienia na h2–h4", () => {
    renderMd("# Duży\n## Średni\n### Mały");
    expect(screen.getByRole("heading", { level: 2, name: "Duży" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Średni" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Mały" })).toBeInTheDocument();
  });

  it("formatowanie w linii", () => {
    const html = renderMd("**gruby** *kursywa* ~~skreślony~~ ==zakreślony== `kod`").innerHTML;
    expect(html).toContain("<strong>gruby</strong>");
    expect(html).toContain("<em>kursywa</em>");
    expect(html).toContain("<s>skreślony</s>");
    expect(html).toMatch(/<mark[^>]*>zakreślony<\/mark>/);
    expect(html).toMatch(/<code[^>]*>kod<\/code>/);
  });

  it("formatowanie można zagnieżdżać", () => {
    expect(renderMd("**gruby z ==zakreśleniem==**").querySelector("strong mark")).toBeTruthy();
    expect(renderMd("~~skreślony `kod`~~").querySelector("s code")).toBeTruthy();
  });

  // ZNANY BŁĄD: regex pogrubienia \*\*[^*]+\*\* nie dopuszcza gwiazdki w środku,
  // więc kursywa wewnątrz pogrubienia się nie składa.
  // it.fails = test "przechodzi", dopóki błąd istnieje. Gdy go naprawisz,
  // Vitest zgłosi ten test — wtedy zamień it.fails na zwykłe it.
  it.fails("ZNANY BŁĄD: kursywa wewnątrz pogrubienia", () => {
    expect(renderMd("**gruby z *kursywą***").querySelector("strong em")).toBeTruthy();
  });

  it("bezpieczne linki otwiera w nowej karcie", () => {
    renderMd("[Strona](https://example.com)");
    const link = screen.getByRole("link", { name: "Strona" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("link javascript: zostaje zwykłym tekstem (ochrona przed XSS)", () => {
    renderMd("[kliknij](javascript:alert(1))");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("kliknij")).toBeInTheDocument();
  });

  it("HTML w treści jest pokazywany jako tekst, a nie wykonywany", () => {
    const container = renderMd('<script>alert("x")</script><img src=x onerror=alert(1)>');
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<script>");
  });

  it("listy punktowane i numerowane", () => {
    renderMd("- a\n- b\n\n1. jeden\n2. dwa");
    const lists = screen.getAllByRole("list");
    expect(lists[0].tagName).toBe("UL");
    expect(lists[1].tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("checklista ma zaznaczone i niezaznaczone pola (tylko do odczytu)", () => {
    renderMd("- [x] zrobione\n- [ ] do zrobienia");
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes[0]).toBeChecked();
    expect(boxes[1]).not.toBeChecked();
    expect(boxes[0]).toBeDisabled();
  });

  it("cytat, linia pozioma i blok kodu", () => {
    const container = renderMd("> cytat\n\n---\n\n```\nconst a = **1**;\n```");
    expect(container.querySelector("blockquote")).toHaveTextContent("cytat");
    expect(container.querySelector("hr")).toBeTruthy();
    // w bloku kodu formatowanie NIE działa
    expect(container.querySelector("pre code")).toHaveTextContent("const a = **1**;");
  });

  it("kolejne linie akapitu łączy z <br>, puste linie rozdzielają akapity", () => {
    const container = renderMd("linia 1\nlinia 2\n\nnowy akapit\r\nz Windowsa");
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].querySelectorAll("br")).toHaveLength(1);
    expect(paragraphs[1]).toHaveTextContent("nowy akapitz Windowsa");
  });
});
