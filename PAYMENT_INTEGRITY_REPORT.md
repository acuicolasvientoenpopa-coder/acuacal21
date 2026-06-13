# PAYMENT_INTEGRITY_REPORT.md — AcuiCal

> Auditoría del sistema de pagos (ONVO Pay).
> Fecha: 2026-06-13

---

## ARQUITECTURA ACTUAL DE PAGOS

```
Frontend (/planes):
  1. POST /api/pagos/checkout { priceId }
  2. Recibe URL de ONVO → redirige
  3. Usuario paga en ONVO
  4. ONVO redirige a /?checkout=success

ONVO → POST /api/pagos/webhook (evento checkout-session.succeeded)
  1. updateUserPlan(userId, plan):
     a. admin.auth.admin.updateUserById → user_metadata.plan = "pro"
     b. admin.from("Subscription").upsert → **FALLA SIEMPRE** (onConflict userId sin unique)
  2. res.json({ received: true })  ← responde OK aunque upsert falle

Frontend (/api/pagos/subscription):
  - GET Subscription table → siempre vacío
  - Muestra null al usuario
```

---

## BLOQUEANTE #1: Subscription upsert siempre falla (CRITICAL)

### Causa Raíz
**Archivo:** `server/src/routes/pagos.ts:114`
```typescript
const { error: upsertErr } = await admin.from("Subscription").upsert(payload, {
  onConflict: "userId",
  ignoreDuplicates: false,
});
```

**Problema:** `upsert` con `onConflict: "userId"` requiere un unique constraint sobre `userId` en PostgreSQL. La tabla Subscription tiene un INDEX (no unique) sobre userId. PostgreSQL lanza **error 42P10**.

**Evidence:**
- `migration_subscription.sql:31`: `CREATE INDEX idx_subscription_userId ON "Subscription" ("userId")` → solo INDEX
- `schema.prisma:50-62`: `userId String` → sin `@unique` ni `@@unique`
- El catch en línea 118-120 solo loggea, no lanza error, no revierte el cambio de auth metadata

### Impacto
```
- Auth metadata: plan = "pro" ✅
- Subscription table: vacía ❌
- GET /api/pagos/subscription: null ❌
- Estado: INCONSISTENTE
- Usuario ve: sin plan activo
- Sistema cree que: tiene plan pro
```

### Fix
```sql
-- Migration inmediata
ALTER TABLE "Subscription" ADD CONSTRAINT subscription_user_id_unique UNIQUE ("userId");
```
O en Prisma:
```prisma
model Subscription {
  ...
  userId String  @unique
}
```

---

## BLOQUEANTE #2: Webhook no es idempotente (CRITICAL)

### Problema
ONVO puede reenviar el mismo evento webhook (timeout, retry automático). No hay tabla `ProcessedEvent`. Cada recepción del mismo `event.id` procesa la suscripción nuevamente.

### Sin Fix #1 (upsert funciona):
Si se arregla el unique constraint, el segundo llamado hace upsert correcto → actualiza el mismo registro → aceptable pero ineficiente.

### Sin Fix #1 (upsert roto):
El segundo llamado intenta el mismo upsert que falla → loggea otro error → el auth metadata se actualiza dos veces → no hay daño adicional (pero el sistema sigue roto).

### Fix completo
```typescript
// 1. Verificar event.id al inicio
const { data: exist } = await admin.from("ProcessedEvent")
  .select("eventId").eq("eventId", event.id).single();
if (exist) {
  console.log(`[WEBHOOK] Evento duplicado ignorado: ${event.id}`);
  res.json({ received: true, duplicate: true });
  return;
}

// 2. Marcar como procesado (antes de la lógica de negocio)
await admin.from("ProcessedEvent").insert({
  eventId: event.id,
  processedAt: new Date().toISOString(),
});

// 3. Procesar
await updateUserPlan(metadata.userId, metadata.plan, event.data.object);
```

---

## BLOQUEANTE #3: Sin rollback en updateUserPlan (HIGH)

### Flujo actual
```
1. updateUserById → user_metadata.plan = "pro"    ✅
2. Subscription.upsert → FALLA                      ❌
3. No hay compensación                              ❌
4. Webhook responde 200                             ✅ (miente)
```

### Fix
Invertir el orden: Subscription upsert PRIMERO, auth metadata DESPUÉS:
```typescript
async function updateUserPlan(userId: string, plan: string, subData?: any) {
  const admin = getAdminClient();
  
  // 1. Primero: upsert Subscription
  const payload = { userId, plan, ... };
  const { error: upsertErr } = await admin.from("Subscription").upsert(payload, {
    onConflict: "userId",
  });
  if (upsertErr) throw upsertErr;  // ← si falla, no continuar
  
  // 2. Después: actualizar auth metadata
  const { data: existing } = await admin.auth.admin.getUserById(userId);
  const currentMeta = existing?.user?.user_metadata || {};
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...currentMeta, plan },
  });
}
```

