import * as z from "zod";
import { NOTE_COLOR_KEYS } from "./note-colors";

// ─────────────────────────────────────────────────────────────
// Schematy Zoda — jedno miejsce, które opisuje, jak wyglądają
// poprawne dane. Zod jednocześnie:
//   1. sprawdza dane (walidacja),
//   2. czyści je (trim, toLowerCase),
//   3. daje typ TypeScript (z.infer) — nie musisz pisać go ręcznie.
// ─────────────────────────────────────────────────────────────

const REQUIRED = { error: "To pole jest wymagane." };

// E-mail: najpierw czyścimy (trim + małe litery), a dopiero potem
// sprawdzamy format — .pipe() przekazuje wynik do następnego schematu.
const emailSchema = z
  .string(REQUIRED)
  .trim()
  .toLowerCase()
  .min(1, { error: "Podaj adres e-mail." })
  .pipe(z.email({ error: "Podaj poprawny adres e-mail." }));

export const SignupSchema = z
  .object({
    name: z
      .string(REQUIRED)
      .trim()
      .min(2, { error: "Imię musi mieć co najmniej 2 znaki." })
      .max(50, { error: "Imię może mieć maksymalnie 50 znaków." }),
    email: emailSchema,
    // Hasła NIE przycinamy — spacja to też znak hasła.
    // Zod sprawdza wszystkie reguły i zbiera wszystkie błędy naraz.
    password: z
      .string(REQUIRED)
      .min(8, { error: "Co najmniej 8 znaków." })
      .max(128, { error: "Maksymalnie 128 znaków." })
      .regex(/[a-zA-Z]/, { error: "Co najmniej jedna litera." })
      .regex(/[0-9]/, { error: "Co najmniej jedna cyfra." }),
    confirmPassword: z.string(REQUIRED),
    // Checkbox wysyła "on", gdy jest zaznaczony — każda inna wartość (albo brak) to błąd
    terms: z.literal("on", { error: "Zaakceptuj regulamin, aby założyć konto." }),
  })
  // .refine na całym obiekcie — reguła, która dotyczy dwóch pól naraz.
  // path mówi, przy którym polu pokazać błąd.
  .refine((data) => data.password === data.confirmPassword, {
    error: "Hasła nie są takie same.",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: emailSchema,
  // Przy logowaniu nie sprawdzamy reguł hasła — tylko czy coś wpisano.
  // (Reguły mogą się kiedyś zmienić, a stare hasła muszą dalej działać.)
  password: z.string(REQUIRED).min(1, { error: "Podaj hasło." }),
});

// Typy wyprowadzone ze schematów — zmieniasz schemat, typ zmienia się sam.
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

// Błędy pogrupowane po polach, np. { email: ["Podaj poprawny adres e-mail."] }
type FieldErrors<T> = { [K in keyof T]?: string[] };

export type FormState =
  | {
      errors?: FieldErrors<SignupInput>;
      message?: string;
      // React 19 czyści formularz po wysłaniu — odsyłamy wpisane wartości,
      // żeby użytkownik nie musiał ich wpisywać ponownie po błędzie.
      values?: { name?: string; email?: string };
    }
  | undefined;

/** Zamienia błąd Zoda na format { pole: [komunikaty] } dla formularza. */
export function toFieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors;
}

// ─────────────────────────────────────────────────────────────
// Notatki
// ─────────────────────────────────────────────────────────────


export const NoteSchema = z.object({
  title: z
    .string(REQUIRED)
    .trim()
    .min(1, { error: "Tytuł nie może być pusty." })
    .max(100, { error: "Tytuł może mieć maksymalnie 100 znaków." }),
  content: z
    .string()
    .max(20000, { error: "Notatka może mieć maksymalnie 20 000 znaków." })
    .default(""),
  color: z.enum(NOTE_COLOR_KEYS, { error: "Wybierz kolor z listy." }).default("white"),
  // Checkbox w HTML wysyła "on", gdy jest zaznaczony, a nic — gdy nie jest.
  // .transform zamienia to na zwykły boolean.
  // Radio wysyła tekst "0" / "1" / "2" — zamieniamy na liczbę
  priority: z
    .enum(["0", "1", "2"], { error: "Wybierz stopień ważności." })
    .default("1")
    .transform((value) => Number(value) as 0 | 1 | 2),
  pinned: z
    .literal("on")
    .optional()
    .transform((value) => value === "on"),
});

// id notatki z adresu URL — sprawdzamy, czy to UUID, zanim zapytamy bazę
export const NoteIdSchema = z.uuid();

export type NoteInput = z.infer<typeof NoteSchema>;

export type NoteFormState =
  | {
      errors?: FieldErrors<NoteInput>;
      message?: string;
    }
  | undefined;
