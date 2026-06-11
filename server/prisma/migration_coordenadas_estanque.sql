-- Migration: Agregar coordenadas a Estanque
-- Ejecutar en Supabase SQL Editor

ALTER TABLE "Estanque"
  ADD COLUMN IF NOT EXISTS "coordenadas" JSONB,
  ADD COLUMN IF NOT EXISTS "profundidad" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "areaM2" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "volumenM3" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_estanque_volumen ON "Estanque" ("volumenM3");
