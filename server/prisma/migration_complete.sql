-- ============================================================
-- ACUICAL -- MIGRACIONES COMPLETAS PARA PRODUCCIÓN
-- Seguro: CREATE IF NOT EXISTS, sin DROP
-- ============================================================

-- ============================================================
-- MIGRACIÓN 1: EventLog
-- ============================================================
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

ALTER TABLE "EventLog" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'eventlog_select_own' AND tablename = 'EventLog') THEN
    CREATE POLICY "eventlog_select_own" ON "EventLog" FOR SELECT USING ("userId" = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'eventlog_insert_own' AND tablename = 'EventLog') THEN
    CREATE POLICY "eventlog_insert_own" ON "EventLog" FOR INSERT WITH CHECK ("userId" = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'eventlog_update_own' AND tablename = 'EventLog') THEN
    CREATE POLICY "eventlog_update_own" ON "EventLog" FOR UPDATE USING ("userId" = auth.uid()::text);
  END IF;
END
$$;

-- ============================================================
-- MIGRACIÓN 2: ProcessedEvent
-- ============================================================
CREATE TABLE IF NOT EXISTS "ProcessedEvent" (
  "eventId" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL DEFAULT 'onvo',
  "type" TEXT NOT NULL DEFAULT 'webhook',
  "status" TEXT NOT NULL DEFAULT 'processing',
  "error" TEXT,
  "processedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processedevent_processedAt ON "ProcessedEvent" ("processedAt" DESC);

-- ============================================================
-- MIGRACIÓN 3: Subscription
-- ============================================================
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

ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'subscription_select_own' AND tablename = 'Subscription') THEN
    CREATE POLICY "subscription_select_own" ON "Subscription" FOR SELECT USING ("userId" = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'subscription_insert_admin' AND tablename = 'Subscription') THEN
    CREATE POLICY "subscription_insert_admin" ON "Subscription" FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'subscription_update_admin' AND tablename = 'Subscription') THEN
    CREATE POLICY "subscription_update_admin" ON "Subscription" FOR UPDATE USING (true);
  END IF;
END
$$;

-- ============================================================
-- MIGRACIÓN 4: UNIQUE(userId) en Subscription
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_constraint WHERE conname = 'subscription_user_id_unique'
  ) THEN
    DELETE FROM "Subscription" s1 USING (
      SELECT "userId", MAX("createdAt") as max_created
      FROM "Subscription"
      GROUP BY "userId"
      HAVING COUNT(*) > 1
    ) s2
    WHERE s1."userId" = s2."userId" AND s1."createdAt" < s2.max_created;

    ALTER TABLE "Subscription" ADD CONSTRAINT subscription_user_id_unique UNIQUE ("userId");
  END IF;
END
$$;

-- ============================================================
-- MIGRACIÓN 5: ParametroOverride
-- ============================================================
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_constraint WHERE conname = 'parametrooverride_user_especie_unique'
  ) THEN
    ALTER TABLE "ParametroOverride" ADD CONSTRAINT parametrooverride_user_especie_unique UNIQUE ("userId", "especieId");
  END IF;
END
$$;

ALTER TABLE "ParametroOverride" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'paramoverride_select' AND tablename = 'ParametroOverride') THEN
    CREATE POLICY "paramoverride_select" ON "ParametroOverride" FOR SELECT USING ("userId" = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'paramoverride_insert' AND tablename = 'ParametroOverride') THEN
    CREATE POLICY "paramoverride_insert" ON "ParametroOverride" FOR INSERT WITH CHECK ("userId" = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'paramoverride_update' AND tablename = 'ParametroOverride') THEN
    CREATE POLICY "paramoverride_update" ON "ParametroOverride" FOR UPDATE USING ("userId" = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'paramoverride_delete' AND tablename = 'ParametroOverride') THEN
    CREATE POLICY "paramoverride_delete" ON "ParametroOverride" FOR DELETE USING ("userId" = auth.uid()::text);
  END IF;
END
$$;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'EventLog' as tabla, COUNT(*) as registros FROM "EventLog"
UNION ALL
SELECT 'ProcessedEvent', COUNT(*) FROM "ProcessedEvent"
UNION ALL
SELECT 'Subscription', COUNT(*) FROM "Subscription"
UNION ALL
SELECT 'ParametroOverride', COUNT(*) FROM "ParametroOverride";
