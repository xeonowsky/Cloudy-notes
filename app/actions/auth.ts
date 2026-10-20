"use server";

import { redirect } from "next/navigation";
import { sql } from "@/app/lib/db";
import { hashPassword, verifyPassword, DUMMY_HASH } from "@/app/lib/password";
import { createSession, deleteSession } from "@/app/lib/session";
import { LoginSchema, SignupSchema, toFieldErrors, type FormState } from "@/app/lib/definitions";

// Server Actions wykonują się zawsze na serwerze — hasło nigdy nie trafia
// do kodu w przeglądarce, a dane formularza walidujemy tutaj
// (walidacji po stronie klienta nie można ufać).

/** Odczytuje pole formularza jako tekst — do odesłania wartości po błędzie. */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {

  const result = SignupSchema.safeParse(Object.fromEntries(formData));
  const values = { name: field(formData, "name"), email: field(formData, "email") };

  // safeParse nie rzuca wyjątku — zwraca { success: false, error } albo { success: true, data }
  if (!result.success) {
    return { errors: toFieldErrors(result.error), values };
  }

  // Od tego miejsca dane są poprawne, oczyszczone i mają typ SignupInput
  const { name, email, password } = result.data;

  let userId: string;
  try {
    const passwordHash = await hashPassword(password);
    // ON CONFLICT DO NOTHING: jeśli e-mail już istnieje, nic nie wstawiamy
    // i RETURNING zwraca pustą tablicę — bez łapania błędu unikalności.
    const rows = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;
    if (rows.length === 0) {
      return { errors: { email: ["Konto z tym adresem e-mail już istnieje."] }, values };
    }
    userId = rows[0].id as string;
    await createSession(userId);
  } catch (error) {
    console.error("Błąd rejestracji:", error);
    return { message: "Coś poszło nie tak. Spróbuj ponownie za chwilę.", values };
  }

  // redirect() rzuca specjalny wyjątek, dlatego jest poza try/catch.
  redirect("/notatki");
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = LoginSchema.safeParse(Object.fromEntries(formData));
  const values = { email: field(formData, "email") };

  if (!result.success) {
    return { errors: toFieldErrors(result.error), values };
  }

  const { email, password } = result.data;

  try {
    const rows = await sql`
      SELECT id, password_hash FROM users WHERE email = ${email}
    `;
    const user = rows[0] as { id: string; password_hash: string } | undefined;

    // Zawsze liczymy hash (nawet gdy użytkownika nie ma), a komunikat jest
    // ten sam w obu przypadkach — atakujący nie sprawdzi, czy e-mail istnieje.
    const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok) {
      return { message: "Nieprawidłowy e-mail lub hasło.", values };
    }

    await createSession(user.id);
  } catch (error) {
    console.error("Błąd logowania:", error);
    return { message: "Coś poszło nie tak. Spróbuj ponownie za chwilę.", values };
  }

  redirect("/notatki");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/logowanie");
}
