// Tworzy tabele z db/schema.sql w bazie Neon.
// Uruchomienie: npm run db:migrate  (czyta DATABASE_URL z pliku .env)
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

if (!process.env.DATABASE_URL) {
  console.error("Brak DATABASE_URL w .env");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.replace(/--.*$/gm, "").trim().length > 0);

for (const statement of statements) {
  await sql.query(statement);
  console.log("OK:", statement.split("\n").find((l) => l.trim() && !l.trim().startsWith("--")));
}
console.log("Migracja zakończona.");
