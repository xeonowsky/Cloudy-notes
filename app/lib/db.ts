import { neon } from "@neondatabase/serverless";
import { parseEnv } from "@neon/env";
import neonConfig from "@/neon";

// parseEnv potrzebuje konfiguracji z neon.ts (wcześniej był tu przez pomyłkę
// `config` z node:process, który nie ma z Neonem nic wspólnego).
const { postgres } = parseEnv(neonConfig, ["DATABASE_URL"]);
export const sql = neon(postgres.databaseUrl);
