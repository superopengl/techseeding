import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  schema: path.resolve(__dirname, "db/schema.js"),
  out: "src/api/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.LAB67_DATABASE_URL || "postgres://localhost:5432/lab67",
  },
};
