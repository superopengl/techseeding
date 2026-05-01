import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.L4K_DATABASE_URL || "postgres://localhost:5432/lab4kids";

const sql = postgres(connectionString);
export const db = drizzle(sql, { schema });
