# CHANGELOG — AcuiCal

> Todas las fechas en formato YYYY-MM-DD.

---

## 2026-06-12 — Dominio acuical.com comprado + UI/UX polish + Login + Admin Panel redesign + rol gestor + clean Netlify

### Objetivo
Refinar UI/UX, adquirir dominio acuical.com, renombrar rol productor → gestor, limpiar referencias Netlify, rediseñar Admin Panel, proteger admin vía rol.

### Archivos modificados
- `src/index.css` — Cards con hover lift (translateY + glow), .dash-card con gradiente top border, clases .glow-accent/.glow-blue
- `src/pages/Dashboard.tsx` — Reordenado: módulos primero, finanzas/inventario después con glow classes
- `src/pages/Login.tsx` — Step indicators (1-2-3) en registro, layout más limpio
- `src/core/i18n.ts` — clave rolGestor (antes rolProductor) en ES/EN/PT
- `src/core/plan.ts` — Rol actualizado a "gestor", defaults actualizados
- `src/core/index.ts` — Export Rol actualizado
- `src/pages/Planes.tsx` — Selector de rol para planes Pro/Enterprise
- `src/store/auth.tsx` — Default rol "gestor"
- `src/utils/config.ts` — FRONTEND_URL actualizado a https://app.acuical.com
- `src/pages/Admin.tsx` — Rediseñado: 5 tabs (Overview, Usuarios, Suscripciones, Sistema, Herramientas), requiere rol "admin" + PIN
- `server/src/routes/admin.ts` — Verifica rol "admin" via Supabase Admin API
- `server/src/routes/pagos.ts` — updateUserPlan() con merge metadata, endpoint POST /api/pagos/rol, ROLES_BY_PLAN actualizado
- `server/src/routes/fincas.ts` — Validación con "gestor"
- `server/src/index.ts` — CORS origin actualizado

### Cambios realizados
1. **CSS polish**: cards con hover lift (translateY(-3px) + glow), dash-card con gradiente top border, clases glow-accent y glow-blue
2. **Dashboard reorganizado**: módulos funcionales primero en grid, finanzas e inventario abajo con styling diferenciado
3. **Login mejorado**: indicador paso a paso (1-2-3) en modo registro, mejor espaciado y layout
4. **Rol productor → gestor**: renombrado en types, defaults, selectores, i18n (ES/EN/PT), server routes
5. **Admin Panel rediseñado**: 5 tabs profesionales, usa Supabase Admin API para verificar rol "admin" + PIN
6. **Netlify eliminado**: todas las referencias a Netlify eliminadas de código y documentación
7. **Webhook fix**: updateUserPlan() hace merge de user_metadata en vez de sobrescribir
8. **Selector de rol en Planes.tsx**: visible solo para planes Pro/Enterprise
9. **Dominio acuical.com adquirido**: FRONTEND_URL actualizado, CORS default actualizado, docs actualizados

---

## 2026-06-11 — Dashboard migrado a API + endpoint agregado + Parámetros a API + code splitting pdf.js

### Objetivo
Migrar Dashboard de solo localStorage a API, reemplazando 7 fetch() paralelos por un único endpoint agregado.

### Archivos modificados
- `server/src/routes/dashboard.ts` — Nuevo: `GET /api/dashboard/stats`
- `server/src/routes/parametros.ts` — Nuevo: `GET/PUT /api/parametros`
- `server/prisma/migration_parametros.sql` — Nueva: tabla ParametroOverride
- `server/src/index.ts` — + dashboardRouter, parametrosRouter
- `src/pages/Dashboard.tsx` — Rewrite: un solo fetch(), fallback localStorage
- `src/pages/Parametros.tsx` — Rewrite: API + localStorage fallback
- `src/utils/pdf.ts` — Separado: solo jsPDF (405 kB)
- `src/utils/excel.ts` — Nuevo: solo ExcelJS (934 kB)
- `src/pages/Dashboard.tsx` — Import desde excel.ts
- `src/pages/Finanzas.tsx` — Import desde excel.ts
- `src/pages/Zootecnico.tsx` — PDF desde pdf.ts, Excel desde excel.ts
- `CHANGELOG.md` — Este registro
- `PROJECT_STATUS.md` — Actualizado
- `CONTEXT.md` — Actualizado

### Cambios realizados
1. Backend: nuevo endpoint `GET /api/dashboard/stats` que hace 7 consultas paralelas a Supabase (counts + finanzas + inventario) y devuelve un solo JSON con todos los stats del usuario autenticado
2. Backend: nuevos endpoints `GET/PUT /api/parametros` con tabla ParametroOverride (userId, especieId, params JSONB)
3. Frontend: Dashboard.tsx simplificado de 7 fetch() a 1, con fallback a localStorage si la API falla
4. Frontend: Parametros.tsx migrado a API con localStorage fallback
5. Frontend: pdf.ts separado en pdf.ts (jsPDF, 405 kB) y excel.ts (ExcelJS, 934 kB) — Dashboard y Finanzas ya no cargan jspdf en absoluto

