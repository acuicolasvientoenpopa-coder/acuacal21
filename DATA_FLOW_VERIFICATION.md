# DATA FLOW VERIFICATION — AcuiCal

> Verificación del flujo de datos contra producción real.
> Fecha: 2026-06-13

---

## FLUJO: POST /api/inventario/productos

### Código VIEJO (posiblemente aún en Railway)
```
Frontend → POST → Zod validate → INSERT Inventario → 201
  → localStorage backup
  → SIN EventLog
  → SIN post-write verify
  → SIN fincaId en productoToApi (frontend viejo)
```

### Código NUEVO (si Railway auto-deployó)
```
Frontend → POST → Zod validate (fincaId required)
  → checkRequestIdempotent() → in-memory cache
  → createEventLog(EventLog) → ❌ Tabla no existe → catch-safe → false
  → INSERT Inventario → ✅
  → verifyRecordExists("Inventario") → ✅ (tabla existe)
  → markEventSuccess(EventLog) → ❌ Tabla no existe → catch-safe
  → 201
```

### Verificación real
| Paso | Funciona? | Evidencia |
|------|-----------|-----------|
| Llega a backend | ✅ | Backend responde |
| Zod valida | ⚠️ Depende de versión | Backend viejo: sí; nuevo: sí |
| INSERT en Inventario | ✅ | Tabla existe en Supabase |
| EventLog | ❌ | Tabla no existe |
| Post-write verify | ⚠️ Código nuevo | Verifica contra tabla real (OK) |
| fincaId en payload | ⚠️ Frontend nuevo | Sí en bundle nuevo |

**Veredicto: DATOS LLEGAN A SUPABASE** ✅

---

## FLUJO: POST /api/finanzas

### Verificación real
| Paso | Funciona? | Evidencia |
|------|-----------|-----------|
| Tabla existe | ✅ `Finanza` en Supabase |
| Zod valida fincaId | ⚠️ UUID vs string | Backend viejo: min(1); nuevo: uuid() |
| INSERT | ✅ | Tabla existe |
| Compound key como fincaId | ⚠️ Frontend viejo | UUID real en frontend nuevo |

**Veredicto: DATOS LLEGAN A SUPABASE** ✅ (pero fincaId puede ser compound key si frontend viejo)

---

## FLUJO: POST /api/pagos/webhook (CRÍTICO)

### Flujo real
```
ONVO → POST /api/pagos/webhook
  → Validar x-webhook-secret
  → checkAndMarkEventIdempotent():
      → INSERT ProcessedEvent → ❌ TABLA NO EXISTE
      → error: "Could not find table ProcessedEvent"
  → SI código VIEJO: updateUserById + try/catch upsert → 200 FALSO
  → SI código NUEVO: 500 "Error de idempotencia"
```

### ¿Dónde está el dinero?
| Item | Real en producción |
|------|-------------------|
| Subscription en DB | ❌ VACÍA — tabla no existe |
| Auth metadata plan | ⚠️ Se actualiza (updateUserById funciona) |
| ONVO cree que pagó | ✅ ONVO recibió 200 OK |
| Usuario ve plan activo | ⚠️ Si auth metadata se actualizó |
| Admin ve subscription | ❌ NO — tabla vacía |

**Veredicto: PAGOS NO SE PERSISTEN EN SUPABASE** ❌

---

## FLUJO: PUT /api/parametros

### Flujo real
```
Frontend → PUT /api/parametros { especieId: {...} }
  → Zod validate (en código nuevo)
  → upsert ParametroOverride → ❌ TABLA NO EXISTE
  → error 500
  → Frontend: catch {} (antes) / console.error (después)
  → Dato solo en localStorage
```

**Veredicto: PARÁMETROS NUNCA PERSISTIERON EN SUPABASE** ❌

---

## FLUJO: Sync Offline

### Flujo real
```
Frontend: api.mutate() → fetch() → FALL (offline)
  → enqueue({ path, method, body })
  → doProcess() cada 1s:
      → fetch() a backend → INSERT
      → 201 → delete from queue
```

### Verificación
| Item | Real | Nota |
|------|------|------|
| IndexedDB queue | ✅ En frontend |
| Dedup | ⚠️ Código nuevo | Bundle nuevo tiene dedup |
| Processing deadlock | ⚠️ Código nuevo | try/finally en bundle nuevo |
| Sync a backend | ✅ | Backend recibe requests |
| Datos duplicados | ⚠️ Sin dedup en frontend viejo | Riesgo de duplicados |

**Veredicto: SYNC FUNCIONA** ✅ (mejoras en frontend nuevo)

---

## FLUJO: Multiusuario / GET /api/inventario/movimientos

### Flujo real (código VIEJO)
```
GET /api/inventario/movimientos
  → SELECT * FROM MovimientoInventario JOIN Inventario
  → SIN filter userId
  → Devuelve movimientos de TODOS los usuarios
```

### RLS en Supabase
```
Tabla Inventario: RLS policy USING (auth.uid()::text = "userId")
Tabla MovimientoInventario: ¿RLS?
```

Si `MovimientoInventario` no tiene RLS policy, cualquier usuario autenticado ve todos los movimientos a través del JOIN con `Inventario(*)`.

**Veredicto: FUGA DE DATOS ACTIVA** ⚠️ (si backend viejo)

---

## TABLA DE VERDAD FINAL

| Módulo | Escribe en Supabase? | Auditoría? | Idempotente? | Seguro multiusuario? |
|--------|---------------------|------------|--------------|---------------------|
| Inventario | ✅ SÍ | ❌ NO | ⚠️ Parcial | ⚠️ Parcial |
| Finanzas | ✅ SÍ | ❌ NO | ⚠️ Parcial | ✅ RLS |
| Bitácora | ✅ SÍ | ❌ NO | ⚠️ Parcial | ✅ RLS |
| Pagos | ❌ NO | ❌ NO | ❌ NO | N/A |
| Parámetros | ❌ NO | ❌ NO | N/A | ✅ RLS |
| Sync offline | ✅ SÍ | ⚠️ Nueva | ⚠️ Nueva | ✅ |

---

## CAUSA RAÍZ

**4 migraciones SQL nunca ejecutadas en Supabase producción:**

1. `migration_subscription.sql` → Subscription table
2. `migration_event_log.sql` → EventLog + ProcessedEvent
3. `migration_parametros.sql` → ParametroOverride
4. `migration_subscription_unique.sql` → UNIQUE(userId) en Subscription

Sin estas migraciones:
- **Pagos**: no funcionan (ni viejos ni nuevos)
- **Auditoría**: EventLog no existe
- **Idempotencia webhook**: ProcessedEvent no existe
- **Parámetros WQ**: nunca persistieron
