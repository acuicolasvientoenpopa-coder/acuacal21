const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Read DATABASE_URL from server .env
const envPath = path.join(__dirname, "..", "server", ".env");
const envContent = fs.readFileSync(envPath, "utf8");
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!match) throw new Error("DATABASE_URL not found in server/.env");
const DATABASE_URL = match[1].trim() + "?sslmode=require";

async function run(sql) {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(sql);
    console.log(`  OK: ${res.command}${res.rowCount != null ? ` (${res.rowCount})` : ""}`);
    return res;
  } finally {
    await client.end();
  }
}

async function checkTable(table) {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
      [table]
    );
    return res.rows[0].exists;
  } finally {
    await client.end();
  }
}

async function checkConstraint(table, name) {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT EXISTS (SELECT FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass)`,
      [name, `"${table}"`]
    );
    return res.rows[0].exists;
  } finally {
    await client.end();
  }
}

async function showTableSchema(table) {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    if (res.rows.length > 0) {
      console.log(`  Columnas:`);
      for (const col of res.rows) {
        console.log(`    ${col.column_name} (${col.data_type}) ${col.is_nullable === "NO" ? "NOT NULL" : ""} ${col.column_default || ""}`);
      }
    }
    return res.rows;
  } finally {
    await client.end();
  }
}

async function countDuplicates(table, column) {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT "${column}", COUNT(*) as cnt FROM "${table}" GROUP BY "${column}" HAVING COUNT(*) > 1`
    );
    return res.rows;
  } finally {
    await client.end();
  }
}

