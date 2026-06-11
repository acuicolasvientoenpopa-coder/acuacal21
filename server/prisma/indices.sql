-- Índices para AcuiCal
-- Ejecutar en Supabase SQL Editor después de aplicar RLS

CREATE INDEX IF NOT EXISTS idx_finca_userId ON "Finca" ("userId");
CREATE INDEX IF NOT EXISTS idx_estanque_fincaId ON "Estanque" ("fincaId");
CREATE INDEX IF NOT EXISTS idx_bitacora_userId ON "Bitacora" ("userId");
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON "Bitacora" ("fecha" DESC);
CREATE INDEX IF NOT EXISTS idx_especie_userId ON "Especie" ("userId");
CREATE INDEX IF NOT EXISTS idx_finanza_userId ON "Finanza" ("userId");
CREATE INDEX IF NOT EXISTS idx_inventario_userId ON "Inventario" ("userId");
CREATE INDEX IF NOT EXISTS idx_movimientoinventario_productoId ON "MovimientoInventario" ("productoId");
CREATE INDEX IF NOT EXISTS idx_microbiologia_userId ON "Microbiologia" ("userId");
CREATE INDEX IF NOT EXISTS idx_veterinaria_userId ON "Veterinaria" ("userId");
CREATE INDEX IF NOT EXISTS idx_subscription_userId ON "Subscription" ("userId");
CREATE INDEX IF NOT EXISTS idx_fincauser_fincaId ON "FincaUser" ("fincaId");
CREATE INDEX IF NOT EXISTS idx_fincauser_userId ON "FincaUser" ("userId");
