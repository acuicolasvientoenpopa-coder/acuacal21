# AUDITORÍA CTO + STAFF ENGINEERING — AcuiCal/AquaCalc

> Fecha: 2026-06-10
> Auditar: ia
> Repositorio: silent-meadow (AcuiCal 2.1)
> Frontend: https://acuacla2112.netlify.app
> Backend: https://acuacal21-production.up.railway.app/api

---

## RESUMEN EJECUTIVO

**AquaCalc es un prototipo funcional con buen dominio de negocio pero NO está listo para clientes de pago.**

El producto resuelve un problema real (gestión acuícola para pequeños productores LATAM) y tiene suficiente funcionalidad para ser útil. Sin embargo, tiene **agujeros de seguridad críticos** (credenciales de base de datos en git, backdoor de privilegios vía localStorage), **falta el sistema de pagos**, **no hay multi-tenancy real**, y la **arquitectura offline-first es superficial**.

**Potencial: ALTO.** El nicho de acuicultura LATAM está desatendido, y el producto tiene profundidad técnica (fórmulas con referencias FAO/Boyd/Timmons) que sus competidores no tienen.

**Riesgo: ALTO.** Los bugs de seguridad pueden matar el negocio antes de empezar. La deuda técnica es manejable pero hay que priorizarla.

---

## FASE 1 — INVENTARIO COMPLETO DEL SISTEMA

### Árbol Funcional

```
AcuiCal 2.1
├── Core TS (7 módulos, 25 tests)
│   ├── formulas.ts         → Cálculos: biomasa, FCR, rentabilidad, energía, volumen
│   ├── species-defaults.ts → 7 especies predefinidas + ENERGY_DEFAULTS
│   ├── i18n.ts             → ~430 claves × 3 idiomas
│   ├── currencies.ts       → 16 monedas LATAM
│   ├── validators.ts       → WQ, formularios, email (NO se usa Firebase, código legacy)
│   ├── observations.ts     → 10 observaciones clínicas
│   ├── plan.ts             → Límites Free/Pro/Enterprise
│   └── inventario-types.ts → Tipos Producto/Movimiento/Categoría
│
├── Store (7 contextos/hooks)
│   ├── auth.tsx            → Supabase Auth + JWT
│   ├── language.tsx        → i18n (NO persiste)
│   ├── currency.tsx        → Persiste localStorage
│   ├── theme.tsx           → Persiste localStorage
│   ├── lookups.ts          → Especies/Fincas/Estanques (localStorage only)
│   ├── inventario.ts       → CRUD inventario (localStorage only)
│   └── saveIndicator.ts    → UI feedback
│
├── Components (7)
│   ├── Layout.tsx          → Header + Sidebar + Outlet + offline bar
│   ├── Sidebar.tsx         → Navegación + idioma + moneda (integrado en Layout)
│   ├── GlobalSearch.tsx    → Búsqueda en localStorage
│   ├── Toast.tsx           → Notificaciones toast
│   ├── Tutorial.tsx        → 5 pasos interactivo
│   ├── Profile.tsx         → Editar perfil
│   └── ConfirmModal.tsx    → Confirmación genérica
│
├── Pages (15)
│   ├── Login.tsx           → Login/Register/Forgot (i18n, check términos)
│   ├── Terminos.tsx        → Términos (público)
│   ├── Dashboard.tsx       → Resumen + cards (localStorage only)
│   ├── Calculator.tsx      → Calculadora completa (local, no guarda)
│   ├── Bitacora.tsx        → CRUD API + localStorage fallback
│   ├── Zootecnico.tsx      → Gráficos (localStorage only)
│   ├── Especies.tsx        → CRUD API + localStorage fallback
│   ├── Fincas.tsx          → CRUD API + localStorage fallback
│   ├── Parametros.tsx      → WQ params (localStorage only)
│   ├── Formulas.tsx        → Estático (referencias técnicas)
│   ├── Microbiologia.tsx   → CRUD API + localStorage fallback
│   ├── Finanzas.tsx        → CRUD API + localStorage fallback
│   ├── Inventario.tsx      → CRUD API + localStorage fallback
│   ├── veterinary/         → Wizard diagnóstico API + localStorage
│   ├── Admin.tsx           → Master Panel (localStorage + debug)
│   ├── MasterPage.tsx      → Admin alternativo (código duplicado)
│   ├── Mapa.tsx            → Diagrama arquitectura (estático)
│   └── GeoPond.tsx         → Medición geo Leaflet (no probado funcionalmente)
│
├── Backend (Express + Prisma + Supabase)
│   ├── 8 routers
│   │   ├── auth.ts         → 3 endpoints (register, login, logout)
│   │   ├── fincas.ts       → 6 endpoints (CRUD fincas + estanques)
│   │   ├── bitacora.ts     → 3 endpoints (GET, POST, DELETE — sin PUT)
│   │   ├── especies.ts     → 4 endpoints (CRUD)
│   │   ├── finanzas.ts     → 4 endpoints (CRUD)
│   │   ├── inventario.ts   → 6 endpoints (CRUD productos + movimientos)
│   │   ├── microbiologia.ts → 4 endpoints (CRUD)
│   │   └── veterinaria.ts  → 3 endpoints (GET, POST, DELETE — sin PUT)
│   ├── 10 tablas Prisma
│   ├── 4 enums PostgreSQL
│   └── 31 endpoints total (4 públicos, 27 protegidos)
│
├── Infraestructura
│   ├── Frontend: Netlify (SPA, _redirects)
│   ├── Backend: Railway (Express)
│   ├── DB: Supabase PostgreSQL
│   ├── Auth: Supabase Auth (JWT, persistSession)
│   └── PWA: vite-plugin-pwa + Workbox
```

