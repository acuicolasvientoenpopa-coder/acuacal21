# IDEMPOTENCY_MAP.md — AcuiCal

> Mapa de idempotencia por endpoint y operación.
> Fecha: 2026-06-13

---

## LEYENDA

| Símbolo | Significado |
|---------|-------------|
| ✅ | Idempotente |
| ⚠️ | Idempotente parcial (riesgo bajo) |
| ❌ | No idempotente (CRITICAL) |
| ➖ | No aplica (solo lectura) |

---

## 1. BACKEND ENDPOINTS

### 1.1 Fincas (`/api/fincas`)

| Método | Ruta | Idempotente | Mecanismo | Riesgo |
|--------|------|-------------|-----------|--------|
| GET | / | ➖ | — | — |
| POST | / | ❌ | Sin verificación de duplicado (nombre + userId). Mismo POST crea N fincas idénticas | ALTO |
| PUT | /:id | ✅ | Por ID único | BAJO |
| DELETE | /:id | ✅ | Por ID único | BAJO |
| POST | /:id/estanques | ❌ | Sin verificación. Mismo nombre + fincaId puede duplicarse | MEDIO |
| DELETE | /:fincaId/estanques/:id | ✅ | Por ID único | BAJO |

### 1.2 Bitácora (`/api/bitacora`)

| Método | Ruta | Idempotente | Riesgo |
|--------|------|-------------|--------|
| GET | / | ➖ | — |
| POST | / | ❌ | Sin dedup por fecha+fincaId+userId+estanqueId | ALTO |
| DELETE | /:id | ✅ | Por ID único | BAJO |

### 1.3 Finanzas (`/api/finanzas`)

| Método | Ruta | Idempotente | Riesgo |
|--------|------|-------------|--------|
| GET | / | ➖ | — |
| POST | / | ❌ | Sin dedup | ALTO |
| PUT | /:id | ⚠️ | Por ID, pero sin verificación de versión (updatedAt) | MEDIO |
| DELETE | /:id | ✅ | Por ID único | BAJO |

### 1.4 Inventario (`/api/inventario`)

| Método | Ruta | Idempotente | Riesgo |
|--------|------|-------------|--------|
| GET | /productos | ➖ | — |
| POST | /productos | ❌ | Sin dedup por nombre+fincaId | ALTO |
| PUT | /productos/:id | ✅ | Por ID único | BAJO |
| DELETE | /productos/:id | ✅ | Por ID único | BAJO |
| GET | /movimientos | ➖ | — |
| POST | /movimientos | ❌ | Sin dedup | ALTO |

### 1.5 Pagos (`/api/pagos`)

| Método | Ruta | Idempotente | Riesgo |
|--------|------|-------------|--------|
| POST | /checkout | ❌ | Sin idempotency-key. ONVO crea session duplicada si el mismo request se envía dos veces | ALTO |
| POST | /webhook | ❌ | **CRITICAL**. Sin tabla ProcessedEvent. Mismo event.id procesado N veces | CRÍTICO |
| POST | /rol | ❌ | Sin verificación. Mismo rol seteado N veces (aceptable pero no idempotente) | BAJO |
| GET | /subscription | ➖ | — |

### 1.6 Especies (`/api/especies`)

| Método | Ruta | Idempotente | Riesgo |
|--------|------|-------------|--------|
| GET | / | ➖ | — |
| POST | / | ❌ | Sin dedup por nombre+userId | MEDIO |
| PUT | /:id | ✅ | Por ID único | BAJO |
| DELETE | /:id | ✅ | Por ID único | BAJO |

### 1.7 Microbiología (`/api/microbiologia`)

| Método | Ruta | Idempotente | Riesgo |
|--------|------|-------------|--------|
| GET | / | ➖ | — |
| POST | / | ❌ | Sin dedup | MEDIO |
| PUT | /:id | ✅ | Por ID único | BAJO |
| DELETE | /:id | ✅ | Por ID único | BAJO |

