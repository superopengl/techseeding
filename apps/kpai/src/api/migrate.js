import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.KPAI_DATABASE_URL;

if (!connectionString) {
  console.error("KPAI_DATABASE_URL is not set; cannot run migrations.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1, connect_timeout: 30 });
const db = drizzle(sql);

await migrate(db, { migrationsFolder: path.resolve(__dirname, "drizzle") });
await sql.end();

console.log("Migrations applied.");