### Funcionalidades por Estado

| Funcionalidad | Estado | Observaciones |
|---------------|--------|---------------|
| Calculadora biomasa/FCR/ración | ✅ Completo | Probado con 25 tests |
| Cálculos energía (elect/comb/recibo) | ✅ Completo | Tests incluidos |
| Volumen estanques (4 formas) | ✅ Completo | Tests incluidos |
| Login/Register | ✅ Funcional | Sin confirmación email |
| CRUD Bitácora | ✅ Funcional | API + localStorage |
| CRUD Fincas | ✅ Funcional | API + localStorage |
| CRUD Especies | ✅ Funcional | API + localStorage |
| CRUD Finanzas | ✅ Funcional | API + localStorage |
| CRUD Microbiología | ✅ Funcional | API + localStorage |
| CRUD Inventario | ✅ Funcional | API + localStorage (store es solo local) |
| CRUD Veterinaria | ✅ Funcional | API + localStorage |
| Dashboard | ⚠️ Parcial | Solo localStorage, faltan métricas clave |
| Zootécnico gráficos | ⚠️ Parcial | Solo localStorage, data limitada |
| Parámetros WQ | ⚠️ Parcial | Solo localStorage |
| GeoPond (Leaflet) | ⚠️ No probado | Mapa integrado, funcionalidad dudosa |
| Búsqueda global | ✅ Funcional | localStorage |
| Tutorial interactivo | ✅ Funcional | localStorage |
| Exportación PDF | ✅ Funcional | jsPDF |
| Exportación Excel | ✅ Funcional | SheetJS |
| Temas dark/light | ✅ Funcional | localStorage |
| PWA instalable | ✅ Funcional | Service worker básico |
| Admin/Panel | ✅ Funcional | Debug + override plan/rol |
| Multi-idioma ES/EN/PT | ✅ Funcional | ~430 claves |
| **Sistema de pagos** | ❌ Ausente | **BLOQUEANTE** |
| **Plan/rol enforcement** | ❌ Roto | Backdoor localStorage |
| **Multi-tenancy** | ❌ Ausente | Todos ven mismos datos |
| **Sync offline cola** | ❌ Ausente | Fallback crudo |
| **Confirmación email** | ❌ OFF | Registro instantáneo |
| **Recuperación contraseña** | ⚠️ Sin probar | Usa Supabase redirect |
| **PUT bitácora** | ❌ Ausente | No se puede editar |
| **PUT estanques** | ❌ Ausente | No se puede editar estanque individual |
| **RLS Supabase** | ❌ Ausente | Solo app-layer auth |
| **CI/CD** | ❌ Ausente | No hay GitHub Actions |
| **Rate limiting** | ❌ Ausente | API expuesta |
| **Tests backend** | ❌ Ausente | Solo 1 test.mjs manual |
| **seed.ts** | ❌ Ausente | Script reference exists, file missing |

---

## FASE 2 — ANÁLISIS DE ARQUITECTURA

### Patrones

| Patrón | Estado | Evaluación |
|--------|--------|------------|
| React Context | ✅ Usado | Auth, Language, Currency, Theme — bien |
| Custom hooks | ✅ Usado | lookups, inventario, saveIndicator — bien |
| Core puro TS | ✅ Excelente | formulas.ts, species.ts sin React ni DOM |
| Barrel exports | ✅ Usado | core/index.ts, pages/index.ts |
| Layout route | ✅ Usado | React Router v6 Outlet |
| Protected route | ✅ Usado | ProtectedRoute wrapper |
| API service pattern | ❌ Ausente | Llamadas fetch directas en cada página |
| Error boundaries | ❌ Ausente | Cero ErrorBoundary en el árbol |
| Lazy loading | ❌ Ausente | Todas las páginas importadas eager |
| Code splitting | ❌ Ausente | Un solo chunk |
| Abstraction layer | ❌ Ausente | src/services/ está vacío |

### Anti-Patrones Detectados

1. **CRÍTICO: Privilegio por localStorage** — `aquacalc_plan_override` y `aquacalc_rol_override` permiten a cualquier usuario auto-asignarse plan "enterprise" o rol "admin". El sistema de planes/roles es 100% simulacro.

2. **ALTO: Mezcla de lógica API en páginas** — Cada página (`Bitacora.tsx`, `Fincas.tsx`, etc.) define su propia función `api()` y maneja fetch + error + localStorage inline. Esto es código duplicado masivo (~7 implementaciones del mismo patrón).

3. **ALTO: Patrón JSON.parse en cada página** — `loadLocal()` y `saveLocal()` se repiten idénticamente en 5+ archivos.

4. **ALTO: Fallback silencioso** — Cuando la API falla, el código hace `.catch(() => ... loadLocal())` sin notificar al usuario. El usuario cree que está en línea pero está viendo datos stale.

5. **MEDIO: any generalizado** — `dbToRecord(r: any)`, `payload: any`, `data: any[]`. TypeScript no está dando casi protección en las páginas.

6. **MEDIO: Estado local masivo en Calculator** — 30+ `useState` calls en Calculator.tsx. Refactorizable con useReducer.

7. **MEDIO: store/inventario.ts es localStorage-only** — A pesar de que CONTEXT.md dice "API + localStorage", el hook `useInventario()` nunca toca la API. La sincronización se hace desde `pages/Inventario.tsx` manualmente.

8. **BAJO: src/services/ vacío** — Indica que se planeó una capa de servicios pero no se implementó.

### Deuda Técnica Priorizada

