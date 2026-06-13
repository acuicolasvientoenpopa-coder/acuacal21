# HARDENING_REPORT.md — AcuiCal

> Auditoría de endurecimiento para producción.
> Fecha: 2026-06-13

---

## RESUMEN EJECUTIVO

| Dimensión | Status | Riesgo |
|-----------|--------|--------|
| Idempotencia de escrituras | ❌ FAIL | CRITICAL |
| Sincronización offline | ❌ FAIL | CRITICAL |
| Protección de pagos | ❌ FAIL | CRITICAL |
| Consistencia multidispositivo | ❌ FAIL | HIGH |
| Validación backend | ⚠️ PARCIAL | HIGH |
| Detección de fallas silenciosas | ❌ FAIL | CRITICAL |
| Auditoría de escrituras | ❌ FAIL | HIGH |

**NO APTO PARA PRODUCCIÓN** — 7 hallazgos críticos bloqueantes.

---

## 1. IDEMPOTENCIA GLOBAL DE ESCRITURAS

### 1.1 Sync queue — Sin idempotencia (CRITICAL)
**Archivo:** `src/services/sync.ts:103-113`
**Problema:** `enqueue()` no verifica duplicados. El mismo body+path+method puede encolarse N veces (doble click, retry de red, race condition).
**Impacto:** Duplicación masiva de datos en Supabase.

### 1.2 Webhook pagos — Sin idempotencia (CRITICAL)
**Archivo:** `server/src/routes/pagos.ts:84-156`
**Problema:** No hay tabla `ProcessedEvent`. Si ONVO reenvía el mismo `event.id` (práctica estándar), se procesa completo cada vez.
**Impacto:** Múltiples subscription rows, doble actualización de plan.

### 1.3 Backend upsert sin unique constraint (CRITICAL)
**Archivo:** `server/src/routes/pagos.ts:114-115`
**Problema:** `upsert(payload, { onConflict: "userId" })` pero `userId` NO tiene unique constraint en PostgreSQL (solo hay INDEX, no UNIQUE). PostgreSQL lanza error 42P10, el catch lo traga, y la Subscription nunca se persiste.
**Impacto:** CERO registros en Subscription table. Inconsistencia total.

---

## 2. SINCRONIZACIÓN OFFLINE SEGURA

### 2.1 Processing deadlock (CRITICAL)
**Archivo:** `src/services/sync.ts:50-53`
**Problema:** Si `getDb()` o `db.getAll()` lanzan excepción, `processing` queda `true` para siempre. La cola se bloquea permanentemente.
**Impacto:** Denegación de servicio del sync queue.

### 2.2 Sin logging ni monitoreo (CRITICAL)
**Archivo:** `src/services/sync.ts:76-84`
**Problema:** Todos los errores de sync se tragan. `err.message` solo se guarda en IndexedDB (efímero). No hay `console.error`, no hay telemetría.
**Impacto:** Operaciones ciegas ante fallos de sincronización.

### 2.3 Sin verificación post-write (CRITICAL)
**Archivo:** `src/services/sync.ts:63-64`
**Problema:** Después de recibir 200 OK, se borra de la cola sin hacer GET de verificación. No se confirma que el dato realmente persista en Supabase.
**Impacto:** Pérdida silenciosa si el servidor acepta pero falla al persistir.

### 2.4 ID débil en SyncOp (HIGH)
**Archivo:** `src/services/sync.ts:107`
**Problema:** ID de 4 caracteres alfanuméricos (~1.6M combinaciones). Colisiones posibles en IndexedDB (el `put` sobrescribe por key).
**Impacto:** Pérdida de datos por sobrescritura de claves.

### 2.5 Sin correlation ID (HIGH)
**Archivo:** `src/services/sync.ts:58-61`
**Problema:** No se envía header `X-Request-ID`. Imposible correlacionar logs frontend ↔ backend.
**Impacto:** Debugging imposible en producción.

