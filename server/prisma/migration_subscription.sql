-- Migration: Subscription (ONVO Pay)
-- Ejecutar en Supabase SQL Editor

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

ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscription select own" ON "Subscription" FOR SELECT
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Subscription insert own" ON "Subscription" FOR INSERT
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Subscription update own" ON "Subscription" FOR UPDATE
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Subscription delete own" ON "Subscription" FOR DELETE
  USING ("userId" = auth.uid()::text);

CREATE INDEX IF NOT EXISTS idx_subscription_userId ON "Subscription" ("userId");
CREATE INDEX IF NOT EXISTS idx_subscription_plan ON "Subscription" (plan);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON "Subscription" (status);