---

## HALLAZGO #4: Sin verificación contra ONVO API (HIGH)

### Problema
El webhook confía en el body del request. Solo verifica el header `x-webhook-secret`. No hace GET a ONVO API para verificar que el checkout session realmente existe y fue pagado.

### Riesgo
Si el webhook secret se filtra (log, repo, env), cualquiera puede enviar POSTs a `/api/pagos/webhook` y activar planes pagos.

### Fix
```typescript
if (event.type === "checkout-session.succeeded") {
  const sessionId = event.data?.object?.id;
  if (!sessionId) { res.status(400).json({ error: "Missing session ID" }); return; }
  
  // Verificar con ONVO API
  const session = await onvoGet(`/checkout/sessions/${sessionId}`);
  if (!session || session.payment_status !== "paid") {
    console.error(`[WEBHOOK] Sesión inválida: ${sessionId}`);
    res.status(400).json({ error: "Invalid session" });
    return;
  }
  // ... procesar
}
```

---

## HALLAZGO #5: Sin historial de eventos procesados (HIGH)

### Problema
No existe la tabla `ProcessedEvent`. Imposible auditar qué eventos de pago se procesaron, cuándo, y si hubo duplicados.

### Fix
```sql
CREATE TABLE IF NOT EXISTS "ProcessedEvent" (
  "eventId" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "processedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "status" TEXT NOT NULL DEFAULT 'success',
  "error" TEXT
);
```

---

## HALLAZGO #6: Logging insuficiente (MEDIUM)

### Problema
Los logs actuales no incluyen `event.id`:
- Línea 92: `console.log("Webhook recibido:", event.type)` — sin event.id
- Línea 129: loggea userId pero no event.id
- Línea 119: loggea error de upsert sin event.id

### Fix
```typescript
console.log(`[WEBHOOK] Evento recibido: ${event.id} type=${event.type}`);
console.log(`[WEBHOOK] Plan actualizado a ${metadata.plan} para usuario ${metadata.userId} (event=${event.id})`);
console.error(`[WEBHOOK] Error upserting Subscription para event ${event.id}:`, upsertErr);
```

---

## HALLAZGO #7: Webhook secret puede ser empty string (MEDIUM)

### Código
```typescript
const ONVO_WEBHOOK_SECRET = process.env.ONVO_WEBHOOK_SECRET ?? "";
```
Si la variable de entorno no está configurada, `ONVO_WEBHOOK_SECRET = ""` y la comparación `secret !== ""` permite cualquier secret.

### Fix
```typescript
const ONVO_WEBHOOK_SECRET = process.env.ONVO_WEBHOOK_SECRET;
if (!ONVO_WEBHOOK_SECRET) {
  console.error("FATAL: ONVO_WEBHOOK_SECRET no está configurado");
  process.exit(1);
}
```

---

## VERIFICACIÓN DE CONSISTENCIA POST-FIX

### Escenario 1: Checkout exitoso
```
ONVO → webhook → ProcessedEvent insert → Subscription upsert → auth metadata update
Resultado esperado:
  - ProcessedEvent: 1 fila con eventId
  - Subscription: 1 fila con plan="pro", status="active"
  - user_metadata.plan: "pro"
```

### Escenario 2: Webhook duplicado
```
ONVO → webhook (1ra vez) → ProcessedEvent insert → éxito
ONVO → webhook (2da vez, mismo event.id) → ProcessedEvent existe → ignorado
Resultado esperado:
  - ProcessedEvent: 1 fila
  - Subscription: 1 fila (sin duplicado)
  - auth metadata: actualizado 1 vez
```

### Escenario 3: Error de red entre webhook y ONVO API
```
ONVO → webhook → GET /checkout/sessions/:id → falla (timeout)
Resultado esperado:
  - ProcessedEvent: 1 fila con status="failed"
  - Subscription: sin cambios
  - auth metadata: sin cambios
  - ONVO reintenta → evento reprocesado (nuevo attempt)
```

### Escenario 4: Fallo en upsert de Subscription
```
ONVO → webhook → Subscription upsert → falla
Resultado esperado:
  - ProcessedEvent: no insertado (rollback implícito)
  - auth metadata: sin cambios
  - ONVO reintenta
```

---

## VEREDICTO

```
PAYMENT INTEGRITY: UNSAFE
```

### Condiciones para SAFE
1. ✅ Agregar unique constraint `userId` en Subscription table
2. ✅ Agregar tabla ProcessedEvent + verificación en webhook
3. ✅ Invertir orden: Subscription upsert antes que auth metadata
4. ✅ Agregar verificación contra ONVO API
5. ✅ Validar ONVO_WEBHOOK_SECRET al startup

### Tiempo estimado de implementación: 2-3 horas
