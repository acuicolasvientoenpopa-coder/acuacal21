-- Migration: Agregar UNIQUE constraint a userId en Subscription
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-06-13

-- Paso 1: eliminar duplicados si los hay (conservar el más reciente por userId)
DELETE FROM "Subscription" s1 USING (
  SELECT "userId", MAX("createdAt") as max_created
  FROM "Subscription"
  GROUP BY "userId"
  HAVING COUNT(*) > 1
) s2
WHERE s1."userId" = s2."userId"
  AND s1."createdAt" < s2.max_created;

-- Paso 2: agregar unique constraint
ALTER TABLE "Subscription" ADD CONSTRAINT subscription_user_id_unique UNIQUE ("userId");

-- Paso 3: agregar índice compuesto para búsquedas por plan+status
CREATE INDEX IF NOT EXISTS idx_subscription_plan_status ON "Subscription" (plan, status);
