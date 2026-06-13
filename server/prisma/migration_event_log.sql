-- Migration: EventLog + ProcessedEvent
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-06-13

-- EventLog: registro de toda operación crítica
CREATE TABLE IF NOT EXISTS "EventLog" (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  userId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payloadHash TEXT,
  error TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventlog_userId ON "EventLog" ("userId");
CREATE INDEX IF NOT EXISTS idx_eventlog_type ON "EventLog" (type);
CREATE INDEX IF NOT EXISTS idx_eventlog_status ON "EventLog" (status);
CREATE INDEX IF NOT EXISTS idx_eventlog_createdAt ON "EventLog" ("createdAt" DESC);

ALTER TABLE "EventLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EventLog select own" ON "EventLog" FOR SELECT
  USING ("userId" = auth.uid()::text);

CREATE POLICY "EventLog insert own" ON "EventLog" FOR INSERT
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "EventLog update own" ON "EventLog" FOR UPDATE
  USING ("userId" = auth.uid()::text);

-- ProcessedEvent: idempotencia para webhooks externos
CREATE TABLE IF NOT EXISTS "ProcessedEvent" (
  "eventId" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL DEFAULT 'onvo',
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'success',
  "error" TEXT,
  "processedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processedevent_processedAt ON "ProcessedEvent" ("processedAt" DESC);

ALTER TABLE "ProcessedEvent" ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede insertar en ProcessedEvent (el webhook es público)
CREATE POLICY "ProcessedEvent select admin" ON "ProcessedEvent" FOR SELECT
  USING (true);