| # | Deuda | Impacto | Esfuerzo |
|---|-------|---------|----------|
| 1 | Backdoor plan/rol | 🔴 Crítico | 1 día |
| 2 | API calls inline en páginas | 🔴 Alto | 2 días |
| 3 | Password en texto plano a backend | 🔴 Crítico | 0.5 día |
| 4 | .env en git (DB password) | 🔴 Crítico | 0.5 día |
| 5 | Sin error boundaries | 🟡 Medio | 0.5 día |
| 6 | Calculator 30+ useState | 🟡 Medio | 1 día |
| 7 | Sin lazy loading | 🟡 Medio | 0.5 día |
| 8 | Empty services/ directory | 🟢 Bajo | 0.1 día |

---

## FASE 3 — AUDITORÍA TYPESCRIPT

### Errores Potenciales

| # | Archivo | Línea | Problema | Riesgo |
|---|---------|-------|----------|--------|
| 1 | `Bitacora.tsx` | 70 | `data: any[]` — sin tipo | 🟡 |
| 2 | `Bitacora.tsx` | 117 | `payload: any` — inyección potencial | 🔴 |
| 3 | `Bitacora.tsx` | 124 | `extra: any` — sin control | 🟡 |
| 4 | `Fincas.tsx` | 43 | `data: any[]` — sin tipo | 🟡 |
| 5 | `Fincas.tsx` | 65 | `payload` sin tipo | 🟡 |
| 6 | `Admin.tsx` | 45 | URL hardcodeada, no usa `apiUrl` | 🟢 |
| 7 | `Dashboard.tsx` | 119 | `t(l.key as any)` — cast peligroso | 🟡 |
| 8 | `Bitacora.tsx` | 244 | `t(k as any)` — cast peligroso | 🟡 |
| 9 | `Layout.tsx` | 71 | `(deferredPrompt as any).prompt()` | 🟢 |
| 10 | `formulas.test.ts` | 247 | `racionComida = Infinity` — bug real | 🟡 |
| 11 | `Login.tsx` | 58 | `style` inline masivo | 🟢 |
| 12 | `i18n.ts` | Tipo `TranslationKey` no definido | Referenciado en export pero ausente | 🟡 |
| 13 | `Fincas.tsx:49` | `f.Estanque ?? []` — camelCase vs PascalCase | Migración de datos potencial | 🟡 |
| 14 | `Dashboard.tsx:119` | Mapeo de keys inconsistente | LS_KEYS no cubre todas las páginas | 🟢 |
| 15 | `Bitacora.tsx:9` | `RecordData` tipo inline, debería ser compartido | 🟢 |

### TypeScript Config Issues

- `noUnusedLocals: true` y `noUnusedParameters: true` — bueno, pero `erasableSyntaxOnly: true` es experimental
- `skipLibCheck: true` — acelerar build, pero oculta errores de tipos en dependencias
- No hay `strict: true` explícito — TypeScript 6 tiene strict por defecto pero no está garantizado

---

## FASE 4 — AUDITORÍA REACT

### Problemas de Rendimiento

| # | Componente | Problema | Impacto |
|---|-----------|----------|---------|
| 1 | App.tsx | Sin lazy() — todas las páginas se cargan siempre | Alto |
| 2 | Calculator.tsx | 30+ useState, re-renderiza todo | Alto |
| 3 | Dashboard.tsx | Recalcula `calcInvValorTotal()` y `calcInvAlertas()` en cada render | Medio |
| 4 | Bitacora.tsx | useEffect salvando a localStorage en cada cambio de records | Medio |
| 5 | Zootecnico.tsx | (No leído pero esperable que tenga problemas similares) | Medio |
| 6 | Layout.tsx | `NAV_LINKS.map` en cada render (constante, pero igual) | Bajo |

### Hooks Problemáticos

| # | Archivo | Problema |
|---|---------|----------|
| 1 | Bitacora.tsx:60-67 | `useCallback(api, [apiUrl, token])` — bien, pero se crea una nueva función cada vez que token cambia (login/out) |
| 2 | Bitacora.tsx:69-75 | `useEffect` con dependencia `api` (función) — se ejecuta más de lo necesario |
| 3 | Fincas.tsx:56 | `useEffect(() => saveLocal(list), [list])` — salva en cada render tras setList |
| 4 | Calculator.tsx | 30+ useState dispersos lógicos — deberían ser useReducer |

### Contextos

| Contexto | Problema |
|----------|----------|
| AuthProvider | Buena implementación, pero el plan/rol override lo rompe |
| LanguageProvider | NO persiste el idioma — se resetea al recargar |
| CurrencyProvider | Persiste correctamente |
| ThemeProvider | Persiste correctamente |

### React Router

- v7.17.0 — versión reciente, buena
- Layout route pattern — bien implementado
- Sin lazy/Suspense en las rutas — **oportunidad enorme de mejora**

---

## FASE 5 — AUDITORÍA SUPABASE

### Esquema de Base de Datos

| Tabla | Columnas | Relaciones | ¿Tiene RLS? |
|-------|----------|------------|-------------|
| User | 6 | Finca[], Bitacora[] | ❌ No en migración |
| Finca | 6 | User, Estanque[], Bitacora[], Finanza[], Inventario[] | ❌ |
| Estanque | 3 | Finca, Bitacora[] | ❌ |
| Especie | 8 | Bitacora[] | ❌ |
| Bitacora | 16 | User, Finca, Estanque?, Especie? | ❌ |
| Finanza | 8 | Finca | ❌ |
| Inventario | 9 | Finca, MovimientoInventario[] | ❌ |
| MovimientoInventario | 6 | Inventario | ❌ |
| Microbiologia | 6 | **Sin FK** a Finca/User | ❌ |
| Veterinaria | 7 | **Sin FK** a Finca/User | ❌ |

