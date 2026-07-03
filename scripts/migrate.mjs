/**
 * Run Supabase SQL migrations against remote Postgres.
 *
 * Set ONE of these in .env.local:
 *   DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@...pooler.supabase.com:6543/postgres
 *   SUPABASE_DB_PASSWORD=your-database-password  (uses NEXT_PUBLIC_SUPABASE_URL for host)
 *
 * Usage: npm run db:migrate
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

dotenv.config({ path: join(root, ".env.local") });

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (password && supabaseUrl) {
    const ref = supabaseUrl.replace("https://", "").split(".")[0];
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }

  return null;
}

const DATABASE_URL = getDatabaseUrl();

if (!DATABASE_URL) {
  console.error(
    "Missing database credentials in .env.local\n\n" +
      "Add either:\n" +
      "  DATABASE_URL=postgresql://...\n" +
      "  SUPABASE_DB_PASSWORD=your-db-password\n\n" +
      "Get the password from Supabase Dashboard → Project Settings → Database"
  );
  process.exit(1);
}

const migrationsDir = join(root, "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log(`Connected. Running ${files.length} migration(s)...\n`);

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`→ ${file}`);
    try {
      await client.query(sql);
      console.log(`  ✓ OK\n`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}\n`);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log("All migrations applied successfully.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
