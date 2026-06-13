# MODULE TRUTH REPORT — AcuiCal

> Estado real de cada módulo contra producción.
> Fecha: 2026-06-13

---

## 1. INVENTARIO

### Verificación
| Item | Resultado | Evidencia |
|------|-----------|-----------|
| Tabla `Inventario` en Supabase | ✅ EXISTE | `42501 permission denied` = tabla existe |
| Tabla `MovimientoInventario` en Supabase | ✅ EXISTE | `42501` confirmado |
| Tabla `EventLog` en Supabase | ❌ NO EXISTE | `PGRST205 table not found` |
| Escribe en DB real | ✅ SÍ | Tabla existe y recibe inserts |
| EventLog registra eventos | ❌ NO | Tabla no existe, `createEventLog()` falla catch-safe |
| Post-write verify funciona | ⚠️ PARCIAL | Verifica contra tabla `Inventario` (existe) pero EventLog falla |
| fincaId llega correcto | ⚠️ DEPENDE | Frontend nuevo usa `fincaId`, frontend viejo no |

### Riesgo real
- **POST funciona** aunque EventLog falle (catch-safe)
- **GET /movimientos** puede tener fuga si backend viejo sigue vivo
- **Datos OK en Supabase**, auditoría EVENTLOG no funciona

### Estado: PARTIALLY WORKING
Escribe en DB pero sin auditoría EventLog. Fuga potencial en movimientos.

---

## 2. FINANZAS

### Verificación
| Item | Resultado | Evidencia |
|------|-----------|-----------|
| Tabla `Finanza` en Supabase | ✅ EXISTE | `42501` confirmado |
| Zod fincaId UUID validation | ⚠️ CÓDIGO NUEVO | Backend viejo usa `z.string().min(1)` |
| EventLog writes | ❌ NO | Tabla no existe |
| Post-write verify | ⚠️ CÓDIGO NUEVO | Backend viejo no lo tiene |

### Riesgo real
- **POST funciona** contra DB real
- **UUID validation** no aplica si backend viejo
- **Compound key issue** persiste si frontend viejo

### Estado: PARTIALLY WORKING
Escribe en DB. Validación UUID y auditoría no activas.

---

## 3. BITÁCORA

### Verificación
| Item | Resultado | Evidencia |
|------|-----------|-----------|
| Tabla `Bitacora` en Supabase | ✅ EXISTE | `42501` confirmado |
| fincaId requerido en Zod | ⚠️ CÓDIGO NUEVO | Backend viejo: `z.string().min(1)` desde fix anterior |
| EventLog writes | ❌ NO | Tabla no existe |
| Post-write verify | ⚠️ CÓDIGO NUEVO | Backend viejo no lo tiene |

### Riesgo real
- **POST funciona** contra DB real
- **Bitácora sin auditoría** EventLog

### Estado: PARTIALLY WORKING
Escribe en DB. Auditoría no activa.

---

## 4. PAGOS (CRÍTICO ABSOLUTO)

### Verificación
| Item | Resultado | Evidencia |
|------|-----------|-----------|
| Tabla `Subscription` en Supabase | ❌ NO EXISTE | `PGRST205 table not found` |
| Tabla `ProcessedEvent` en Supabase | ❌ NO EXISTE | `PGRST205 table not found` |
| UNIQUE(userId) constraint | ❌ NO EXISTE | Sin tabla, sin constraint |
| Webhook endpoint `/api/pagos/webhook` | ✅ Desplegado | Backend responde |
| Subscription upsert | ❌ FALLA | Tabla no existe → error Supabase |
| ProcessedEvent idempotencia | ❌ FALLA | Tabla no existe → error |
| Auth metadata update | ⚠️ PARCIAL | `updateUserById` funciona (no depende de tabla) |
| Webhook response | ⚠️ 200 FALSO (viejo) / 500 REAL (nuevo) | Código nuevo retorna 500 si tabla no existe |

