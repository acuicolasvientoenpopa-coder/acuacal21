-- RLS Policies para AcuiCal
-- Ejecutar en Supabase SQL Editor (una sola vez)

-- Habilitar RLS en todas las tablas
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Finca" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Estanque" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Especie" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bitacora" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Finanza" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovimientoInventario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Microbiologia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Veterinaria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FincaUser" ENABLE ROW LEVEL SECURITY;

-- Users: cada uno ve su propio perfil, admin ve todos
CREATE POLICY "Users select own" ON "User" FOR SELECT
  USING (id = auth.uid());
CREATE POLICY "Users insert own" ON "User" FOR INSERT
  WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own" ON "User" FOR UPDATE
  USING (id = auth.uid());

-- Fincas: solo del usuario autenticado
CREATE POLICY "Fincas select own" ON "Finca" FOR SELECT
  USING ("userId" = auth.uid());
CREATE POLICY "Fincas insert own" ON "Finca" FOR INSERT
  WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Fincas update own" ON "Finca" FOR UPDATE
  USING ("userId" = auth.uid());
CREATE POLICY "Fincas delete own" ON "Finca" FOR DELETE
  USING ("userId" = auth.uid());

-- Estanques: a través de la relación con Finca
CREATE POLICY "Estanques select own" ON "Estanque" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Finca" WHERE "Finca".id = "Estanque"."fincaId" AND "Finca"."userId" = auth.uid()));
CREATE POLICY "Estanques insert own" ON "Estanque" FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "Finca" WHERE "Finca".id = "Estanque"."fincaId" AND "Finca"."userId" = auth.uid()));
CREATE POLICY "Estanques update own" ON "Estanque" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "Finca" WHERE "Finca".id = "Estanque"."fincaId" AND "Finca"."userId" = auth.uid()));
CREATE POLICY "Estanques delete own" ON "Estanque" FOR DELETE
  USING (EXISTS (SELECT 1 FROM "Finca" WHERE "Finca".id = "Estanque"."fincaId" AND "Finca"."userId" = auth.uid()));

-- Especies: propias o públicas (esPersonal = false)
CREATE POLICY "Especies select own" ON "Especie" FOR SELECT
  USING ("userId" = auth.uid() OR "esPersonal" = false);
CREATE POLICY "Especies insert own" ON "Especie" FOR INSERT
  WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Especies update own" ON "Especie" FOR UPDATE
  USING ("userId" = auth.uid());
CREATE POLICY "Especies delete own" ON "Especie" FOR DELETE
  USING ("userId" = auth.uid());

-- Bitacora
CREATE POLICY "Bitacora select own" ON "Bitacora" FOR SELECT
  USING ("userId" = auth.uid());
CREATE POLICY "Bitacora insert own" ON "Bitacora" FOR INSERT
  WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Bitacora update own" ON "Bitacora" FOR UPDATE
  USING ("userId" = auth.uid());
CREATE POLICY "Bitacora delete own" ON "Bitacora" FOR DELETE
  USING ("userId" = auth.uid());

-- Finanza
CREATE POLICY "Finanza select own" ON "Finanza" FOR SELECT
  USING ("userId" = auth.uid());
CREATE POLICY "Finanza insert own" ON "Finanza" FOR INSERT
  WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Finanza update own" ON "Finanza" FOR UPDATE
  USING ("userId" = auth.uid());
CREATE POLICY "Finanza delete own" ON "Finanza" FOR DELETE
  USING ("userId" = auth.uid());

-- Inventario
CREATE POLICY "Inventario select own" ON "Inventario" FOR SELECT
  USING ("userId" = auth.uid());
CREATE POLICY "Inventario insert own" ON "Inventario" FOR INSERT
  WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Inventario update own" ON "Inventario" FOR UPDATE
  USING ("userId" = auth.uid());
CREATE POLICY "Inventario delete own" ON "Inventario" FOR DELETE
  USING ("userId" = auth.uid());

-- MovimientoInventario: a través del producto
CREATE POLICY "MovimientoInventario select own" ON "MovimientoInventario" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Inventario" WHERE "Inventario".id = "MovimientoInventario"."productoId" AND "Inventario"."userId" = auth.uid()));
CREATE POLICY "MovimientoInventario insert own" ON "MovimientoInventario" FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "Inventario" WHERE "Inventario".id = "MovimientoInventario"."productoId" AND "Inventario"."userId" = auth.uid()));

-- Microbiologia
CREATE POLICY "Microbiologia select own" ON "Microbiologia" FOR SELECT
  USING ("userId" = auth.uid());
CREATE POLICY "Microbiologia insert own" ON "Microbiologia" FOR INSERT
  WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Microbiologia update own" ON "Microbiologia" FOR UPDATE
  USING ("userId" = auth.uid());
CREATE POLICY "Microbiologia delete own" ON "Microbiologia" FOR DELETE
  USING ("userId" = auth.uid());

-- Veterinaria
CREATE POLICY "Veterinaria select own" ON "Veterinaria" FOR SELECT
  USING ("userId" = auth.uid());
CREATE POLICY "Veterinaria insert own" ON "Veterinaria" FOR INSERT
  WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Veterinaria update own" ON "Veterinaria" FOR UPDATE
  USING ("userId" = auth.uid());
CREATE POLICY "Veterinaria delete own" ON "Veterinaria" FOR DELETE
  USING ("userId" = auth.uid());

-- Subscription
CREATE POLICY "Subscription select own" ON "Subscription" FOR SELECT
  USING ("userId" = auth.uid());
CREATE POLICY "Subscription insert own" ON "Subscription" FOR INSERT
  WITH CHECK ("userId" = auth.uid());

-- FincaUser: colaboradores
CREATE POLICY "FincaUser select own" ON "FincaUser" FOR SELECT
  USING ("userId" = auth.uid());

CREATE POLICY "FincaUser insert admin" ON "FincaUser" FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM "FincaUser" WHERE "FincaUser"."fincaId" = fincaId AND "FincaUser"."userId" = auth.uid() AND "FincaUser".rol = 'admin')
    OR EXISTS (SELECT 1 FROM "Finca" WHERE "Finca".id = fincaId AND "Finca"."userId" = auth.uid())
  );

CREATE POLICY "FincaUser delete admin" ON "FincaUser" FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM "FincaUser" WHERE "FincaUser"."fincaId" = fincaId AND "FincaUser"."userId" = auth.uid() AND "FincaUser".rol = 'admin')
    OR EXISTS (SELECT 1 FROM "Finca" WHERE "Finca".id = fincaId AND "Finca"."userId" = auth.uid())
  );
