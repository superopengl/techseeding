import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate as drizzleMigrate } from 'drizzle-orm/postgres-js/migrator';

// Compose YTAI_DATABASE_URL from YTAI_PG_* the same way entrypoint.sh does,
// so the migrate ACA Job — which overrides the entrypoint — can connect.
function resolveConnectionString() {
  if (process.env.YTAI_DATABASE_URL) return process.env.YTAI_DATABASE_URL;
  if (!process.env.YTAI_PG_HOST) return undefined;
  const { YTAI_PG_USER, YTAI_PG_PASSWORD, YTAI_PG_HOST } = process.env;
  const port = process.env.YTAI_PG_PORT || '5432';
  const database = process.env.YTAI_PG_DATABASE || 'ytai';
  return `postgres://${YTAI_PG_USER}:${YTAI_PG_PASSWORD}@${YTAI_PG_HOST}:${port}/${database}?sslmode=require`;
}

export default async function migrate() {
  const connectionString = resolveConnectionString();
  if (!connectionString) {
    throw new Error('YTAI_DATABASE_URL (or YTAI_PG_HOST/USER/PASSWORD) is not set; cannot run migrations.');
  }
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);
  await drizzleMigrate(db, { migrationsFolder: './src/api/drizzle' });
  await client.end();
}

migrate().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
