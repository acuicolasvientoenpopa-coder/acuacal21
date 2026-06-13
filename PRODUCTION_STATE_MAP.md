# PRODUCTION STATE MAP — AcuiCal

> Auditoría real contra sistemas en producción.
> Fecha: 2026-06-13
> Método: Consulta directa a Supabase REST API + Backend endpoints

---

## VERIFICACIONES REALIZADAS

| Fuente | URL | Estado |
|--------|-----|--------|
| Backend health | `https://acuacal21-production.up.railway.app/api/health` | ✅ OK `{"status":"ok","version":"1.0.0"}` |
| Frontend | `https://app.acuical.com` | ✅ Responde (bundle JS `index-CdOz5Rzh.js`) |
| Supabase REST | `https://smvjffbeshxcfltjoolm.supabase.co/rest/v1/*` | ✅ Accesible |

---

## TABLAS EN SUPABASE PRODUCCIÓN

### Existen (verificadas por "permission denied" = tabla existe)

| Tabla | Estado | Notas |
|-------|--------|-------|
| `User` | ✅ EXISTE | Tabla original |
| `Finca` | ✅ EXISTE | Tabla original |
| `Estanque` | ✅ EXISTE | Tabla original |
| `Especie` | ✅ EXISTE | Tabla original |
| `Bitacora` | ✅ EXISTE | Tabla original |
| `Finanza` | ✅ EXISTE | Tabla original |
| `Inventario` | ✅ EXISTE | Tabla original |
| `MovimientoInventario` | ✅ EXISTE | Tabla original |
| `Microbiologia` | ✅ EXISTE | Tabla original |
| `Veterinaria` | ✅ EXISTE | Tabla original |
| `Feedback` | ✅ EXISTE | Tabla original |
| `FincaUser` | ✅ EXISTE | Tabla original |

### NO existen (error "Could not find the table")

| Tabla | Estado | Impacto |
|-------|--------|---------|
| `Subscription` | ❌ NO EXISTE | Migración `migration_subscription.sql` NUNCA ejecutada |
| `EventLog` | ❌ NO EXISTE | Migración `migration_event_log.sql` NUNCA ejecutada |
| `ProcessedEvent` | ❌ NO EXISTE | Migración `migration_event_log.sql` NUNCA ejecutada |
| `ParametroOverride` | ❌ NO EXISTE | Migración `migration_parametros.sql` NUNCA ejecutada |

### Conclusión de tablas

**SOLO las 10 tablas originales existen en producción.**
**NINGUNA de las tablas nuevas (Subscription, EventLog, ProcessedEvent, ParametroOverride) ha sido creada.**

---

## ESTADO POR MÓDULO

### INVENTARIO
| Aspecto | Real en Producción |
|---------|-------------------|
| Tabla `Inventario` | ✅ EXISTE |
| Tabla `MovimientoInventario` | ✅ EXISTE |
| userId filter en GET /movimientos | ⚠️ CÓDIGO NUEVO — depende si backend se redeployó |
| EventLog writes | ❌ EventLog no existe — `createEventLog()` falla pero es catch-safe |
| Post-write verify | ⚠️ CÓDIGO NUEVO — depende si backend se redeployó |
| fincaId en apiToProducto | ⚠️ CÓDIGO NUEVO — depende si frontend se redeployó |

### FINANZAS
| Aspecto | Real en Producción |
|---------|-------------------|
| Tabla `Finanza` | ✅ EXISTE |
| UUID validation (fincaId) | ⚠️ CÓDIGO NUEVO |
| EventLog writes | ❌ EventLog no existe — falla catch-safe |
| Post-write verify | ⚠️ CÓDIGO NUEVO |

### BITÁCORA
| Aspecto | Real en Producción |
|---------|-------------------|
| Tabla `Bitacora` | ✅ EXISTE |
| fincaId requerido | ⚠️ CÓDIGO NUEVO |
| EventLog writes | ❌ EventLog no existe — falla catch-safe |
| Post-write verify | ⚠️ CÓDIGO NUEVO |

### PAGOS (CRÍTICO)
| Aspecto | Real en Producción |
|---------|-------------------|
| Tabla `Subscription` | ❌ NO EXISTE |
| Tabla `ProcessedEvent` | ❌ NO EXISTE |
| UNIQUE(userId) constraint | ❌ NO EXISTE |
| Webhook endpoint `/api/pagos/webhook` | ✅ Desplegado |
| Subscription upsert | ❌ FALLA SIEMPRE — tabla no existe |
| ProcessedEvent idempotencia | ❌ FALLA SIEMPRE — tabla no existe |
| Webhook retorna 200 OK con error | ⚠️ CÓDIGO VIEJO: sí; CÓDIGO NUEVO: 500 |

### PARÁMETROS WQ
| Aspecto | Real en Producción |
|---------|-------------------|
| Tabla `ParametroOverride` | ❌ NO EXISTE |
| PUT /api/parametros | ❌ FALLA SIEMPRE — upsert contra tabla inexistente |
| Overrides locales (localStorage) | ✅ Funciona solo en frontend |

### SYNC OFFLINE
| Aspecto | Real en Producción |
|---------|-------------------|
| IndexedDB queue | ✅ Funciona en frontend |
| Dedup en enqueue | ⚠️ CÓDIGO NUEVO |
| Processing deadlock fix | ⚠️ CÓDIGO NUEVO |
| Timeout + logging | ⚠️ CÓDIGO NUEVO |

### MULTIUSUARIO
| Aspecto | Real en Producción |
|---------|-------------------|
| Fuga en GET /movimientos | ⚠️ CÓDIGO NUEVO (backend viejo aún expone datos) |
| RLS policies | ✅ Habilitadas en tablas existentes |

---

## MATRIZ DE RIESGOS REALES

| Riesgo | Probabilidad | Impacto | Estado Actual |
|--------|-------------|---------|---------------|
| Webhook acepta pago sin Subscription | **ALTA** (100%) | CRÍTICO | ❌ Subscription no existe en DB |
| Duplicación de pagos por falta de idempotencia | ALTA | CRÍTICO | ❌ ProcessedEvent no existe |
| Parámetros WQ no persisten | ALTA | MEDIO | ❌ ParametroOverride no existe |
| Fuga de datos en movimientos | MEDIA | ALTO | ⚠️ backend viejo aún sin filtro |
| Sync queue bloqueado | BAJA | ALTO | ⚠️ código nuevo no desplegado |
| POST endpoints fallan por EventLog | BAJA | ALTO | ✅ Código nuevo es catch-safe |