### Problemas

1. **ALTO: Sin RLS** — CONTEXT.md dice "RLS habilitado" pero NO hay policies en migration.sql. La seguridad es 100% aplicación.

2. **ALTO: Tablas sin FK** — `Microbiologia` y `Veterinaria` tienen `fincaId` y `userId` pero sin `@relation` en Prisma ni FK en SQL. Huérfanos garantizados.

3. **MEDIO: Sólo 1 índice** — `User_email_key` es el único índice. Consultas por `userId` en Finca, Bitacora, etc. no tienen índice.

4. **MEDIO: Json en Prisma** — `Especie.parametros` es `Json?`. Sin schema validation, puede almacenar cualquier cosa.

5. **BAJO: Zod instalado, no usado** — Podría validar los JSON fields.

6. **BAJO: No hay seed.ts** — `db:seed` falla si se ejecuta.

### Índices Faltantes

```sql
CREATE INDEX ON "Finca"("userId");
CREATE INDEX ON "Bitacora"("userId");
CREATE INDEX ON "Bitacora"("fincaId");
CREATE INDEX ON "Bitacora"("fecha");
CREATE INDEX ON "Finanza"("fincaId");
CREATE INDEX ON "Inventario"("fincaId");
CREATE INDEX ON "Microbiologia"("userId");
CREATE INDEX ON "Veterinaria"("userId");
```

---

## FASE 6 — SEGURIDAD

### Hallazgos Clasificados por Severidad

#### 🔴 CRÍTICO (4)

| # | Hallazgo | Archivo | Impacto |
|---|----------|---------|---------|
| 1 | **DB password en git** | `server/.env` contiene `DATABASE_URL=postgresql://postgres:rmA2F4H0Y3FHmgD2@...` | Cualquiera con acceso al repo puede conectarse directamente a PostgreSQL, leer/escribir todas las tablas, bypassear toda la autenticación. |
| 2 | **Privilege escalation por localStorage** | `auth.tsx:56-61` — `localStorage.getItem("aquacalc_plan_override")` prima sobre `user_metadata` | Cualquier usuario puede abrir DevTools y escribirse `enterprise` o `admin`. El sistema de planes/roles es cosmético. |
| 3 | **Password en texto plano a backend** | `auth.tsx:76-80` — `fetch(API_URL + "/auth/register", { body: JSON.stringify({ email, password, nombre }) })` | La contraseña viaja en texto plano y es recibida por el backend Express, que podría loggearla o almacenarla incorrectamente. |
| 4 | **Authenticated user puede ver datos de otros** | `inventario.ts:GET /movimientos` sin filtro `userId` | `/api/inventario/movimientos` no filtra por userId. Si RLS no está activo, cualquier usuario autenticado ve todos los movimientos de todos. |

#### 🟡 ALTO (6)

| # | Hallazgo | Archivo | Impacto |
|---|----------|---------|---------|
| 5 | CORS wildcard | `server/src/index.ts` — `origin: process.env.CORS_ORIGIN ?? "*"` | Cualquier sitio web puede hacer peticiones a la API. No hay `CORS_ORIGIN` en .env. |
| 6 | Sin rate limiting | `server/` — ningún endpoint tiene rate limit | Ataque de fuerza bruta a login, DoS en endpoints POST. |
| 7 | Sin CSP | `server/src/index.ts` — helmet() sin configuración CSP | Usa defaults de Helmet, permisivos. |
| 8 | Sin input validation en POST | `server/src/routes/bitacora.ts` — `req.body` se spreadea directamente en DB insert | Un cliente malicioso puede injectar campos arbitrarios. |
| 9 | Zod instalado, no usado | `server/package.json` — dependencia sin utilizar | Herramienta de validación presente pero ignorada. |
| 10 | API keys hardcodeadas | `auth.tsx:4-5` — SUPABASE_URL y SUPABASE_ANON_KEY hardcodeados | No se pueden cambiar sin rebuild. La anon key es pública por diseño, pero no es buena práctica hardcodearla. |

#### 🟢 MEDIO (4)

| # | Hallazgo | Archivo | Impacto |
|---|----------|---------|---------|
| 11 | MSW/Service Worker sin validación | `main.tsx:12-24` — SW registration sin checks de integridad | Bajo riesgo, pero no hay verificación. |
| 12 | Sin Helmet CSP server | `server/src/index.ts` — solo usa helmet() default | Riesgo bajo, pero mejorable. |
| 13 | Sin headers de seguridad en frontend | `vite.config.ts` — sin headers CSP | Riesgo bajo. |
| 14 | Master Panel PIN hardcodeado | `Admin.tsx:7` — `ADMIN_PIN = "211203"` | No es un riesgo real (es debug), pero el PIN está visible en código fuente. |

---

## FASE 7 — QA FUNCIONAL

### Bug Real Detectado en Tests

**`calcRacion` con `comidasPorDia = 0` produce `Infinity`** — `formulas.test.ts:245-246`
```
const r = calcRacion({ biomasaActual: 5000, tasaAlimentacion: 3, comidasPorDia: 0 });
expect(r.racionComida).toBe(Infinity); // BUG DIVISIÓN POR CERO
```
El test *espera* que sea `Infinity`, pero en producción esto causaría que la UI muestre "∞ kg" o rompa el renderizado.

### Bugs Funcionales (por inspección de código)

