"use server";

import { sql } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/session";
import {
  RoadmapEdgeSchema,
  RoadmapNodeSchema,
  RoadmapNodeUpdateSchema,
  RoadmapPositionSchema,
  RoadmapShapeSchema,
  RoadmapShapeUpdateSchema,
  UuidSchema,
} from "@/app/lib/definitions";
import type { ActionResult } from "@/app/lib/roadmap-types";

// Te akcje wołamy z handlerów zdarzeń tablicy (klik, puszczenie karty),
// a nie z formularzy. Tablica aktualizuje się od razu w przeglądarce
// ("optimistic UI"), a tu tylko utrwalamy zmianę w bazie.
// Dlatego NIE robimy revalidatePath ani redirect — strona nie musi się
// przeładowywać po każdym przesunięciu karty.
//
// Argumenty mają typ `unknown`: ktoś może wywołać akcję ręcznie
// z dowolnymi danymi, więc ufamy dopiero temu, co przepuści Zod.

const OK: ActionResult = { ok: true };
const fail = (message: string): ActionResult => ({ ok: false, message });
const NO_SESSION = fail("Sesja wygasła — zaloguj się ponownie.");
const DB_ERROR = fail("Nie udało się zapisać zmian. Odśwież stronę i spróbuj ponownie.");

export async function createRoadmapNode(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_SESSION;

  const parsed = RoadmapNodeSchema.safeParse(input);
  if (!parsed.success) return fail("Niepoprawne dane elementu.");

  const { id, title, category, status, x, y } = parsed.data;
  try {
    await sql`
      INSERT INTO roadmap_nodes (id, user_id, title, category, status, x, y)
      VALUES (${id}, ${user.id}, ${title}, ${category}, ${status}, ${x}, ${y})
    `;
  } catch (error) {
    console.error("Błąd tworzenia elementu Board:", error);
    return DB_ERROR;
  }
  return OK;
}

export async function updateRoadmapNode(nodeId: unknown, input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_SESSION;

  const id = UuidSchema.safeParse(nodeId);
  const parsed = RoadmapNodeUpdateSchema.safeParse(input);
  if (!id.success || !parsed.success) return fail("Niepoprawne dane elementu.");

  const { title, category, status } = parsed.data;
  try {
    const rows = await sql`
      UPDATE roadmap_nodes
      SET title = ${title}, category = ${category}, status = ${status}, updated_at = now()
      WHERE id = ${id.data} AND user_id = ${user.id}
      RETURNING id
    `;
    if (rows.length === 0) return fail("Nie znaleziono elementu.");
  } catch (error) {
    console.error("Błąd zapisu elementu Board:", error);
    return DB_ERROR;
  }
  return OK;
}

export async function moveRoadmapNode(nodeId: unknown, position: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_SESSION;

  const id = UuidSchema.safeParse(nodeId);
  const parsed = RoadmapPositionSchema.safeParse(position);
  if (!id.success || !parsed.success) return fail("Niepoprawna pozycja elementu.");

  try {
    await sql`
      UPDATE roadmap_nodes
      SET x = ${parsed.data.x}, y = ${parsed.data.y}, updated_at = now()
      WHERE id = ${id.data} AND user_id = ${user.id}
    `;
  } catch (error) {
    console.error("Błąd przesuwania elementu Board:", error);
    return DB_ERROR;
  }
  return OK;
}

export async function deleteRoadmapNode(nodeId: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_SESSION;

  const id = UuidSchema.safeParse(nodeId);
  if (!id.success) return fail("Nie znaleziono elementu.");

  try {
    // Strzałki tej karty usunie baza (ON DELETE CASCADE)
    await sql`DELETE FROM roadmap_nodes WHERE id = ${id.data} AND user_id = ${user.id}`;
  } catch (error) {
    console.error("Błąd usuwania elementu Board:", error);
    return DB_ERROR;
  }
  return OK;
}

export async function createRoadmapEdge(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_SESSION;

  const parsed = RoadmapEdgeSchema.safeParse(input);
  if (!parsed.success) return fail("Nie można połączyć tych elementów.");

  const { id, sourceId, targetId } = parsed.data;
  try {
    // INSERT ... SELECT ... WHERE: wstawiamy wiersz tylko wtedy, gdy OBIE
    // karty należą do zalogowanego użytkownika. Inaczej dałoby się
    // "podpiąć" strzałkę do cudzej karty, znając jej id.
    const rows = await sql`
      INSERT INTO roadmap_edges (id, user_id, source_id, target_id)
      SELECT ${id}, ${user.id}, ${sourceId}, ${targetId}
      WHERE (
        SELECT count(*) FROM roadmap_nodes
        WHERE user_id = ${user.id} AND id IN (${sourceId}, ${targetId})
      ) = 2
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (rows.length === 0) return fail("Nie udało się połączyć elementów.");
  } catch (error) {
    console.error("Błąd tworzenia połączenia Board:", error);
    return DB_ERROR;
  }
  return OK;
}

export async function deleteRoadmapEdge(edgeId: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_SESSION;

  const id = UuidSchema.safeParse(edgeId);
  if (!id.success) return fail("Nie znaleziono połączenia.");

  try {
    await sql`DELETE FROM roadmap_edges WHERE id = ${id.data} AND user_id = ${user.id}`;
  } catch (error) {
    console.error("Błąd usuwania połączenia Board:", error);
    return DB_ERROR;
  }
  return OK;
}

// ---------- Kształty (prostokąty i klocki tekstowe) ----------

export async function createRoadmapShape(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_SESSION;

  const parsed = RoadmapShapeSchema.safeParse(input);
  if (!parsed.success) return fail("Niepoprawne dane kształtu.");

  const { id, kind, x, y, w, h, text, color } = parsed.data;
  try {
    await sql`
      INSERT INTO roadmap_shapes (id, user_id, kind, x, y, w, h, text, color)
      VALUES (${id}, ${user.id}, ${kind}, ${x}, ${y}, ${w}, ${h}, ${text}, ${color})
    `;
  } catch (error) {
    console.error("Błąd tworzenia kształtu Board:", error);
    return DB_ERROR;
  }
  return OK;
}

// Jedna akcja na przesunięcie, zmianę rozmiaru, tekstu i koloru —
// zawsze wysyłamy cały aktualny stan kształtu.
export async function updateRoadmapShape(shapeId: unknown, input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_SESSION;

  const id = UuidSchema.safeParse(shapeId);
  const parsed = RoadmapShapeUpdateSchema.safeParse(input);
  if (!id.success || !parsed.success) return fail("Niepoprawne dane kształtu.");

  const { x, y, w, h, text, color } = parsed.data;
  try {
    const rows = await sql`
      UPDATE roadmap_shapes
      SET x = ${x}, y = ${y}, w = ${w}, h = ${h}, text = ${text}, color = ${color}, updated_at = now()
      WHERE id = ${id.data} AND user_id = ${user.id}
      RETURNING id
    `;
    if (rows.length === 0) return fail("Nie znaleziono kształtu.");
  } catch (error) {
    console.error("Błąd zapisu kształtu Board:", error);
    return DB_ERROR;
  }
  return OK;
}

export async function deleteRoadmapShape(shapeId: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_SESSION;

  const id = UuidSchema.safeParse(shapeId);
  if (!id.success) return fail("Nie znaleziono kształtu.");

  try {
    await sql`DELETE FROM roadmap_shapes WHERE id = ${id.data} AND user_id = ${user.id}`;
  } catch (error) {
    console.error("Błąd usuwania kształtu Board:", error);
    return DB_ERROR;
  }
  return OK;
}
