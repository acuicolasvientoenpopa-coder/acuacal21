# EVENT_IDEMPOTENCY_IMPLEMENTATION.md — AcuiCal

> Implementación de idempotencia por evento.
> Fecha: 2026-06-13

---

## ARQUITECTURA DE IDEMPOTENCIA

```
┌──────────────────────────────────────────────────────────┐
│                   IDEMPOTENCY LAYER                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  FRONTEND (browser)                                       │
│  ┌─────────────────────────────────────────────┐         │
│  │ api.ts                                       │         │
│  │  → request(): X-Request-ID (UUID) header     │         │
│  │  → mutate(): no encola 4xx (excepto 429)     │         │
│  │  → getWithFallback(): logging                │         │
│  └─────────────────────────────────────────────┘         │
│  ┌─────────────────────────────────────────────┐         │
│  │ sync.ts                                      │         │
│  │  → enqueue(): dedup por path+method+body     │         │
│  │  → doProcess(): X-Request-ID en sync fetch   │         │
│  │  → identificación de errores permanentes     │         │
│  └─────────────────────────────────────────────┘         │
│                                                          │
│  BACKEND (Express)                                        │
│  ┌─────────────────────────────────────────────┐         │
│  │ idempotency.ts (servicio compartido)         │         │
│  │  → generateRequestId()                       │         │
│  │  → checkRequestIdempotent() — in-memory      │         │
│  │  → checkAndMarkEventIdempotent() — DB        │         │
│  │  → markProcessedEventDone() — DB             │         │
│  └─────────────────────────────────────────────┘         │
│  ┌─────────────────────────────────────────────┐         │
│  │ eventLog.ts (servicio compartido)            │         │
│  │  → createEventLog()                         │         │
│  │  → markEventSuccess / markEventFailed()      │         │
│  │  → verifyRecordExists()                     │         │
│  └─────────────────────────────────────────────┘         │
│                                                          │
│  BASE DE DATOS (PostgreSQL en Supabase)                   │
│  ┌─────────────────────────────────────────────┐         │
│  │ EventLog (id PK, type, status, payloadHash) │         │
│  │ ProcessedEvent (eventId PK, source, status)  │         │
│  │ Subscription (userId UNIQUE constraint)      │         │
│  └─────────────────────────────────────────────┘         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## MECANISMOS DE IDEMPOTENCIA

### 1. In-Memory Request Cache (API endpoints)

**Propósito**: Evitar duplicados en writes síncronos (POST requests simultáneos desde el mismo frontend o doble click).

**Implementación**: `checkRequestIdempotent()` en `idempotency.ts`

```typescript
const REQUEST_CACHE = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export async function checkRequestIdempotent(
  requestId: string,
  userId: string,
  table: string,
  windowMs = 5000
): Promise<{ isDuplicate: boolean }> {
  const cached = REQUEST_CACHE.get(requestId);
  if (cached) return { isDuplicate: true };

  REQUEST_CACHE.set(requestId, { data: null, timestamp: Date.now() });
  setTimeout(() => REQUEST_CACHE.delete(requestId), windowMs);

  return { isDuplicate: false };
}
```

**Endpoints que lo usan**: `POST /api/finanzas`, `POST /api/bitacora`, `POST /api/inventario/productos`, `POST /api/inventario/movimientos`

---

### 2. ProcessedEvent DB Table (Webhook)

**Propósito**: Idempotencia absoluta para webhooks externos (ONVO Pay). Garantiza que un mismo `event.id` nunca sea procesado dos veces, incluso si el servidor se reinicia entre reintentos.

**Implementación**: `checkAndMarkEventIdempotent()` en `idempotency.ts`

**Tabla**:
```sql
CREATE TABLE ProcessedEvent (
  "eventId" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL DEFAULT 'onvo',
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'processing',
  "error" TEXT,
  "processedAt" TIMESTAMPTZ DEFAULT now()
);
```

**Flujo**:
1. Insertar `{ eventId, source, type, status: "processing" }`
2. Si hay `23505` (unique violation) → ya fue procesado → ignorar
3. Procesar evento
4. `UPDATE status = "success"` o `"failed"`

**Endpoint que lo usa**: `POST /api/pagos/webhook`

---

### 3. Sync Queue Dedup (Offline)

**Propósito**: Evitar que la misma operación offline se encola dos veces (doble click, race condition).

**Implementación**: `enqueue()` en `sync.ts`

```typescript
const dup = all.find(e =>
  e.path === op.path &&
  e.method === op.method &&
  JSON.stringify(e.body) === JSON.stringify(op.body)
);
if (dup) return dup; // duplicado ignorado
```

---

### 4. Unique Constraints en DB (PostgreSQL)

**Propósito**: Última línea de defensa — la base de datos rechaza duplicados aunque todas las capas anteriores fallen.

```sql
-- Subscription: un solo registro activo por usuario
ALTER TABLE "Subscription" ADD CONSTRAINT subscription_user_id_unique UNIQUE ("userId");