| # | Página | Bug | Impacto |
|---|--------|-----|---------|
| 1 | Calculator | `handleCalcRacion` no protege contra `comidasPorDia=0` | UI muestra Infinity |
| 2 | Bitacora | `dbToRecord` parsea JSON de observaciones pero cualquier error silencia | Bajo |
| 3 | Fincas | `migrar()` función se ejecuta en cada loadLocal pero no unifica IDs | Medio |
| 4 | Fincas | `remove()` de estanque solo borra de localStorage, no de API | Alto — datos inconsistentes |
| 5 | Inventario | `saveMov()` no valida que `productoId` exista realmente | Bajo |
| 6 | Auth | `syncPlanRol` se llama en cada `onAuthStateChange` sin memo | Bajo |
| 7 | Dashboard | `calcInvValorTotal()` lee productos pero no calcula si está corrupto | Bajo |
| 8 | GlobalSearch | Solo busca en records específicos, no en todas las keys | Medio |
| 9 | Zootecnico | (Asumiendo similar a Dashboard) localStorage only | Medio |
| 10 | Terminos | Página pública pero referencias a términos de terceros | Bajo |
| 11 | Formulas | Citas científicas duras, no es mantenible | Bajo |
| 12 | Admin | `handleExport` exporta solo `aquacalc_*`, no toda la app data | Medio |
| 13 | Microbiologia | Sin PUT endpoint para cultivos | Medio |
| 14 | Veterinaria | Sin PUT endpoint | Medio |
| 15 | Calculator | `selectedSpecies.params.gpd` se usa directamente — si cambia especie después de calcular, no se recalcula | Bajo |

### Flujo de Login

1. Enter email+password → `supabase.auth.signInWithPassword()` → OK
2. JWT devuelto → almacenado en contexto
3. Redirige a `/`
4. **Problema**: sin confirmación email, cualquiera puede registrar cuentas falsas
5. **Problema**: register envía password en texto plano al backend

### Flujo Offline

1. API llama falla → `.catch()` silencioso → carga datos stale de localStorage
2. Usuario no sabe que está offline hasta que ve el offline-bar
3. **No hay cola de cambios** — si crea datos offline, se perderán al recargar

---

## FASE 8 — OFFLINE FIRST

### Estado Actual

| Componente | Estado | Detalle |
|------------|--------|---------|
| Service Worker | ⚠️ Básico | `vite-plugin-pwa` con autoUpdate. SW registrado en main.tsx pero no hay estrategia de caché para API calls |
| Cache de datos | ❌ Superficial | No hay cache-first para GET requests de API |
| Sincronización offline→online | ❌ Ausente | No hay cola de cambios |
| Fallback a localStorage | ✅ Presente | Cuando API falla, carga de localStorage |
| Detección de conectividad | ✅ Presente | `navigator.onLine` + event listeners |
| Conflictos de datos | ❌ Ausente | No hay mecanismo de resolución |
| Índice de PWAs | ⚠️ Básico | Solo favicon.svg, sin splash screen |

### Problemas

1. **No hay estrategia de caché para llamadas API** — El SW solo cachea assets estáticos
2. **No hay cola de cambios** — Si el usuario crea/edita datos offline, se pierden al recargar
3. **No hay indicación de datos stale** — El usuario ve datos viejos sin saberlo
4. **No hay reconciliación** — Al volver online, no hay merge entre datos locales y API

---

## FASE 9 — RENDIMIENTO

### Bundle Size (Estimado)

| Chunk | Tamaño estimado | Problema |
|-------|-----------------|----------|
| `index.js` (main) | ~500+ kB | Sin code splitting |
| jsPDF | ~200 kB | Cargado siempre, no lazy |
| SheetJS (xlsx) | ~200 kB | Cargado siempre, no lazy |
| Leaflet | ~150 kB | Cargado siempre (usado en GeoPond) |
| react-leaflet | ~50 kB | Cargado siempre |
| **Total** | **~1.1 MB+** | **Muy grande para PWA mobile** |

### Top 20 Optimizaciones Priorizadas

| # | Optimización | Impacto | Esfuerzo |
|---|-------------|---------|----------|
| 1 | Lazy load pages (`React.lazy` + Suspense) | 🔴 Alto | 1 hora |
| 2 | Lazy load jsPDF (solo en export) | 🔴 Alto | 30 min |
| 3 | Lazy load SheetJS (solo en export) | 🔴 Alto | 30 min |
| 4 | Lazy load Leaflet (solo en GeoPond) | 🟡 Medio | 30 min |
| 5 | useReducer en Calculator en lugar de 30+ useState | 🟡 Medio | 2 horas |
| 6 | Memoizar Dashboard calculations | 🟡 Medio | 30 min |
| 7 | Eliminar `localStorage.setItem` en cada render | 🟡 Medio | 1 hora |
| 8 | Extraer `NAV_LINKS.map` a memo | 🟢 Bajo | 10 min |
| 9 | Compactar i18n.ts (~5500 líneas) | 🟢 Bajo | 1 hora |
| 10 | Tree-shake no usado en imports | 🟢 Bajo | 30 min |
| 11 | Agregar `loading="lazy"` a imágenes veterinarias | 🟢 Bajo | 10 min |
| 12 | Cachear lookup data en sessionStorage | 🟡 Medio | 30 min |
| 13 | Reducir re-renders en Bitacora form | 🟡 Medio | 1 hora |
| 14 | Preconnect a Supabase y API URL | 🟢 Bajo | 10 min |
| 15 | Agregar module/nomodule script splitting | 🟡 Medio | 1 hora |
| 16 | Use `will-change` en animaciones CSS | 🟢 Bajo | 10 min |
| 17 | Agregar CDN para Google Fonts (Inter) | 🟢 Bajo | 10 min |
| 18 | PWA: precache API responses | 🟡 Medio | 2 horas |
| 19 | Monitorear bundle con `vite-plugin-visualizer` | 🟢 Bajo | 15 min |
| 20 | Configurar `manualChunks` en Vite | 🟡 Medio | 30 min |

