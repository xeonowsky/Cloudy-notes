import { describe, expect, it } from "vitest";
import {
  LoginSchema,
  NoteIdSchema,
  NoteSchema,
  RoadmapEdgeSchema,
  RoadmapNodeSchema,
  RoadmapNodeUpdateSchema,
  RoadmapPositionSchema,
  RoadmapShapeSchema,
  RoadmapShapeUpdateSchema,
  SignupSchema,
  toFieldErrors,
} from "@/app/lib/definitions";
import { UUID_A, UUID_B } from "../../helpers/sql";

// Pomocnik: lista pól z błędami po walidacji
function errorFields(result: { success: boolean; error?: Parameters<typeof toFieldErrors>[0] }) {
  return result.success ? [] : Object.keys(toFieldErrors(result.error!));
}

const validSignup = {
  name: "  Klaudiusz ",
  email: "  Klaudiusz@Example.COM ",
  password: "haslo1234",
  confirmPassword: "haslo1234",
  terms: "on",
};

describe("SignupSchema", () => {
  it("przepuszcza poprawne dane i je czyści (trim, małe litery w e-mailu)", () => {
    const result = SignupSchema.safeParse(validSignup);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ name: "Klaudiusz", email: "klaudiusz@example.com" });
  });

  it("nie przycina hasła — spacja to też znak", () => {
    const result = SignupSchema.safeParse({ ...validSignup, password: " haslo123 ", confirmPassword: " haslo123 " });
    expect(result.data?.password).toBe(" haslo123 ");
  });

  it.each([
    ["za krótkie imię", { name: "K" }, "name"],
    ["za długie imię", { name: "x".repeat(51) }, "name"],
    ["zły e-mail", { email: "to-nie-email" }, "email"],
    ["pusty e-mail", { email: "   " }, "email"],
    ["hasło bez cyfry", { password: "samelitery", confirmPassword: "samelitery" }, "password"],
    ["hasło bez litery", { password: "12345678", confirmPassword: "12345678" }, "password"],
    ["za krótkie hasło", { password: "abc12", confirmPassword: "abc12" }, "password"],
    ["różne hasła", { confirmPassword: "inne1234" }, "confirmPassword"],
    ["brak zgody na regulamin", { terms: undefined }, "terms"],
  ])("odrzuca: %s", (_label, patch, field) => {
    const result = SignupSchema.safeParse({ ...validSignup, ...patch });
    expect(result.success).toBe(false);
    expect(errorFields(result)).toContain(field);
  });

  it("zbiera wszystkie błędy hasła naraz", () => {
    const result = SignupSchema.safeParse({ ...validSignup, password: "", confirmPassword: "" });
    const errors: Record<string, string[] | undefined> = toFieldErrors(result.error!);
    expect(errors.password).toEqual([
      "Co najmniej 8 znaków.",
      "Co najmniej jedna litera.",
      "Co najmniej jedna cyfra.",
    ]);
  });
});

describe("LoginSchema", () => {
  it("normalizuje e-mail i nie sprawdza reguł hasła", () => {
    const result = LoginSchema.safeParse({ email: " A@B.PL ", password: "x" });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("a@b.pl");
  });

  it("wymaga hasła", () => {
    expect(errorFields(LoginSchema.safeParse({ email: "a@b.pl", password: "" }))).toEqual(["password"]);
  });
});

describe("NoteSchema", () => {
  it("uzupełnia wartości domyślne", () => {
    const result = NoteSchema.safeParse({ title: "Tytuł" });
    expect(result.data).toEqual({ title: "Tytuł", content: "", color: "white", priority: 1, pinned: false });
  });

  it('zamienia checkbox "on" na true, a priorytet z tekstu na liczbę', () => {
    const result = NoteSchema.safeParse({ title: "T", pinned: "on", priority: "2", color: "yellow" });
    expect(result.data).toMatchObject({ pinned: true, priority: 2, color: "yellow" });
  });

  it.each([
    ["pusty tytuł", { title: "   " }, "title"],
    ["za długi tytuł", { title: "x".repeat(101) }, "title"],
    ["za długa treść", { title: "T", content: "x".repeat(20_001) }, "content"],
    ["nieznany kolor", { title: "T", color: "neon" }, "color"],
    ["zły priorytet", { title: "T", priority: "5" }, "priority"],
    ["podmieniony checkbox", { title: "T", pinned: "true" }, "pinned"],
  ])("odrzuca: %s", (_label, input, field) => {
    expect(errorFields(NoteSchema.safeParse(input))).toContain(field);
  });
});

describe("NoteIdSchema", () => {
  it("akceptuje tylko UUID", () => {
    expect(NoteIdSchema.safeParse(UUID_A).success).toBe(true);
    expect(NoteIdSchema.safeParse("1 OR 1=1").success).toBe(false);
  });
});

describe("schematy Board", () => {
  const node = { id: UUID_A, title: " React ", category: " Frontend ", status: "learning", x: 10, y: -20 };

  it("RoadmapNodeSchema przycina tekst i przepuszcza poprawną kartę", () => {
    const result = RoadmapNodeSchema.safeParse(node);
    expect(result.data).toEqual({ ...node, title: "React", category: "Frontend" });
  });

  it.each([
    ["pusta nazwa", { title: "  " }],
    ["za długa nazwa", { title: "x".repeat(81) }],
    ["za długa kategoria", { category: "x".repeat(41) }],
    ["nieznany status", { status: "maybe" }],
    ["współrzędna niecałkowita", { x: 1.5 }],
    ["współrzędna poza zakresem", { y: 100_001 }],
    ["id to nie UUID", { id: "abc" }],
  ])("RoadmapNodeSchema odrzuca: %s", (_label, patch) => {
    expect(RoadmapNodeSchema.safeParse({ ...node, ...patch }).success).toBe(false);
  });

  it("schematy częściowe zawierają tylko wybrane pola", () => {
    expect(RoadmapNodeUpdateSchema.parse(node)).toEqual({ title: "React", category: "Frontend", status: "learning" });
    expect(RoadmapPositionSchema.parse(node)).toEqual({ x: 10, y: -20 });
  });

  it("RoadmapEdgeSchema nie pozwala na strzałkę do samej siebie", () => {
    expect(RoadmapEdgeSchema.safeParse({ id: UUID_A, sourceId: UUID_A, targetId: UUID_B }).success).toBe(true);
    expect(RoadmapEdgeSchema.safeParse({ id: UUID_A, sourceId: UUID_B, targetId: UUID_B }).success).toBe(false);
  });

  const shape = { id: UUID_A, kind: "rect", x: 0, y: 0, w: 200, h: 100, text: "Frontend", color: "brand" };

  it.each([
    ["za mała szerokość", { w: 10 }],
    ["za duża wysokość", { h: 5_001 }],
    ["nieznany rodzaj", { kind: "circle" }],
    ["nieznany kolor", { color: "gold" }],
    ["za długi tekst", { text: "x".repeat(2_001) }],
  ])("RoadmapShapeSchema odrzuca: %s", (_label, patch) => {
    expect(RoadmapShapeSchema.safeParse(shape).success).toBe(true);
    expect(RoadmapShapeSchema.safeParse({ ...shape, ...patch }).success).toBe(false);
  });

  it("RoadmapShapeUpdateSchema pomija id i rodzaj kształtu", () => {
    expect(RoadmapShapeUpdateSchema.parse(shape)).toEqual({ x: 0, y: 0, w: 200, h: 100, text: "Frontend", color: "brand" });
  });
});
