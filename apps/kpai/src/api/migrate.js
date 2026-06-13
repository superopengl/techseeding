import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Compose KPAI_DATABASE_URL from KPAI_PG_* the same way docker-entrypoint.sh
// does, so the migrate ACA Job — which overrides the entrypoint — can connect.
let connectionString = process.env.KPAI_DATABASE_URL;
if (!connectionString && process.env.KPAI_PG_HOST) {
  const {
    KPAI_PG_USER,
    KPAI_PG_PASSWORD,
    KPAI_PG_HOST,
    KPAI_PG_PORT,
    KPAI_PG_DATABASE,
  } = process.env;
  connectionString = `postgresql://${KPAI_PG_USER}:${KPAI_PG_PASSWORD}@${KPAI_PG_HOST}:${KPAI_PG_PORT}/${KPAI_PG_DATABASE}?sslmode=require`;
}

if (!connectionString) {
  console.error("KPAI_DATABASE_URL is not set; cannot run migrations.");
  process.exit(1);
}

const sql = postgres(connectionString, {
  max: 1,
  connect_timeout: 30,
  ssl: process.env.NODE_ENV === "production" ? "require" : false,
});
const db = drizzle(sql);

await migrate(db, { migrationsFolder: path.resolve(__dirname, "drizzle") });
await sql.end();

console.log("Migrations applied.");