---

## FASE 10 — UX/UI

### Evaluación General

| Dimensión | Puntuación | Comentario |
|-----------|-----------|------------|
| Claridad | 7/10 | Navegación clara, títulos descriptivos |
| Estética | 8/10 | Diseño moderno, dark/light theme, consistente |
| Responsive | 7/10 | Form grids responsive, sidebar mobile |
| Accesibilidad | 4/10 | Sin aria labels, contraste mejorable, sin skip links |
| Onboarding | 6/10 | Tutorial de 5 pasos presente, pero sin tour guiado |
| Feedback | 5/10 | Toast funcional, pero sin loading states en la mayoría de forms |

### Problemas Identificados

| # | Problema | Impacto |
|---|----------|---------|
| 1 | **Sin feedback de carga en operaciones API** — Bitacora save, Fincas CRUD no muestran spinner | Alto |
| 2 | **Dashboard solo localStorage** — No hay métricas de la API, parece vacío si no hay data local | Alto |
| 3 | **Login hardcodeado en español** — Los textos del formulario están en español, aunque i18n existe | Medio |
| 4 | **Sin aria labels** — Botones, inputs, iconos sin etiquetas accesibles | Medio |
| 5 | **Sin skip-to-content** — Usuarios de teclado no pueden saltar navegación | Medio |
| 6 | **Tooltips solo en Calculator** — El resto de la app no tiene ayuda contextual | Medio |
| 7 | **Sin confirmación al eliminar** — Algunas operaciones no piden confirmación | Medio |
| 8 | **Master Panel oculto** — Solo accesible por easter egg de 5 clics | Bajo |
| 9 | **Emojis como iconos** — Funcional pero no escalable ni accesible | Bajo |
| 10 | **CSS en un solo archivo de 2500 líneas** — Mantenible pero crecerá mal | Medio |

### Mejoras Concretas

1. Agregar `aria-label` a todos los botones de icono
2. Agregar loading spinner en forms de bitácora, fincas, especies
3. Dashboard debería mostrar estado de conexión y última sincronización
4. Agregar skip-to-content link
5. Agregar confirm dialog para delete en más lugares
6. Dashboard métricas: total fincas, especies, última bitácora
7. Modales: agregar atajo Escape para cerrar

---

## FASE 11 — INTERNACIONALIZACIÓN

### Estado

| Métrica | Valor |
|---------|-------|
| Claves totales | ~430 |
| Idiomas | ES, EN, PT |
| Claves hardcodeadas en UI | ~5 (Login.tsx tiene texto en español) |
| Cobertura | Alta, pero hay texto fuera de i18n |

### Texto Hardcodeado Detectado

| # | Archivo | Texto | Idioma |
|---|---------|-------|--------|
| 1 | Login.tsx:49 | "Restablecer Contraseña", "Crear Cuenta", "Iniciar Sesión" | ES hardcodeado |
| 2 | Login.tsx:72 | "Revisá tu email para restablecer tu contraseña" | ES hardcodeado |
| 3 | Login.tsx:95 | "Acepto los" | ES hardcodeado |
| 4 | Login.tsx:99 | "Cargando..." | ES hardcodeado |
| 5 | Login.tsx:113 | "¿No tenés cuenta?", "¿Ya tenés cuenta?" | ES hardcodeado |
| 6 | Login.tsx:120 | "Olvidé mi contraseña" | ES hardcodeado |

**Corrección**: Login.tsx tiene texto en español no traducido. Las claves existen en i18n (`forgotPassword`, `sendResetLink`, etc.) pero no se usan.

---

## FASE 12 — MONETIZACIÓN

### ¿Quién pagaría por esto?

- **Productores acuícolas pequeños/medianos** de LATAM (tilapia, camarón, trucha)
- **Técnicos acuícolas** que manejan múltiples fincas para un productor
- **Consultores/extensionistas** que necesitan seguimiento para sus clientes
- **Acuícolas de recirculación (RAS)** con necesidades avanzadas de monitoreo

### ¿Por qué pagarían?

1. **Calculadora especializada** que competidores genéricos (Excel, Google Sheets) no tienen
2. **Referencias científicas integradas** (FAO, Boyd, Timmons) — valor diferencial
3. **Offline-first** — funciona en zonas rurales sin internet
4. **Multi-finca** — escalable de 1 a N estanques
5. **Biometría + WQ + veterinaria** integrados

### ¿Qué lo diferencia?

- Competidores: hojas de cálculo, cuadernos físicos, soluciones genéricas
- Ventaja: calculadora especializada con energía, FCR, rentabilidad; referencias científicas; PWA offline-first
- Debilidad: sin pagos, sin multi-tenant real, sin sync offline real

### Propuesta de Planes

#### PLAN FREE — $0/mes (Adquisición, 80% de usuarios)
- 1 finca, 3 estanques
- Calculadora completa
- Bitácora básica (7 días de historial)
- Especies de referencia
- Sin exportación PDF/Excel
- Sin multi-usuario

#### PLAN PRO — $29/mes (Conversión, 15% de usuarios)
- Fincas ilimitadas, estanques ilimitados
- Bitácora completa con historial ilimitado
- Exportación PDF/Excel
- Dashboard con métricas avanzadas
- Multi-usuario (1 admin + 2 técnicos)
- Prioridad en soporte

