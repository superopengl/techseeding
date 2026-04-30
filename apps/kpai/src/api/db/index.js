import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.LAB67_DATABASE_URL || "postgres://localhost:5432/lab67";

const sql = postgres(connectionString);
export const db = drizzle(sql, { schema });
