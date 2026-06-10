# CHANGELOG — AcuiCal

> Todas las fechas en formato YYYY-MM-DD.

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
6. **Documentación**: creados 7 documentos formales de proyecto siguiendo el Sistema Operativo definido.

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
