import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.L4K_DATABASE_URL || "postgres://localhost:5432/kidplayai";

const sql = postgres(connectionString);
export const db = drizzle(sql, { schema });