### 2.6 Sin estados explícitos (MEDIUM)
**Archivo:** `src/services/sync.ts`
**Problema:** Solo hay dos estados implícitos (en STORE = PENDING, en FAILED_STORE = FAILED). No existe SYNCED. Items exitosos se borran sin historial.
**Impacto:** Imposible auditar qué se sincronizó.

### 2.7 Sin timeout en fetch de sync (MEDIUM)
**Archivo:** `src/services/sync.ts:58`
**Problema:** `fetch()` sin `AbortController`. Si el servidor cuelga, la operación queda bloqueada para siempre.
**Impacto:** Sync queue bloqueado.

---

## 3. PROTECCIÓN DE PAGOS

### 3.1 Subscription upsert roto (CRITICAL — BLOQUEANTE)
**Detalle en sección 1.3.** Sin unique constraint en userId, el upsert falla siempre.

### 3.2 Sin verificación contra ONVO API (HIGH)
**Archivo:** `server/src/routes/pagos.ts:124-149`
**Problema:** El webhook confía ciegamente en el body. No hace GET a ONVO API para verificar que el checkout session realmente existe y está paid.
**Impacto:** Si el webhook secret se filtra, cualquiera puede activar planes.

### 3.3 Sin rollback en updateUserPlan (HIGH)
**Archivo:** `server/src/routes/pagos.ts:94-121`
**Problema:** Orden: 1) update auth metadata, 2) upsert Subscription. Si #2 falla, #1 ya se ejecutó. No hay compensación.
**Impacto:** Usuario con plan upgradeado pero sin subscription record.

### 3.4 Secret sin HMAC (MEDIUM)
**Archivo:** `server/src/routes/pagos.ts:86`
**Problema:** Comparación de secret plano en header, sin firma HMAC sobre el body. `ONVO_WEBHOOK_SECRET` puede ser `""` si no está configurado.
**Impacto:** Suplantación del webhook si el secret se filtra.

### 3.5 Sin rate limiting en webhook (MEDIUM)
**Archivo:** `server/src/routes/pagos.ts:84`
**Problema:** Sin `express-rate-limit`. Un atacante puede bombardear el endpoint.
**Impacto:** Carga excesiva en Supabase Auth + DB.

---

## 4. CONSISTENCIA MULTIDISPOSITIVO

### 4.1 Sin last-write-wins explícito (HIGH)
**Problema:** No hay mecanismo de resolución de conflictos. Dos dispositivos pueden modificar el mismo registro simultáneamente. El último en sync sobreescribe sin merge.
**Impacto:** Pérdida de datos del dispositivo más lento.

### 4.2 Sin updatedAt en writes conflictivos (MEDIUM)
**Problema:** Varias tablas tienen `updatedAt` pero el backend no lo usa para detección de conflictos (no hay "if client_updatedAt > server_updatedAt" check).
**Impacto:** Reemplazo silencioso de datos más recientes por datos más viejos.

---

## 5. VALIDACIÓN BACKEND

### 5.1 Fuga de datos: GET /movimientos sin userId (CRITICAL)
**Archivo:** `server/src/routes/inventario.ts:88-91`
**Problema:** `MovimientoInventario` query sin `.eq("userId", req.userId)`. Cualquier usuario autenticado ve todos los movimientos del sistema.
**Impacto:** Exposición total de datos de inventario entre usuarios.

### 5.2 PUT /parametros sin Zod (HIGH)
**Archivo:** `server/src/routes/parametros.ts:23-33`
**Problema:** `const overrides: Record<string, any> = req.body;` — acepta cualquier payload sin schema.
**Impacto:** Datos maliciosos o corruptos pueden persistirse.

### 5.3 POST /login sin Zod (MEDIUM)
**Archivo:** `server/src/routes/auth.ts:45-50`
**Problema:** Validación manual con `if (!email || !password)`. Sin validación de formato email, longitud.
**Impacto:** Posibles errores 500 por datos inesperados.