---

## 2026-06-10 — Auditoría de documentación y actualización masiva

### Objetivo
Sincronizar toda la documentación del proyecto con el estado real del código después de backend + auth + migración de páginas + deploy.

### Archivos modificados
- `CONTEXT.md` — Nuevo: contexto completo para IA
- `README.md` — Rewrite completo: agregado backend, auth, deploy, 15 páginas
- `AI_CONTEXT.md` — Rewrite: estado actual con backend, auth, deploy
- `PROJECT_STATUS.md` — Actualizado: 65% hacia SaaS, páginas migradas, riesgos actuales
- `CHANGELOG.md` — Este registro
- `ROADMAP.md` — Actualizado: Phase 1 items marcados como completados
- `TECHNICAL_DECISIONS.md` — Agregadas decisiones recientes
- `BUSINESS_PLAN.md` — Stripe → Lemon Squeezy, actualizado estado
- `TERMS.md` — Stripe → Lemon Squeezy, email corregido

### Cambios realizados
1. Creado CONTEXT.md con estructura completa: qué es, estado, arquitectura, funcionalidades, API endpoints, DB schema, flujo auth, pendientes, convenciones, comandos
2. Documentación alineada con el código real: 10 tablas DB, 8 routers, 26 endpoints, 15 páginas frontend, 8 con API, 4 solo localStorage
3. Documentadas decisiones recientes: Supabase, Express+Prisma, Railway, Lemon Squeezy vs Stripe

---

## 2026-06-09 — Backend Express + Supabase + Auth + Migración Fincas

### Objetivo
Construir backend API con Express + Supabase, conectar frontend con autenticación, y migrar primera página (Fincas) de localStorage a la API.

### Archivos modificados
- `server/` — Nuevo: proyecto Express + TypeScript completo
- `server/src/index.ts` — Servidor Express con rutas
- `server/src/middleware/auth.ts` — Auth con Supabase JWT
- `server/src/middleware/errorHandler.ts` — Manejo de errores
- `server/src/routes/auth.ts` — Register/Login/Logout
- `server/src/routes/fincas.ts` — CRUD fincas + estanques
- `server/src/routes/bitacora.ts` — CRUD bitácora
- `server/src/routes/especies.ts` — CRUD especies
- `server/prisma/schema.prisma` — Esquema de base de datos (10 tablas)
- `server/prisma/migration.sql` — SQL generado para crear tablas
- `server/package.json`, `server/tsconfig.json`, `server/.env`, `server/.env.example`
- `src/store/auth.tsx` — Nuevo: AuthProvider (login/register/logout/sesión)
- `src/pages/Login.tsx` — Nuevo: página de login/register
- `src/App.tsx` — AuthProvider + rutas protegidas
- `src/components/Layout.tsx` — Botón logout + email del usuario
- `src/pages/Fincas.tsx` — Migrado a API (con fallback localStorage)
- `src/pages/index.ts` + export Login
- `package.json` — + @supabase/supabase-js

### Cambios realizados
1. Backend Express con TypeScript, compila y funciona contra Supabase
2. Proyecto Supabase creado: `smvjffbeshxcfltjoolm`
3. Tablas creadas en PostgreSQL via SQL Editor
4. RLS + permisos configurados para rol authenticated
5. AuthProvider en frontend con persistencia de sesión
6. Página Login con toggle registro/inicio sesión
7. Rutas protegidas: redirigen a /login si no hay sesión
8. Fincas migrado: consulta API primero, fallback a localStorage

### Errores corregidos
- RLS policies mal configuradas: necesitaban `auth.role() = 'authenticated'`
- Tablas sin GRANT para rol authenticated → añadido
- Conexión directa PostgreSQL bloqueada → solución con Supabase REST API

### Riesgos detectados
- Sin la service_role key, la conexión directa a PostgreSQL no funciona
- Dependencia de disponibilidad de Supabase para operaciones de escritura
- Migración gradual: conviven localStorage + API hasta migrar todas las páginas

---

## 2026-06-09 — Tests unitarios + Términos y Condiciones

### Objetivo
Escribir tests unitarios para el core (vitest) para proteger el código antes del backend, y redactar Términos y Condiciones para el SaaS.

### Archivos modificados
- `src/core/__tests__/formulas.test.ts` — Nuevo: 25 tests para calcular() y calcRacion()
- `package.json` — Añadido script "test": "vitest run"
- `TERMS.md` — Nuevo: Términos y Condiciones de uso
- `CHANGELOG.md` — Actualizado
- `PROJECT_STATUS.md` — Actualizado
- `AI_CONTEXT.md` — Actualizado
- `README.md` — Actualizado

