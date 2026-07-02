import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { logger } from "../shared/utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const createDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.DB_HOST || process.env.DATABASE_HOST || "localhost";
  const port = process.env.DB_PORT || process.env.DATABASE_PORT || "5432";
  const user = encodeURIComponent(process.env.DB_USER || process.env.DATABASE_USER || "postgres");
  const password = encodeURIComponent(process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || "");
  const database = process.env.DB_NAME || process.env.DATABASE_NAME || "qrsystem";

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};

const databaseUrl = createDatabaseUrl();
if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  throw new Error("DATABASE_URL must be a PostgreSQL URL because this project uses @prisma/adapter-pg");
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: Number(process.env.DATABASE_POOL_MAX || 2),
  idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 10_000),
  connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS || 10_000),
  keepAlive: true,
});

pool.on("error", (error) => {
  logger.error({ message: "Idle database connection error", error: error.message });
});

const adapter = new PrismaPg(pool, { disposeExternalPool: true });

const prisma = new PrismaClient({ adapter });

export { prisma };
