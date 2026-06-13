# SYNC_CONSISTENCY_REPORT.md — AcuiCal

> Análisis del sistema de sincronización offline.
> Fecha: 2026-06-13

---

## ARQUITECTURA ACTUAL

```
Frontend Page → api.mutate()
                     │
              ┌──────┴──────┐
              ▼              ▼
         fetch() OK     fetch() FAIL
              │              │
         return OK    enqueue(SyncOp)
                          │
                    scheduleProcess()
                          │
                    doProcess() cada 1s
                          │
                    fetch() → ok → delete from queue
                    fetch() → fail → retry++ | MAX → failed store
```

---

## PROBLEMAS CRÍTICOS

### 1. Processing deadlock (CRITICAL)

**Código actual (`sync.ts:49-51`):**
```typescript
let processing = false;
async function doProcess(...) {
  if (processing) return;
  processing = true;
  const db = await getDb();  // Si esto falla → processing queda true
  ...
  processing = false;  // NUNCA se ejecuta si hay error antes
}
```

**Escenario:** `getDb()` lanza error (IndexedDB corrupto, cuota excedida, etc). `processing` queda `true` para siempre. Todos los llamados futuros a `scheduleProcess` no hacen nada. La cola de sync muere.

**Fix:** Envolver en `try/finally`:
```typescript
async function doProcess(...) {
  if (processing) return;
  processing = true;
  try {
    const db = await getDb();
    ...
  } finally {
    processing = false;
    notify();
  }
}
```

---

### 2. Sin idempotencia en enqueue (CRITICAL)

**Código actual (`sync.ts:103-111`):**
```typescript
export async function enqueue(op) {
  const db = await getDb();
  const item: SyncOp = {
    ...op,
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    retries: 0,
  };
  await db.put(STORE, item);
  notify();
  return item;
}
```

**Flujo de duplicación:**
1. Usuario hace clic en "Guardar" dos veces rápidamente
2. `api.mutate()` llama dos veces
3. Ambos fetch fallan (offline)
4. Dos `enqueue()` con mismo path+method+body
5. Ambas se guardan en IndexedDB con IDs diferentes
6. Cuando vuelve la red, ambas se ejecutan → **duplicados en Supabase**

**Fix:** Verificar duplicado antes de encolar (comparar path+method+body).

---

### 3. Sin logging ni monitoreo (CRITICAL)

**Estado actual:** Cero `console.error` en todo `sync.ts`. El único registro de error es `op.lastError = err.message` que se guarda en IndexedDB (volátil, invisible para el desarrollador).

**Escenario:** La cola tiene 50 operaciones que fallan consistentemente por un bug del backend. El usuario no ve nada. El desarrollador no ve nada. Los datos se pierden en FAILED_STORE.