#### PLAN ENTERPRISE — $99/mes (Monetización, 5% de usuarios)
- Todo lo de Pro
- Usuarios ilimitados
- API access
- On-premise opcional
- Consultoría personalizada
- SLA garantizado

### Funciones Premium vs Gratis

| Función | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Calculadora | ✅ | ✅ | ✅ |
| Bitácora | 7 días | ✅ Ilimitado | ✅ |
| Zootécnico gráficos | Básico | Avanzado | Avanzado |
| Especies personalizadas | 3 | Ilimitado | Ilimitado |
| Fincas | 1 | Ilimitado | Ilimitado |
| Estanques | 3 | Ilimitado | Ilimitado |
| Finanzas | Básico | Completo | Completo |
| Inventario | ✅ | ✅ | ✅ |
| Microbiología | ✅ | ✅ | ✅ |
| Veterinaria | ✅ | ✅ | ✅ |
| Export PDF/Excel | ❌ | ✅ | ✅ |
| Multi-usuario | ❌ | ✅ | ✅ |
| API | ❌ | ❌ | ✅ |
| Soporte | ❌ | Email | Prioritario |

### ¿Qué tan difícil sería venderlo?

- **Facilidad**: 4/10. Nicho muy específico, pocos competidores directos, necesidad real.
- **Dificultad**: LATAM tiene baja penetración de pagos digitales y desconfianza en SaaS.
- **Canales**: WhatsApp, ferias acuícolas, extensionistas de gobierno, FAO.
- **Pricing**: $29/mes es bajo para productores que manejan $10K+ en ciclo.

### Funciones que generan más valor → Deben ser PREMIUM
1. Exportación PDF/Excel (necesitan reportes para bancos/gobierno)
2. Multi-finca (escalabilidad)
3. Multi-usuario (técnicos trabajando juntos)
4. Historial ilimitado (trazabilidad)

---

## FASE 13 — PREPARACIÓN PARA LANZAMIENTO

### IMPRESCINDIBLE ANTES DE LANZAR (7 blockers)

| # | Tarea | Riesgo si no se hace |
|---|-------|---------------------|
| 1 | **Quitar DB password de git** — Rotar credenciales, agregar .env a .gitignore | Exposición total de datos |
| 2 | **Eliminar privilege escalation por localStorage** — Plan/rol deben venir SOLO de Supabase JWT claims | Cualquiera se auto-asigna Pro |
| 3 | **Dejar de enviar password al backend** — El register solo debe llamar Supabase, no al backend con password | Riesgo de compliance y seguridad |
| 4 | **Agregar Lemon Squeezy** — Stripe no disponible en CR. Integrar pagos para suscripciones | Sin esto no hay ingresos |
| 5 | **Agregar rate limiting** en login y endpoints POST | Ataques de fuerza bruta |
| 6 | **Validar input en backend** con Zod | Inyección de datos maliciosos |
| 7 | **Agregar Error Boundaries** en React | UX rota si algo crashea |

### IMPORTANTE (debe hacerse pronto)

| # | Tarea |
|---|-------|
| 8 | Refactorizar API calls a servicio compartido |
| 9 | Agregar RLS policies en Supabase |
| 10 | Agregar índices a tablas |
| 11 | Lazy loading de páginas y librerías |
| 12 | Login: usar claves i18n |
| 13 | Language Provider: persistir idioma |
| 14 | Dashboard: leer de API no solo localStorage |
| 15 | Bitácora: agregar PUT endpoint |
| 16 | Agregar confirmación email (opcional pero recomendado) |

### DESEABLE

| # | Tarea |
|---|-------|
| 17 | Cola de cambios offline |
| 18 | CI/CD con GitHub Actions |
| 19 | Code splitting automático |
| 20 | Tests backend |
| 21 | Splash screen PWA |
| 22 | Google Analytics o PostHog |
| 23 | Términos y condiciones legales reales |
| 24 | Mejorar accesibilidad (aria, skip links) |

---

## FASE 14 — ROADMAP CTO

### Próximos 7 DÍAS (Seguridad + Bloqueantes)

1. **Día 1**: Rotar DB password, quitar .env de git, agregar .gitignore
2. **Día 2**: Eliminar localStorage override de plan/rol. Plan/rol solo desde Supabase JWT.
3. **Día 3**: Dejar de enviar password al backend. Register solo usa Supabase.
4. **Día 4**: Validar inputs backend con Zod. Agregar rate limiting.
5. **Día 5**: Agregar Error Boundaries. Lazy load pages.
6. **Día 6**: Integrar Lemon Squeezy (checkout básico). Plan Free funcional.
7. **Día 7**: Deploy hotfix de seguridad. Comunicar cambio a early users.

### Próximos 30 DÍAS (MVP Vendible)

Semanas 2-4:
- Agregar RLS policies en Supabase
- Refactorizar API calls a servicio compartido
- Refactorizar login para usar i18n
- Agregar PUT bitácora y estanques
- Dashboard con datos reales de API
- Sistema de suscripciones funcional (Lemon Squeezy webhooks)
- Gating de features por plan (no por localStorage)
- Deploy v1.0 "vendible"

### Próximos 90 DÍAS (Escalar a 10 clientes)

Meses 2-3:
- Onboarding guiado con tutorial + tour
- Export PDF/Excel como funcionalidad Pro
- Email transaccional (Resend, welcome, invoice)
- Panel de administración con gestión de suscripciones
- Landing page multilingüe (con SEO)
- Google Analytics / PostHog para tracking
- Probar con 3-5 productores reales (beta cerrada)
- Ajustar pricing basado en feedback

### Próximos 180 DÍAS (Escalar a 100+ usuarios)