### 5.4 userId desde body en register (MEDIUM)
**Archivo:** `server/src/routes/auth.ts:11-12`
**Problema:** El schema `registerSchema` recibe `userId` del body en lugar de usar exclusivamente `req.userId` del JWT.
**Impacto:** Un usuario podría registrar un perfil con userId ajeno (aunque el JWT mitiga parcialmente).

---

## 6. DETECCIÓN DE FALLAS SILENCIOSAS

### 6.1 Catch silenciosos en frontend (7 HIGH, 5 MEDIUM)
**Hallazgo general:** 12 endpoints críticos en frontend con `catch {}` que tragan errores de API. El dato se guarda en localStorage pero el servidor nunca lo recibe.

| Archivo | Línea | Operación |
|---------|-------|-----------|
| `Bitacora.tsx` | 156 | POST /bitacora |
| `Microbiologia.tsx` | 145 | POST/PUT /microbiologia (cultivo) |
| `Microbiologia.tsx` | 176 | POST/PUT /microbiologia (medicación) |
| `Parametros.tsx` | 80,93,105 | PUT /parametros (3x) |
| `VeterinaryReportWizard.tsx` | 152 | POST /veterinaria |
| `Finanzas.tsx` | 104 | POST /finanzas bulk save |
| `Inventario.tsx` | 91,110 | POST/PUT /inventario |
| `Fincas.tsx` | 66,118 | POST /fincas/estanques |

**Impacto:** Operaciones parecen exitosas al usuario pero solo persisten en localStorage.

### 6.2 Catch silenciosos en backend (3 HIGH)
| Archivo | Línea | Problema |
|---------|-------|----------|
| `admin.ts` | 75 | `catch {}` en listUsers |
| `feedback.ts` | 38-40 | `catch {}` — siempre responde `{ok: true}` aunque falle |
| `pagos.ts` | 119 | `catch ((upsertErr) => console.error(...))` — no lanza error, webhook responde 200 OK aunque Subscription upsert falle |

### 6.3 Sin logging estructurado (HIGH)
**Problema transversal:** Ningún error del frontend se loggea en consola ni se envía a PostHog/Sentry. El backend solo usa `console.log`/`console.error` sin estructura ni correlation ID.

---

## 7. AUDITORÍA DE ESCRITURAS

### 7.1 Sin post-write verification (HIGH)
**Problema:** Ningún endpoint backend verifica post-write que el registro efectivamente se haya persistido. El frontend confía en 200/201 sin confirmación.
**Impacto:** Inconsistencias silenciosas.

### 7.2 Sin tabla de eventos procesados (HIGH)
**Problema:** No hay registro de qué webhooks se procesaron. Imposible auditar pagos.
**Impacto:** Sin trazabilidad de pagos.

---

## HALLAZGOS CRÍTICOS BLOQUEANTES (DEBE ARREGLARSE ANTES DE PRODUCCIÓN)

| # | Hallazgo | Archivo | Fix |
|---|----------|---------|-----|
| C1 | Subscription upsert con onConflict userId sin unique constraint | `pagos.ts:114` + `migration_subscription.sql` | Agregar `UNIQUE("userId")` a Subscription table + migration |
| C2 | Webhook sin idempotencia por event.id | `pagos.ts:84-156` | Crear tabla ProcessedEvent, verificar event.id antes de procesar |
| C3 | Sync queue deadlock si getDb falla | `sync.ts:50-53` | Agregar `try/finally { processing = false }` |
| C4 | Sync queue sin logging | `sync.ts:76-84` | Agregar `console.error` en cada catch |
| C5 | Fuga de datos: GET /movimientos sin userId | `inventario.ts:88-91` | Agregar `.eq("userId", req.userId)` |
| C6 | 12 catches silenciosos en frontend | múltiples | Agregar toast error + console.error en cada uno |
| C7 | api.ts catch {} sin logging ni discriminación | `api.ts:38-46,53-57` | Loggear error, no encolar 4xx permanentes |

---

## VEREDICTO

```
HARDENING STATUS:     FAILED
DATA CONSISTENCY RISK: CRITICAL
PAYMENT INTEGRITY:    UNSAFE
PRODUCTION READINESS: NO
```