**Fix:** Agregar logging en cada catch:
```typescript
catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[Sync] Operation ${op.id} failed (retry ${op.retries}/${MAX_RETRIES}): ${msg}`);
  op.retries++;
  op.lastError = msg;
  ...
}
```

---

### 4. Sin verificación post-write (CRITICAL)

**Código actual (`sync.ts:63-64`):**
```typescript
if (res.ok || res.status === 404) {
  await db.delete(STORE, op.id);  // Confía en 200 OK sin verificar
  notify();
}
```

**Escenario:** El backend responde 200 OK pero el registro no se persiste (bug de Supabase, RLS policy mal configurada, trigger que falla silenciosamente). La operación se elimina de la cola y el dato se pierde.

**Fix:** Para POST, hacer GET de verificación antes de eliminar:
```typescript
if (res.ok) {
  // Para POST, verificar que el registro existe
  if (op.method === "POST" && res.status === 201) {
    const verify = await fetch(`${apiUrl}${op.path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!verify.ok) {
      // No se pudo verificar → mantener en cola
      continue;
    }
  }
  await db.delete(STORE, op.id);
}
```

---

### 5. ID débil con colisiones (HIGH)

**Código:** `id: \`sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}\``

El sufijo aleatorio son ~4 caracteres → ~1.6 millones de combinaciones. Si dos operaciones ocurren en el mismo milisegundo (Date.now()), hay 1/1.6M de colisión. Baja probabilidad pero pérdida total de datos si ocurre (IndexedDB `put` sobrescribe).

**Fix:** `id: crypto.randomUUID()` (disponible en todos los navegadores modernos).

---

### 6. Sin correlation ID con backend (HIGH)

**Problema:** Las requests del sync no llevan ningún header que permita correlacionar el request con el log del servidor. Si una operación falla, no se puede determinar qué request del servidor corresponde.

**Fix:** Agregar header `X-Request-ID: ${op.id}` en cada fetch del sync.

---

### 7. Sin timeout en fetch (MEDIUM)

**Problema:** `fetch()` sin `AbortController`. Si el servidor está caído o hay pérdida de paquetes, el fetch puede quedarse colgado minutos (hasta el timeout por defecto del navegador).

**Impacto:** Una operación colgada bloquea todo el process loop (las siguientes iteraciones no comienzan hasta que termine la actual).

**Fix:** Agregar timeout de 15s:
```typescript
const ac = new AbortController();
const timer = setTimeout(() => ac.abort(), 15000);
const res = await fetch(url, { ..., signal: ac.signal });
clearTimeout(timer);
```

---

### 8. Sin backoff exponencial (MEDIUM)

**Problema:** El schedule es fijo a 1s. Cuando hay errores, sigue intentando cada 1s sin backoff. Esto puede sobrecargar el backend.

**Fix:** Backoff exponencial en los reintentos:
```typescript
const delay = Math.min(1000 * Math.pow(2, op.retries), 60000);
await new Promise(r => setTimeout(r, delay));
```

---

### 9. Race condition entre tabs (MEDIUM)

**Problema:** `processing` es un booleano en memoria. Dos tabs pueden llamar `doProcess` simultáneamente en contextos separados. No hay coordinación.

**Impacto:** Múltiples tabs haciendo sync en paralelo, duplicando requests al backend.

**Fix:** Usar `BroadcastChannel` o `navigator.locks.request` para coordinar entre tabs.

---

### 10. api.ts — mutate encola errores no retryable (HIGH)

**Código (`api.ts:49-58`):**
```typescript
const mutate = async (method, path, body) => {
  try {
    const data = await request(method, path, body);
    return { ok: true, data };
  } catch {
    enqueue({ method, path, body });  // Encola 400, 401, 403, 422 también
    scheduleProcess(base, token);
    return { ok: false };
  }
};
```

**Problema:** Cualquier error HTTP (400 Bad Request, 401 Unauthorized, 403 Forbidden, 422 Validation) se encola en la sync queue. Estos errores nunca se resolverán porque son errores de validación, no de red.

**Impacto:** La cola offline se llena de operaciones que nunca podrán completarse.

**Fix:** No encolar errores 4xx (excepto 429, rate limit):
```typescript
catch (err: any) {
  // No encolar errores de validación/autenticación
  if (err.message?.startsWith("HTTP 4")) {
    const status = parseInt(err.message.split(" ")[1]);
    if (status !== 429) {
      console.error(`[API] Error permanente en ${method} ${path}: ${err.message}`);
      return { ok: false, permanent: true };
    }
  }
  enqueue({ method, path, body });
  scheduleProcess(base, token);
  return { ok: false };
}
```

---

## FLUJO DE SINCRONIZACIÓN CORREGIDO (PROPUESTA)

```
Frontend Page → api.mutate()
                     │
              ┌──────┴──────┐
              ▼              ▼
         fetch() OK     fetch() FAIL
              │              │
         return OK     ¿Error retryable?
                         │       │
                       SÍ       NO (4xx permanente)
                         │       │
                    enqueue()  console.error + return
                    (con dedup)  (no encolar)
                         │
                    scheduleProcess()
                         │
                    doProcess()
                    (try/finally)
                         │
                    fetch() con timeout + X-Request-ID
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
          200 OK                Network / 5xx
              │                     │
         GET verify?            retry++
         (post-write)           backoff exponencial
              │                     │
         delete queue        MAX_RETRIES → FAILED_STORE
              │                     │
         return OK           console.error + notify
```

---

## RESUMEN

| # | Problema | Riesgo | Fix Prioridad |
|---|----------|--------|---------------|
| 1 | Processing deadlock | CRITICAL | Alta |
| 2 | Sin dedup en enqueue | CRITICAL | Alta |
| 3 | Sin logging | CRITICAL | Alta |
| 4 | Sin post-write verify | CRITICAL | Alta |
| 5 | ID débil | HIGH | Alta |
| 6 | Sin correlation ID | HIGH | Alta |
| 7 | Sin timeout | MEDIUM | Media |
| 8 | Sin backoff | MEDIUM | Media |
| 9 | Race condition tabs | MEDIUM | Baja |
| 10 | Encola errores no retryable | HIGH | Alta |
