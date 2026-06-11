-- Migration: Tabla ParametroOverride para parámetros WQ por especie
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "ParametroOverride" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "especieId" TEXT NOT NULL,
  "params" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "especieId")
);

CREATE INDEX IF NOT EXISTS idx_parametro_user ON "ParametroOverride" ("userId");

ALTER TABLE "ParametroOverride" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios parámetros"
  ON "ParametroOverride" FOR SELECT
  USING (auth.role() = 'authenticated' AND "userId" = auth.uid()::text);

CREATE POLICY "Usuarios pueden insertar sus propios parámetros"
  ON "ParametroOverride" FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND "userId" = auth.uid()::text);

CREATE POLICY "Usuarios pueden actualizar sus propios parámetros"
  ON "ParametroOverride" FOR UPDATE
  USING (auth.role() = 'authenticated' AND "userId" = auth.uid()::text);

CREATE POLICY "Usuarios pueden eliminar sus propios parámetros"
  ON "ParametroOverride" FOR DELETE
  USING (auth.role() = 'authenticated' AND "userId" = auth.uid()::text);

GRANT ALL ON "ParametroOverride" TO authenticated;
