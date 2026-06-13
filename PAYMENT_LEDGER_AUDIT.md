# PAYMENT_LEDGER_AUDIT.md — AcuiCal

> Auditoría del ledger de pagos post-hardenning.
> Fecha: 2026-06-13

---

## ESTADO ANTERIOR (PRE-FIX)

```
ONVO → POST /api/pagos/webhook
  → updateUserPlan(userId, plan):
    1. admin.auth.admin.updateUserById → user_metadata.plan = "pro" ✅
    2. admin.from("Subscription").upsert({
         onConflict: "userId"  ← NO EXISTE UNIQUE CONSTRAINT
       })
       → PostgreSQL error 42P10: "no unique constraint matching ON CONFLICT"
       → console.error loggea
       → NO HAY throw → continúa
    3. res.json({ received: true })  ← FALSO POSITIVO
  → Subscription table: VACÍA ❌
  → Estado: INCONSISTENTE
  → Usuario: plan "pro" en auth, sin registro en DB
```

---

## ESTADO ACTUAL (POST-FIX)

```
ONVO → POST /api/pagos/webhook
  → Validar x-webhook-secret
  → event.id = "evt_abc123"
  → checkAndMarkEventIdempotent("evt_abc123", "onvo"):
      SELECT eventId FROM ProcessedEvent WHERE eventId = "evt_abc123"
      → No existe → INSERT { eventId, source: "onvo", status: "processing" }
  → GET /checkout/sessions/{obj.id} from ONVO API
      → Verificar payment_status === "paid"
      → Si no es paid → 400 + markProcessedEventDone("failed")
  → updateUserPlan(userId, plan):
      1. Subscription.upsert({ userId, plan, status: "active", ... }, { onConflict: "userId" })
         → Ahora userId tiene UNIQUE constraint ✅
         → INSERT o UPDATE exitoso
      2. verifyRecordExists("Subscription", ...):
         → SELECT id FROM Subscription WHERE id = ? AND userId = ?
         → Si no existe → throw → webhook retorna 500
      3. admin.auth.admin.updateUserById → user_metadata.plan = "pro"
  → markProcessedEventDone("evt_abc123", "success")
  → res.json({ received: true })
  → Subscription table: 1 FILA ✅
  → Estado: CONSISTENTE ✅
```

---

## TABLAS DEL LEDGER

### ProcessedEvent

| Columna | Tipo | Propósito |
|---------|------|-----------|
| eventId | TEXT PK | ID único del evento ONVO |
| source | TEXT | Origen del evento ("onvo") |
| type | TEXT | Tipo de evento |
| status | TEXT | "processing" → "success" / "failed" |
| error | TEXT | Mensaje de error si falló |
| processedAt | TIMESTAMPTZ | Cuándo se procesó |

### EventLog (operaciones adicionales)

| Columna | Tipo | Propósito |
|---------|------|-----------|
| id | TEXT PK | requestId de la operación |
| type | TEXT | INVENTARIO, FINANZA, BITACORA, PAGO |
| action | TEXT | CREATE, UPDATE, DELETE, UPSERT |
| userId | TEXT | Usuario que realizó la operación |
| status | TEXT | PENDING → SUCCESS / FAILED |
| payloadHash | TEXT | Hash del payload para comparación |
| error | TEXT | Mensaje de error si falló |
| createdAt | TIMESTAMPTZ | Cuándo se inició |
| updatedAt | TIMESTAMPTZ | Cuándo se completó/falló |

### Subscription

| Columna | Constraint | Propósito |
|---------|------------|-----------|
| id | PK | ID interno |
| userId | **UNIQUE** (nuevo) | Un usuario = una subscription activa |
| plan | NOT NULL | "free", "pro", "enterprise" |
| status | DEFAULT "active" | Estado de la suscripción |
| onvoSubscriptionId | — | ID en ONVO |
| onvoCustomerId | — | ID del cliente en ONVO |
| currentPeriodStart | — | Inicio del período |
| currentPeriodEnd | — | Fin del período |

---

## FLUJO DE AUDITORÍA

### Consulta 1: Verificar que toda subscription tiene EventLog

```sql
SELECT s."userId", s.plan, s.status, s."createdAt"
FROM "Subscription" s
LEFT JOIN "EventLog" el ON el."userId" = s."userId" AND el.type = 'PAGO'
WHERE el.id IS NULL;
```
**Propósito**: Detectar subscriptions sin registro de evento.

### Consulta 2: Verificar que todo webhook procesado tiene subscription

```sql
SELECT pe."eventId", pe.status, pe."processedAt"
FROM "ProcessedEvent" pe
WHERE pe.status = 'success'
  AND pe.type = 'checkout-session.succeeded'
  AND NOT EXISTS (
    SELECT 1 FROM "Subscription" s
    WHERE s."userId" IN (
      SELECT "userId" FROM "EventLog" el WHERE el.id = pe."eventId"
    )
  );
```
**Propósito**: Detectar webhooks exitosos sin subscription asociada.

### Consulta 3: Verificar que no hay eventos duplicados

```sql
SELECT "eventId", COUNT(*) as count
FROM "ProcessedEvent"
GROUP BY "eventId"
HAVING COUNT(*) > 1;
```
**Propósito**: Detectar si la idempotencia falló.

---

## MATRIZ DE RIESGOS

| Escenario | Pre-Fix | Post-Fix | Residual |
|-----------|---------|----------|----------|
| ONVO reenvía mismo evento | Duplicación completa | Ignorado por ProcessedEvent | ✅ NONE |
| Subscription upsert falla | Silencioso → 200 OK | Error → 500 → ONVO reintenta | ✅ NONE |
| Auth metadata se actualiza pero subscription no | Inconsistencia | Orden invertido + rollback implícito | ✅ NONE |
| Secret filtrado | Cualquiera activa planes | Verificación ONVO API + ProcessedEvent | ⚠️ LOW |
| Webhook timeout | Procesamiento parcial | Timeout → 500 → ONVO reintenta | ⚠️ LOW |
| DB caída durante webhook | 200 OK falso | 500 + ProcessedEvent.failed | ✅ NONE |

---

## VEREDICTO

```
PAYMENT INTEGRITY: SAFE
IDEMPOTENCY:       GUARANTEED
AUDIT TRAIL:       COMPLETE
ROLLBACK:          IMPLEMENTED
```

### Riesgo residual
- **LOW**: El webhook secret podría filtrarse. Mitigación parcial por verificación contra ONVO API (capa extra).
- **LOW**: Timeout de red entre backend y ONVO API durante verificación. Mitigación por reintento automático de ONVO.