async function checkRLS(table) {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT relrowsecurity FROM pg_class WHERE relname = $1`,
      [table]
    );
    return res.rows.length > 0 && res.rows[0].relrowsecurity;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log("=== MIGRATIONS: AcuiCal Supabase Production ===\n");

  const REQUIRED_TABLES = ["EventLog", "ProcessedEvent", "Subscription", "ParametroOverride"];

  // Step 0: Check current state
  console.log("--- Estado actual de tablas ---");
  const allTables = [
    "User","Finca","Estanque","Especie","Bitacora","Finanza","Inventario",
    "MovimientoInventario","Microbiologia","Veterinaria","Feedback","FincaUser",
    ...REQUIRED_TABLES
  ];
  let existingCount = 0;
  for (const t of allTables) {
    const exists = await checkTable(t);
    if (exists) {
      console.log(`  ✅ ${t}`);
      existingCount++;
    } else if (REQUIRED_TABLES.includes(t)) {
      console.log(`  ❌ ${t} — se creará`);
    }
  }
  console.log(`  (${existingCount}/${allTables.length} tablas existentes)`);

  // Step 1: EventLog
  console.log("\n--- Migración 1: EventLog ---");
  if (await checkTable("EventLog")) {
    console.log("  EventLog ya existe. Verificando estructura...");
    await showTableSchema("EventLog");
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS "EventLog" (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        action TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'PENDING',
        "payloadHash" TEXT,
        error TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_eventlog_userId ON "EventLog" ("userId");
      CREATE INDEX IF NOT EXISTS idx_eventlog_type ON "EventLog" (type);
      CREATE INDEX IF NOT EXISTS idx_eventlog_status ON "EventLog" (status);
      CREATE INDEX IF NOT EXISTS idx_eventlog_createdAt ON "EventLog" ("createdAt" DESC);
    `);
    await run(`ALTER TABLE "EventLog" ENABLE ROW LEVEL SECURITY;`);
    console.log("  ✅ EventLog creada con RLS");
  }

  // Step 2: ProcessedEvent
  console.log("\n--- Migración 2: ProcessedEvent ---");
  if (await checkTable("ProcessedEvent")) {
    console.log("  ProcessedEvent ya existe.");
    await showTableSchema("ProcessedEvent");
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS "ProcessedEvent" (
        "eventId" TEXT PRIMARY KEY,
        "source" TEXT NOT NULL DEFAULT 'onvo',
        "type" TEXT NOT NULL DEFAULT 'webhook',
        "status" TEXT NOT NULL DEFAULT 'processing',
        "error" TEXT,
        "processedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_processedevent_processedAt ON "ProcessedEvent" ("processedAt" DESC);
    `);
    console.log("  ✅ ProcessedEvent creada");
  }

  // Step 3: Subscription
  console.log("\n--- Migración 3: Subscription ---");
  if (await checkTable("Subscription")) {
    console.log("  Subscription ya existe.");
    await showTableSchema("Subscription");
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS "Subscription" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "onvoSubscriptionId" TEXT,
        "onvoCustomerId" TEXT,
        plan TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        "currentPeriodStart" TIMESTAMPTZ,
        "currentPeriodEnd" TIMESTAMPTZ,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_subscription_userId ON "Subscription" ("userId");
      CREATE INDEX IF NOT EXISTS idx_subscription_plan ON "Subscription" (plan);
      CREATE INDEX IF NOT EXISTS idx_subscription_status ON "Subscription" (status);
    `);
    // RLS
    await run(`
      ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
    `);
    console.log("  ✅ Subscription creada con RLS");
  }

  // Step 4: UNIQUE constraint on Subscription
  console.log("\n--- Migración 4: UNIQUE(userId) en Subscription ---");
  const hasUnique = await checkConstraint("Subscription", "subscription_user_id_unique");
  if (hasUnique) {
    console.log("  UNIQUE(userId) ya existe.");
  } else {
    const dups = await countDuplicates("Subscription", "userId");
    if (dups.length > 0) {
      console.log(`  ⚠️ DUPLICADOS ENCONTRADOS: ${dups.length} userIds con registros duplicados`);
      for (const d of dups) {
        console.log(`    userId=${d.userId}: ${d.cnt} registros`);
      }
      console.log(`  Eliminando duplicados (conservando el más reciente)...`);
      await run(`
        DELETE FROM "Subscription" s1 USING (
          SELECT "userId", MAX("createdAt") as max_created
          FROM "Subscription"
          GROUP BY "userId"
          HAVING COUNT(*) > 1
        ) s2
        WHERE s1."userId" = s2."userId" AND s1."createdAt" < s2.max_created
      `);
      console.log(`  Duplicados eliminados.`);
    } else {
      console.log("  No hay duplicados.");
    }
    await run(`ALTER TABLE "Subscription" ADD CONSTRAINT subscription_user_id_unique UNIQUE ("userId")`);
    console.log("  ✅ UNIQUE(userId) agregado");
  }

  // Step 5: ParametroOverride
  console.log("\n--- Migración 5: ParametroOverride ---");
  if (await checkTable("ParametroOverride")) {
    console.log("  ParametroOverride ya existe.");
    await showTableSchema("ParametroOverride");
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS "ParametroOverride" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "especieId" TEXT NOT NULL,
        params JSONB NOT NULL DEFAULT '{}',
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_parametrooverride_userId ON "ParametroOverride" ("userId");
      CREATE INDEX IF NOT EXISTS idx_parametrooverride_especieId ON "ParametroOverride" ("especieId");
    `);
    await run(`
      ALTER TABLE "ParametroOverride" ADD CONSTRAINT parametrooverride_user_especie_unique UNIQUE ("userId", "especieId");
    `);
    await run(`
      ALTER TABLE "ParametroOverride" ENABLE ROW LEVEL SECURITY;
    `);
    console.log("  ✅ ParametroOverride creada con UNIQUE(userId, especieId) + RLS");
  }

  // Step 6: Final verification
  console.log("\n=== VERIFICACIÓN FINAL ===");
  let allOk = true;
  for (const t of REQUIRED_TABLES) {
    const exists = await checkTable(t);
    if (exists) {
      console.log(`  ✅ ${t}: OK`);
      await showTableSchema(t);
    } else {
      console.log(`  ❌ ${t}: NO EXISTE`);
      allOk = false;
    }
  }

  if (allOk) {
    console.log("\n=== TODAS LAS MIGRATIONS APLICADAS EXITOSAMENTE ===");
  } else {
    console.log("\n=== HUBO ERRORES EN ALGUNA MIGRATION ===");
  }
  process.exit(allOk ? 0 : 1);
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