### Cambios realizados
1. Instalado vitest como devDependency
2. Creado test suite para fórmulas: 25 tests (21 de cálculo base, energía, combustible + 4 de ración)
3. Todos los tests pasan: `npm test` → 25/25
4. Creado TERMS.md con 12 secciones: aceptación, definiciones, registro, planes, propiedad intelectual, privacidad, limitación de responsabilidad, uso aceptable, suspensión, modificaciones, legislación, contacto

### Errores corregidos
- Ninguno detectado durante los tests

### Riesgos detectados
- Limitación de responsabilidad es crítica: un productor podría reclamar por pérdidas basadas en cálculos de la app
- Términos deben ser revisados por un abogado antes del primer cliente pagador

---

## 2026-06-09 — Auditoría estratégica + Sistema de documentación + Inventario + Mapa

### Objetivo
Auditar el proyecto completo, crear módulo de inventario, jerarquía finca→estanques, mapa de arquitectura, y sistema formal de documentación.

### Archivos modificados
- `src/components/GlobalSearch.tsx` — Fix: indexed loop + try/catch + type guard
- `src/core/inventario-types.ts` — Nuevo: tipos Producto, Movimiento, Categoría
- `src/store/inventario.ts` — Nuevo: hook useInventario() con CRUD + alertas
- `src/pages/Inventario.tsx` — Nuevo: página completa con 3 tabs
- `src/core/i18n.ts` — +30 claves inventario + estanques + mapa (~15 c/u)
- `src/data/navLinks.ts` — + entrada inventario
- `src/pages/Dashboard.tsx` — + card resumen inventario
- `src/pages/Fincas.tsx` — + estanques: tipo, migración, CRUD inline
- `src/store/lookups.ts` — Rewrite: estanques reales desde fincas
- `src/pages/Mapa.tsx` — Nuevo: mapa visual de arquitectura
- `src/App.tsx` — + rutas /inventario y /mapa
- `src/core/index.ts` — + exports inventario
- `src/pages/index.ts` — + exports Inventario, Mapa
- `src/pages/MasterPage.tsx` — + botón Mapa + useNavigate
- `src/index.css` — + estilos mapa
- `PROJECT_STATUS.md` — Nuevo
- `CHANGELOG.md` — Nuevo (este archivo)
- `ROADMAP.md` — Nuevo
- `BUSINESS_PLAN.md` — Nuevo
- `AI_CONTEXT.md` — Nuevo
- `TECHNICAL_DECISIONS.md` — Nuevo
- `VISION.md` — Nuevo
- `README.md` — Actualizado

### Cambios realizados
1. **GlobalSearch**: reemplazado `Object.entries(localStorage)` por `localStorage.key(i)` + `getItem()`, agregado `typeof s === "string"` guard, try/catch por item, Enter → navigate al primer resultado.
2. **Inventario**: módulo completo con tipos, store, página, integración en Dashboard y navegación.
3. **Fincas → Estanques**: tipo extendido con `estanques: string[]`, migración automática, CRUD inline.
4. **Lookups**: `useLookups().estanques` ahora devuelve estanques reales con ID compuesto `fincaId||nombre`.
5. **Mapa**: página oculta (solo desde Master Panel) con grid de 4 capas (Core, Store, Pages, Infra) y estado visual.
6. **Documentación**: creados 7 documentos formales de proyecto.

### Errores corregidos
- `GlobalSearch.tsx`: `Object.entries(localStorage)` no funciona en todos los navegadores
- `GlobalSearch.tsx`: `.toLowerCase()` en valores no-string lanza excepción
- `GlobalSearch.tsx`: registro corrupto en localStorage rompe toda la búsqueda
- `lookups.ts`: estanques eran copia de fincas, no referencias reales

### Riesgos detectados
- Sin backend ni base de datos: no se puede vender SaaS
- Sin tests unitarios: riesgo de regresión al escalar
- Sin CI/CD: despliegues manuales frágiles
- Sin validación con clientes reales: posible product-market fit incorrecto

---

## Sesiones Anteriores (16 fases)

*Nota: El historial previo al 2026-06-09 se resume de la memoria del proyecto.*

### Fases 1-16 (fechas anteriores)
- Calculator, Bitácora, Zootécnico, Especies, Fincas, Parámetros, Fórmulas
- Microbiología, Finanzas, Veterinary Wizard, Master Panel
- Dashboard, GlobalSearch, Tutorial, Theme toggle, PWA
- Sidebar, PDF/Excel exports, i18n completo
- Migración de Firebase a localStorage
- Refactor a TypeScript puro en core/