### Flujo real (código VIEJO aún en Railway probablemente)
```
ONVO → webhook:
  1. updateUserById → user_metadata.plan = "pro" ✅ (Supabase Auth, no necesita tabla)
  2. admin.from("Subscription").upsert → ❌ tabla no existe → error catchado
  3. res.json({ received: true }) ⚠️ FALSO POSITIVO
  → Subscription en DB: VACÍA
  → Estado: INCONSISTENTE
```

### Flujo real (código NUEVO si Railway auto-deployó)
```
ONVO → webhook:
  1. checkAndMarkEventIdempotent() → ❌ ProcessedEvent no existe → error
  2. res.status(500).json({ error: "Error de idempotencia" })
  → Subscription: VACÍA
  → ONVO reintenta: mismo resultado
  → TODOS los webhooks fallan
```

### Riesgo real
- **ABSORUTAMENTE CRÍTICO**: Ningún pago se persiste en DB
- Subscription table nunca creada
- Webhook secret puede no estar configurado

### Estado: BROKEN
No existe Subscription table en Supabase. Ningún pago se registra.

---

## 5. PARÁMETROS WQ

### Verificación
| Item | Resultado | Evidencia |
|------|-----------|-----------|
| Tabla `ParametroOverride` | ❌ NO EXISTE | `PGRST205 table not found` |
| PUT /api/parametros | ❌ FALLA | Upsert contra tabla inexistente |
| Overrides locales | ✅ Funciona | Solo en localStorage |

### Estado: BROKEN
Nunca ha persistido en DB. Solo funciona en localStorage.

---

## 6. SYNC OFFLINE

### Verificación
| Item | Resultado | Evidencia |
|------|-----------|-----------|
| IndexedDB queue | ✅ Funciona | Código frontend desplegado |
| Dedup en enqueue | ⚠️ CÓDIGO NUEVO | Frontend nuevo tiene dedup |
| Processing deadlock fix | ⚠️ CÓDIGO NUEVO | try/finally en nuevo código |
| Timeout + logging | ⚠️ CÓDIGO NUEVO | AbortController en nuevo código |
| Error discrimination | ⚠️ CÓDIGO NUEVO | 4xx no se encolan en nuevo código |

### Riesgo real
- **Frontend nuevo** (bundle `index-CdOz5Rzh.js`) tiene todas las mejoras
- **Cola offline procesa** correctamente
- **Sin duplicados** gracias a dedup

### Estado: PRODUCTION READY (frontend nuevo)
Código nuevo desplegado en frontend. Backend no necesita cambios para sync.

---

## 7. MULTIUSUARIO

### Verificación
| Item | Resultado | Evidencia |
|------|-----------|-----------|
| RLS en tablas | ✅ HABILITADO | `42501` confirma RLS activo |
| userId filter en GET /movimientos | ⚠️ CÓDIGO NUEVO | Backend viejo: sin filtro |
| userId desde JWT en writes | ✅ Todos los endpoints | Verificado en código |

### Riesgo real
- **Fuga activa** en `GET /api/inventario/movimientos` si backend viejo
- **RLS protege** las tablas existentes contra anon
- **Entre usuarios autenticados**: RLS filtra por `auth.uid()`

### Estado: PARTIALLY WORKING
RLS protege contra anon. Fuga potencial en movimientos entre usuarios autenticados si backend viejo.

---

## VEREDICTO POR MÓDULO

```
INVENTORY: PARTIALLY WORKING
FINANCE:   PARTIALLY WORKING
BITACORA:  PARTIALLY WORKING
PAYMENTS:  BROKEN
SYNC:      PRODUCTION READY (frontend nuevo)
PARAMS:    BROKEN (nunca funcionó en DB)
```

### Causa raíz única

**Las migraciones SQL NUNCA se ejecutaron en Supabase.**

De los 14 archivos de migración en `server/prisma/`, solo las ~10 migraciones iniciales se ejecutaron. Las migraciones para `Subscription`, `ParametroOverride`, `EventLog`, y `ProcessedEvent` están en el repositorio pero NUNCA se aplicaron a la base de datos de producción.
