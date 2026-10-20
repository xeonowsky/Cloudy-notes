import type { Mock } from "vitest";

// `sql` z Neona to "tagged template": sql`SELECT ... ${id}` wywołuje
// sql(["SELECT ... ", ""], id). W testach podmieniamy go na vi.fn()
// i odczytujemy, jakie zapytanie i z jakimi wartościami poszło do bazy.

export type SqlCall = { text: string; values: unknown[] };

/** Wszystkie zapytania wysłane przez zamockowany sql — tekst z "$" w miejscu parametrów. */
export function sqlCalls(sql: Mock): SqlCall[] {
  return sql.mock.calls.map(([strings, ...values]) => ({
    text: (strings as TemplateStringsArray).join("$").replace(/\s+/g, " ").trim(),
    values,
  }));
}

export function lastSql(sql: Mock): SqlCall {
  const calls = sqlCalls(sql);
  if (calls.length === 0) throw new Error("Nie wysłano żadnego zapytania SQL");
  return calls[calls.length - 1];
}

/** Buduje FormData z obiektu — tak jak wysłałby je formularz. */
export function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

// redirect() z next/navigation rzuca wyjątek, żeby przerwać akcję.
// W testach udajemy to samo i sprawdzamy, dokąd przekierowano.
export class RedirectError extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}

export const USER = { id: "11111111-1111-4111-8111-111111111111", name: "Klaudiusz", email: "k@example.com" };
export const UUID_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const UUID_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const UUID_C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