### 1.8 Veterinaria (`/api/veterinaria`)

| Método | Ruta | Idempotente | Riesgo |
|--------|------|-------------|--------|
| GET | / | ➖ | — |
| POST | / | ❌ | Sin dedup | MEDIO |
| DELETE | /:id | ✅ | Por ID único | BAJO |

### 1.9 Parámetros (`/api/parametros`)

| Método | Ruta | Idempotente | Riesgo |
|--------|------|-------------|--------|
| GET | / | ➖ | — |
| PUT | / | ❌ | Reemplaza todo el objeto de overrides. Sin validación Zod (HIGH) | ALTO |

### 1.10 Admin (`/api/admin`)

| Método | Ruta | Idempotente | Riesgo |
|--------|------|-------------|--------|
| GET | /users | ➖ | — |
| GET | /stats | ➖ | — |
| GET | /subscriptions | ➖ | — |

---

## 2. CRITICAL IDEMPOTENCY FAILURES

### 2.1 Webhook de pagos (CRITICAL — BLOQUEANTE)
```
POST /api/pagos/webhook
```
**Problema:** No existe tabla `ProcessedEvent`. ONVO puede reenviar el mismo evento (práctica estándar) y se procesa múltiples veces.

**Fix:**
```sql
CREATE TABLE IF NOT EXISTS "ProcessedEvent" (
  "eventId" TEXT PRIMARY KEY,
  "processedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

```typescript
// Al inicio del webhook
const { data: already } = await admin.from("ProcessedEvent")
  .select("eventId").eq("eventId", event.id).single();
if (already) {
  console.log(`[WEBHOOK] Duplicado ignorado: ${event.id}`);
  res.json({ received: true, duplicate: true });
  return;
}
await admin.from("ProcessedEvent").insert({
  eventId: event.id,
  processedAt: new Date().toISOString(),
});
```

### 2.2 Subscription upsert sin unique constraint (CRITICAL — BLOQUEANTE)
```
pagos.ts:114 → admin.from("Subscription").upsert(payload, { onConflict: "userId" })
```
**Problema:** `userId` no tiene UNIQUE constraint en PostgreSQL (solo INDEX). ON CONFLICT (userId) falla con error 42P10.

**Fix en migration:**
```sql
ALTER TABLE "Subscription" ADD CONSTRAINT subscription_user_id_unique UNIQUE ("userId");
```

### 2.3 Sync queue sin dedup (HIGH)
```
enqueue() en sync.ts:103-111
```
**Problema:** No hay verificación de duplicados. Misma operación encolada N veces.

**Fix:**
```typescript
export async function enqueue(op) {
  const db = await getDb();
  const all = await db.getAll(STORE);
  const dup = all.find(e =>
    e.path === op.path &&
    e.method === op.method &&
    JSON.stringify(e.body) === JSON.stringify(op.body)
  );
  if (dup) return dup; // idempotente
  // ... crear nuevo
}
```

---

## 3. RECOMENDACIONES GENERALES

1. **Idempotency-Key header**: Agregar soporte de header `Idempotency-Key` en backend para endpoints POST críticos (`/checkout`, `/bitacora`, `/finanzas`, `/inventario/productos`). Si el mismo key ya fue procesado, devolver el resultado previo (caché por 24h).

2. **Unique constraints**: Agregar unique constraints compuestas en tablas donde la lógica de negocio lo permita:
   - `Bitacora`: `@@unique([fecha, fincaId, estanqueId, userId])`
   - `Finanza`: `@@unique([fecha, tipo, monto, fincaId, userId])` (opcional, puede ser muy restrictivo)

3. **Upsert pattern**: Para endpoints POST donde sea posible, reemplazar `insert` por `upsert` con unique constraint de negocio.

4. **Frontend debounce**: Agregar debounce/disabling en botones de submit para evitar doble click → doble POST.
