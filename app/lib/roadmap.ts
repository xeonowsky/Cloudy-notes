import { sql } from "./db";
import type { RoadmapEdge, RoadmapNode, RoadmapShape } from "./roadmap-types";

export type Roadmap = { nodes: RoadmapNode[]; edges: RoadmapEdge[]; shapes: RoadmapShape[] };

// Tak jak w notes.ts: każde zapytanie filtruje po user_id.
export async function getRoadmapForUser(userId: string): Promise<Roadmap> {
  // Trzy niezależne zapytania — puszczamy je równolegle
  const [nodes, edges, shapes] = await Promise.all([
    sql`
      SELECT id, title, category, status, x, y
      FROM roadmap_nodes
      WHERE user_id = ${userId}
      ORDER BY created_at
    `,
    // AS "sourceId" — zamieniamy snake_case z bazy na camelCase z TypeScriptu
    sql`
      SELECT id, source_id AS "sourceId", target_id AS "targetId"
      FROM roadmap_edges
      WHERE user_id = ${userId}
    `,
    // Kolejność = kolejność rysowania: nowsze kształty leżą wyżej
    sql`
      SELECT id, kind, x, y, w, h, text, color, note_id AS "noteId",
             font_size AS "fontSize", text_color AS "textColor", bold, italic, text_align AS "align"
      FROM roadmap_shapes
      WHERE user_id = ${userId}
      ORDER BY created_at
    `,
  ]);
  return {
    nodes: nodes as RoadmapNode[],
    edges: edges as RoadmapEdge[],
    shapes: shapes as RoadmapShape[],
  };
}