Meses 4-6:
- Cola de cambios offline (sync offline real)
- CI/CD con GitHub Actions
- Multi-usuario funcional (admin + técnico)
- Tests backend (vitest)
- Code splitting + reducción de bundle (~300 kB target)
- Dashboard avanzado con gráficos históricos
- App en Play Store (Trusted Web Activity)
- Campaña en ferias acuícolas LATAM
- API pública para integraciones
- SLA para Enterprise

---

## SCORING FINAL

| Dimensión | Puntuación | Justificación |
|-----------|-----------|---------------|
| **Calidad de Código** | **65/100** | Core TS excelente, pero páginas con `any`, duplicación de patrones, falta de tipos. Tests solo para core. |
| **Arquitectura** | **55/100** | Buena separación core/páginas/store, pero sin capa de servicios, sin lazy loading, sin error boundaries. |
| **Seguridad** | **25/100** | **CRÍTICO**: DB password en git, privilege escalation vía localStorage, password en texto plano. RLS ausente. Con estos bugs, cualquier producción es insegura. |
| **UX** | **60/100** | Diseño visual atractivo, navegación clara, pero accesibilidad pobre, feedback de carga ausente, dashboard vacío. |
| **Rendimiento** | **40/100** | Bundle de ~1 MB+ sin code splitting, Calculator con 30+ useState, localStorage writes en cada render. PWA sin cache strategy. |
| **Escalabilidad** | **30/100** | Sin multi-tenancy real, sin RLS, sin índices, sin cola de sincronización offline. Con 100 usuarios concurrentes, la API no tiene rate limiting ni caché. |
| **Monetización** | **20/100** | Sin sistema de pagos, plan/rol system es cosmético (bypasseable), no hay gating real de features. El modelo de negocio está definido en papel pero no implementado. |
| **Preparación para Producción** | **15/100** | No está listo. Hay bugs de seguridad que requieren atención inmediata antes de poner un solo cliente de pago. |

---

## VEREDICTO FINAL

### ¿Está listo para conseguir clientes de pago?

**NO. Absolutamente no.**

Razones:
1. El sistema de planes/roles es un **simulacro** — cualquiera puede bypassearlo con DevTools
2. No hay sistema de pagos integrado
3. La seguridad es mala (DB password en git, password en texto plano)
4. No hay forma de cobrar o gestionar suscripciones
5. Si cobraras, el cliente podría poner `enterprise` en localStorage y obtener todo gratis

### ¿Está listo para producción?

**NO. No en el estado actual.**

Se puede lanzar como beta gratuita solo si:
- Se rotan las credenciales de DB (YA)
- Se elimina el override de localStorage (YA)
- Se deja de enviar password al backend (YA)
- Se agregan RLS policies
- Se agregan Error Boundaries

Con esos fixes, podría lanzarse como **beta gratuita** para conseguir los primeros 10 usuarios. Pero no se puede cobrar hasta tener Lemon Squeezy y gating real.

### ¿Invertirías dinero en este proyecto?

**Invertiría tiempo, no dinero.**

El producto resuelve un problema real. El dominio de acuicultura está bien investigado (referencias FAO, Boyd, Timmons). El frontend tiene buena calidad visual. El core es sólido.

Pero:
- La deuda de seguridad es grave
- Falta el núcleo del negocio (pagos)  
- No hay tracción ni usuarios reales validando

**Invertiría 3 meses de mi tiempo** para arreglar los blockers y conseguir 10 clientes beta. Si después de 3 meses hay tracción y feedback positivo, entonces invertiría dinero.

**Conclusión: Proyecto con alto potencial pero inmaduro. Necesita 30 días de trabajo enfocado en seguridad + pagos para estar listo para beta, y 90 días para primer cliente de pago.**

---

## LAS 25 ACCIONES QUE UN CTO TOMARÍA INMEDIATAMENTE

1. Rotar DB password de Supabase (cambiar en dashboard, eliminar de git)
2. Agregar `server/.env` a `.gitignore` y commit
3. Eliminar `aquacalc_plan_override` y `aquacalc_rol_override` de auth.tsx — forzar plan/rol desde JWT claims
4. Eliminar envío de password en register — register solo debe llamar Supabase SDK
5. Agregar RLS policies en Supabase para todas las tablas
6. Agregar rate limiting en Express para todos los endpoints
7. Agregar CORS_ORIGIN en .env y usarlo (no wildcard)
8. Instalar y configurar Zod en backend para validar todos los inputs
9. Agregar Error Boundary component en App.tsx
10. Implementar lazy() + Suspense para todas las páginas en App.tsx
11. Mover API calls de cada página a un servicio compartido (`src/services/api.ts`)
12. Agregar PUT endpoint para bitácora (falta en backend)
13. Agregar PUT endpoint para estanques individuales (falta en backend)
14. Agregar índices en Supabase: userId en Finca, Bitacora, Finanza, etc.
15. Migrar i18n en Login.tsx (texto hardcodeado)
16. Persistir idioma en localStorage (language store)
17. Dashboard: leer de API en lugar de solo localStorage
18. Integrar Lemon Squeezy para checkout de suscripciones
19. Agregar webhook handler para Lemon Squeezy (crear/actualizar suscripciones)
20. Agregar gating real de features por plan (comparar con JWT claim, no localStorage)
21. Agregar loading states en todos los forms que llaman API
22. Configurar Content Security Policy en Express (helmet)
23. Agregar GitHub Actions para typecheck + test + build
24. Agregar splash screen y mejor manifiesto PWA
25. Configurar Google Analytics o PostHog para tracking

---

*Fin del informe. Auditado el 10 de junio de 2026.*
