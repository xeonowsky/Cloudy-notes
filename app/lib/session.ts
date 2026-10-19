import { cookies } from "next/headers";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { sql } from "./db";
import { SESSION_COOKIE } from "./session-cookie";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 dni

export type User = {
  id: string;
  name: string;
  email: string;
};

// W bazie trzymamy tylko hash tokenu. Jeśli ktoś wykradnie zawartość tabeli
// sessions, nie będzie mógł się podszyć pod użytkownika.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Tworzy sesję w bazie i ustawia ciasteczko. Wołać tylko z Server Action / Route Handlera. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await sql`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, ${expiresAt.toISOString()})
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // JavaScript w przeglądarce nie ma dostępu do ciasteczka
    secure: process.env.NODE_ENV === "production", // tylko HTTPS na produkcji
    sameSite: "lax", // podstawowa ochrona przed CSRF
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Zwraca zalogowanego użytkownika albo null.
 * `cache` z Reacta sprawia, że w obrębie jednego requestu zapytanie do bazy
 * idzie tylko raz, nawet jeśli wołasz to w navbarze i na stronie.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await sql`
    SELECT u.id, u.name, u.email
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${hashToken(token)} AND s.expires_at > now()
  `;

  return (rows[0] as User | undefined) ?? null;
});

/** Usuwa sesję z bazy i kasuje ciasteczko (wylogowanie). */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await sql`DELETE FROM sessions WHERE id = ${hashToken(token)}`;
  }
  cookieStore.delete(SESSION_COOKIE);
}