-- ParametroOverride: un override por especie por usuario
-- (ya existente) UNIQUE ("userId", "especieId")

-- FincaUser: un usuario por finca
-- (ya existente) UNIQUE ("fincaId", "userId")
```

---

## MATRIZ DE COBERTURA

| Endpoint | Frontend Dedup | RequestId Header | In-Memory Cache | DB Constraint | EventLog | Post-Write Verify |
|----------|:--------------:|:----------------:|:----------------:|:-------------:|:--------:|:-----------------:|
| POST /finanzas | ❌ | ✅ | ✅ (5s) | ❌ | ✅ | ✅ |
| POST /bitacora | ❌ | ✅ | ✅ (5s) | ❌ | ✅ | ✅ |
| POST /inventario/productos | ❌ | ✅ | ✅ (5s) | ❌ | ✅ | ✅ |
| POST /inventario/movimientos | ❌ | ✅ | ✅ (5s) | ❌ | ✅ | ✅ |
| POST /pagos/webhook | ❌ | ❌ | ❌ | ✅ (userId UNIQUE) | ❌ (usa ProcessedEvent) | ✅ |
| Sync offline | ✅ (dedup) | ✅ | ❌ | N/A | ❌ | ❌ |

---

## VERIFICACIÓN DE IDEMPOTENCIA

### Escenario 1: Mismo POST enviado 2 veces (doble click)
```
Request 1 → generateRequestId() → checkRequestIdempotent("abc") → no existe → INSERT
Request 2 → generateRequestId() → checkRequestIdempotent("def") → no existe → INSERT
```
**Resultado**: 2 inserts diferentes (cada request tiene su propio requestId). Para prevenirlo, el frontend debería deshabilitar el botón tras el primer clic. La capa de idempotencia protege contra el mismo requestId.

### Escenario 2: Mismo event.id de ONVO reenviado
```
Evento 1 → ProcessedEvent.insert(eventId="evt_123") → éxito → status=success
Evento 2 (mismo eventId) → ProcessedEvent.select(eventId="evt_123") → existe → ignorado
```
**Resultado**: 1 Subscription. ✅

### Escenario 3: Network error + retry del mismo request
```
// El frontend retry con el mismo requestId (si implementado)
Request con X-Request-ID: "abc" → 1er intento: timeout → 2do intento: llega al backend
Backend: checkRequestIdempotent("abc") → no existe (1er intento no llegó) → procesa
```
**Resultado**: 1 inserción. ✅

### Escenario 4: Dos sync offline para el mismo dato
```
enqueue({path: "/bitacora", method: "POST", body: {fecha: "2024-01-01"}})
enqueue({path: "/bitacora", method: "POST", body: {fecha: "2024-01-01"}})
→ dedup: segundo es ignorado
```
**Resultado**: 1 operación en cola. ✅

### Escenario 5: Race condition entre dos tabs
```
Tab A: generateRequestId() → "abc"
Tab B: generateRequestId() → "def"
Ambos tabs llaman POST /api/finanzas simultáneamente
→ Ambos requestId son diferentes → 2 inserts
→ La DB no tiene unique constraint que lo impida
```
**Resultado**: 2 inserciones. ⚠️ Riesgo bajo (el EventLog registra ambos). Para prevenir, agregar unique constraint compuesta en Finanza si la lógica de negocio lo permite.
