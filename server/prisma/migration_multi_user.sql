-- Migration: Multi-usuario - tabla FincaUser
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "FincaUser" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "fincaId" TEXT NOT NULL REFERENCES "Finca"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  rol "Rol" NOT NULL DEFAULT 'productor',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("fincaId", "userId")
);

-- Migrar owners existentes como admin en FincaUser
INSERT INTO "FincaUser" ("fincaId", "userId", rol)
SELECT id, "userId", 'admin'::"Rol" FROM "Finca"
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE "FincaUser" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FincaUser select own" ON "FincaUser" FOR SELECT
  USING ("userId" = auth.uid()::text);

CREATE POLICY "FincaUser insert admin" ON "FincaUser" FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM "FincaUser" AS fu WHERE fu."fincaId" = "FincaUser"."fincaId" AND fu."userId" = auth.uid()::text AND fu.rol = 'admin')
    OR EXISTS (SELECT 1 FROM "Finca" WHERE "Finca".id = "FincaUser"."fincaId" AND "Finca"."userId" = auth.uid()::text)
  );

CREATE POLICY "FincaUser delete admin" ON "FincaUser" FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM "FincaUser" AS fu WHERE fu."fincaId" = "FincaUser"."fincaId" AND fu."userId" = auth.uid()::text AND fu.rol = 'admin')
    OR EXISTS (SELECT 1 FROM "Finca" WHERE "Finca".id = "FincaUser"."fincaId" AND "Finca"."userId" = auth.uid()::text)
  );

-- Índice
CREATE INDEX IF NOT EXISTS idx_fincauser_fincaId ON "FincaUser" ("fincaId");
CREATE INDEX IF NOT EXISTS idx_fincauser_userId ON "FincaUser" ("userId");

-- Feedback table
CREATE TABLE IF NOT EXISTS "Feedback" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  rating INT,
  page TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
