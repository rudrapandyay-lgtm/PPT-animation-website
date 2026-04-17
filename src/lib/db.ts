import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DataType, newDb } from "pg-mem";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgMemDb?: ReturnType<typeof newDb>;
};

function createAdapter() {
  if (process.env.DATABASE_URL) {
    return new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
  }

  const db =
    globalForPrisma.pgMemDb ??
    (() => {
      const instance = newDb({ autoCreateForeignKeyIndices: true });
      instance.public.registerFunction({ name: "current_database", returns: DataType.text, implementation: () => "motiondeck" });
      instance.public.registerFunction({ name: "version", returns: DataType.text, implementation: () => "pg-mem" });
      const initSql = readFileSync(path.join(process.cwd(), "prisma", "init.sql"), "utf8");
      instance.public.none(initSql);
      globalForPrisma.pgMemDb = instance;
      return instance;
    })();

  const { Pool } = db.adapters.createPg();
  const pool = new Pool();
  const originalConnect = pool.connect.bind(pool);
  const originalQuery = pool.query.bind(pool);

  pool.connect = ((...args: unknown[]) => {
    if (typeof args[0] === "function") {
      return originalConnect(args[0] as never);
    }

    return originalConnect();
  }) as typeof pool.connect;

  pool.query = ((query: unknown, values?: unknown, callback?: unknown) => {
    if (typeof values === "function") {
      return originalQuery(query as never, values as never);
    }

    if (typeof callback === "function") {
      return originalQuery(query as never, values as never, callback as never);
    }

    if (values && !Array.isArray(values)) {
      return originalQuery(query as never);
    }

    return values !== undefined ? originalQuery(query as never, values as never) : originalQuery(query as never);
  }) as typeof pool.query;

  return new PrismaPg(pool);
}

const adapter = createAdapter();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    errorFormat: "minimal",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
