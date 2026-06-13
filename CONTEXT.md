# CONTEXT.md — AcuiCal / AquaCalc

> Contexto completo del proyecto para continuidad de desarrollo por IA.
> Actualizado: 2026-06-13 (HEAD en `opencode/witty-engine` = `origin/main`).

---

## ¿Qué es AcuiCal?

SaaS de gestión acuícola para productores pequeños y medianos de LATAM. Offline-first, multilingüe (ES/EN/PT), con referencias científicas (FAO, Boyd, Timmons). También llamado **AquaCalc** en la UI.

---

## Estado Actual (HEAD)

| Capa | Stack | Deploy |
|------|-------|--------|
| **Frontend** | React 19 + TypeScript 6 + Vite 8 | Netlify (`acuacla2112.netlify.app`) |
| **Backend** | Express + Prisma + Zod | Railway |
| **BD** | PostgreSQL + RLS | Supabase |
| **Auth** | Supabase Auth (JWT, persistSession, autoRefreshToken) | Supabase |
| **Persistencia** | API primaria + localStorage fallback/cache | Híbrida |
| **PWA** | `vite-plugin-pwa` (injectRegister: null, SW manual) | Service Worker propio |
| **Tests** | 25 tests vitest en `src/core/__tests__/formulas.test.ts` | Vitest |
| **Build** | `tsc -b && vite build` | Pasa |

### URLs activas
- **Frontend:** https://acuacla2112.netlify.app
- **Backend API:** https://acuacal21-production.up.railway.app/api
- **Health:** https://acuacal21-production.up.railway.app/api/health → `{"status":"ok","version":"1.0.0"}`
- **Supabase:** `smvjffbeshxcfltjoolm.supabase.co`
- **Repo:** `acuicolasvientoenpopa-coder/acuacal21`

---

## Arquitectura

```
acucal2.1/
├── src/                              # Frontend React + Vite
│   ├── core/                         # TypeScript puro (sin React, sin DOM)
│   │   ├── formulas.ts               # cálculos: biomasa, FCR, ración, energía, 6 formas volumen
│   │   ├── species-defaults.ts       # 7 especies predefinidas + ENERGY_DEFAULTS
│   │   ├── currencies.ts             # 16 monedas con formato locale
│   │   ├── i18n.ts                   # ~1364 líneas, 300+ claves × 3 idiomas (ES/EN/PT)
│   │   ├── validators.ts             # validación WQ, formularios, email
│   │   ├── observations.ts           # 10 observaciones clínicas
│   │   ├── inventario-types.ts       # tipos Producto, Movimiento, Categoría
│   │   ├── plan.ts                   # Plan/Rol: Free/Pro/Enterprise, límites, gates
│   │   ├── __tests__/                # 25 tests vitest (formulas)
│   │   └── index.ts                  # barrel export
│   ├── store/                        # React Context + hooks
│   │   ├── auth.tsx                  # AuthProvider: login/register/logout/resetPassword, plan/rol
│   │   ├── language.tsx              # LanguageProvider + useTranslation (contenía fix TS cache)
│   │   ├── currency.ts               # CurrencyProvider + useCurrency
│   │   ├── theme.ts                  # ThemeProvider + useTheme
│   │   ├── lookups.ts                # useLookups() — fincas, especies, estanques (localStorage)
│   │   ├── inventario.ts             # useInventario() — CRUD + alertas (localStorage)
│   │   └── saveIndicator.ts          # useSaveIndicator()
│   ├── components/                   # Componentes compartidos
│   │   ├── Layout.tsx                # Header + Sidebar + online/offline bar + install prompt
│   │   ├── Toast.tsx                 # notificaciones toast
│   │   ├── Tutorial.tsx              # tutorial interactivo 5 pasos
│   │   ├── GlobalSearch.tsx          # búsqueda en localStorage
│   │   ├── Profile.tsx               # modal perfil de usuario (nombre, inicial)
│   │   └── ConfirmModal.tsx          # modal de confirmación reutilizable
│   ├── pages/                        # 14 páginas en router (+ login/terminos)
│   │   ├── Login.tsx                 # login/register/forgot password, checkbox términos
│   │   ├── Terminos.tsx              # términos y condiciones (público)
│   │   ├── Dashboard.tsx             # resumen global (localStorage + API)
│   │   ├── Calculator.tsx            # calculadora acuícola con energía (local)
│   │   ├── Bitacora.tsx              # biometría diaria (API + localStorage)
│   │   ├── Zootecnico.tsx            # seguimiento gráficos (localStorage)
│   │   ├── Especies.tsx              # CRUD especies (API + localStorage)
│   │   ├── Fincas.tsx                # CRUD fincas + estanques con gates plan (API + localStorage)
│   │   ├── Parametros.tsx            # parámetros WQ (localStorage)
│   │   ├── Formulas.tsx              # referencias técnicas (estático)
│   │   ├── Microbiologia.tsx         # registro microbiológico (API + localStorage)
│   │   ├── Finanzas.tsx              # gestión financiera (API + localStorage)
│   │   ├── Inventario.tsx            # productos + movimientos (API + localStorage)
│   │   ├── veterinary/              # wizard diagnóstico sanitario (4 archivos)
│   │   │   ├── index.ts
│   │   │   ├── VeterinaryReportWizard.tsx
│   │   │   ├── riskCalculator.ts
│   │   │   └── symptomRules.ts
│   │   ├── Admin.tsx                 # panel admin (reemplaza MasterPage): override plan/rol,
│   │   │                             #   generar datos prueba, status API, import/export JSON,
│   │   │                             #   force SW update, clear localStorage
│   │   ├── MasterPage.tsx            # (legacy, reemplazado por Admin.tsx)
│   │   ├── GeoPond.tsx               # (legacy, reemplazado por MedirEstanque.tsx)
│   │   ├── MedirEstanque.tsx         # medir estanque: 6 formas (manual/geo), Leaflet map,
│   │   │                             #   rectangular/circular/trapezoidal/tanque/triangular/polígono
│   │   ├── Mapa.tsx                  # mapa arquitectura (solo desde Admin)
│   │   └── index.ts                  # barrel export
│   ├── data/navLinks.ts             # definición navegación + medirEstanque link
│   ├── utils/debugData.ts           # generadores de datos de prueba
│   ├── services/index.ts            # (vacio — export {})
│   ├── App.tsx                      # router (16 rutas: 14 protegidas + login + terminos)
│   ├── main.tsx                     # entry point + service worker registration manual
│   └── index.css                    # estilos globales, variables CSS tema
│
├── server/                          # Backend Express + Prisma + Zod
│   ├── src/
│   │   ├── index.ts                 # servidor Express (8 routers + health)
│   │   ├── middleware/
│   │   │   ├── auth.ts              # verificación JWT Supabase
│   │   │   └── errorHandler.ts      # manejo global de errores
│   │   └── routes/                  # 8 routers, 26 endpoints
│   │       ├── auth.ts              # 3 POST (register, login, logout)
│   │       ├── fincas.ts            # CRUD fincas + estanques (6 endpoints)
│   │       ├── bitacora.ts          # CRUD bitácora (3 endpoints)
│   │       ├── especies.ts          # CRUD especies (4 endpoints)
│   │       ├── finanzas.ts          # CRUD finanzas (4 endpoints)
│   │       ├── inventario.ts        # CRUD productos + movimientos (6 endpoints)
│   │       ├── microbiologia.ts     # CRUD microbiología (4 endpoints)
│   │       └── veterinaria.ts       # CRUD veterinaria (3 endpoints)
│   ├── prisma/
│   │   ├── schema.prisma            # 10 tablas + 4 enums
│   │   └── migration.sql
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── tools/                           # Deploy panel local
│   ├── server.mjs                   # servidor HTTP local (build, deploy, status)
│   └── index.html                   # UI del deploy panel
├── .github/workflows/build.yml     # CI: npm ci + npm run build
├── public/
│   ├── _redirects                   # SPA fallback Netlify
│   ├── _headers                     # headers de seguridad
│   ├── favicon.svg
│   └── icons.svg
├── AcuiCal Panel.bat               # lanzador Windows para deploy panel
├── deploy.bat                       # script deploy legacy
└── iniciar.bat
```

---

## Funcionalidades Implementadas

### Frontend

| Feature | Estado | Persistencia |
|---------|--------|-------------|
| Calculadora acuícola (biomasa, FCR, rentabilidad, ración, energía) | ✅ | Local |
| Bitácora de biometría con validación WQ | ✅ | API + localStorage |
| Seguimiento zootécnico con gráficos | ✅ | localStorage |
| CRUD especies (7 predefinidas + personalizadas) | ✅ | API + localStorage |
| CRUD fincas + estanques con gates por plan | ✅ | API + localStorage |
| Parámetros WQ por especie | ✅ | localStorage |
| Fórmulas de referencia (FAO, Boyd, Timmons) | ✅ | Estático |
| Microbiología (cultivos + medicación) | ✅ | API + localStorage |
| Finanzas por ciclo | ✅ | API + localStorage |
| Inventario (productos, movimientos, alertas) | ✅ | API + localStorage |
| Wizard veterinario (diagnóstico sanitario) | ✅ | API + localStorage |
| Dashboard con resumen global | ✅ | API + localStorage |
| Admin Panel (override plan/rol, data tools, import/export JSON) | ✅ | localStorage |
| Mapa de arquitectura | ✅ | localStorage |
| Login / Register / Forgot Password con Supabase Auth | ✅ | API (Supabase) |
| Términos y Condiciones | ✅ | Estático |
| i18n ES/EN/PT (300+ claves) | ✅ | Contexto |
| PWA (instalable, service worker manual) | ✅ | N/A |
| Exportación PDF (jsPDF) | ✅ | N/A |
| Exportación Excel (SheetJS) | ✅ | N/A |
| Temas dark/light | ✅ | localStorage |
| Búsqueda global | ✅ | localStorage |
| Tutorial interactivo (5 pasos) | ✅ | localStorage |
| Sidebar responsive + hamburger menu | ✅ | Contexto |
| Indicador de guardado + toast | ✅ | Contexto |
| Perfil de usuario (modal edición) | ✅ | localStorage |
| Medir estanque: 6 formas, modo manual/geo, Leaflet | ✅ | Local |
| Calculadora de volumen (rectangular, circular, trapezoidal, tanque, triangular, polígono) | ✅ | Local |
| Planes y roles (Free/Pro/Enterprise + productor/técnico/admin) | ✅ | localStorage + API |
| Reset de contraseña (forgot password flow) | ✅ | Supabase Auth |
| Estado offline/online en header | ✅ | Navegador |
| Install prompt PWA (beforeinstallprompt) | ✅ | Navegador |
| Online/offline bar | ✅ | Navegador |
| 5 clics logo → admin panel | ✅ | Navegador |
| Deploy panel local (tools/) | ✅ | Local |

### Backend (8 routers, 26 endpoints)

| Router | Endpoints | Auth |
|--------|-----------|------|
| `auth.ts` | 3 POST (register, login, logout) | ❌ |
| `fincas.ts` | 6 (GET list, POST, PUT/:id, DELETE/:id, POST/:id/estanques, DELETE/:fincaId/estanques/:estanqueId) | ✅ JWT |
| `bitacora.ts` | 3 (GET list, POST, DELETE/:id) | ✅ JWT |
| `especies.ts` | 4 (GET list, POST, PUT/:id, DELETE/:id) | ✅ JWT |
| `finanzas.ts` | 4 (GET list, POST, PUT/:id, DELETE/:id) | ✅ JWT |
| `inventario.ts` | 6 (GET productos, POST productos, PUT/:id, DELETE/:id, GET movimientos, POST movimientos) | ✅ JWT |
| `microbiologia.ts` | 4 (GET list, POST, PUT/:id, DELETE/:id) | ✅ JWT |
| `veterinaria.ts` | 3 (GET list, POST, DELETE/:id) | ✅ JWT |

### Base de datos (10 tablas PostgreSQL en Supabase)

- **User** (id, email, nombre, idioma, rol, createdAt, updatedAt)
- **Finca** (id, nombre, ubicacion, userId, createdAt, updatedAt)
- **Estanque** (id, nombre, fincaId)
- **Especie** (id, nombre, nombreCientifico, userId, esPersonal, parametros Json?, createdAt, updatedAt)
- **Bitacora** (id, fecha, userId, fincaId, estanqueId?, especieId?, peso?, cantidad?, temperatura?, oxigeno?, ph?, salinidad?, amonio?, observaciones?, createdAt, updatedAt)
- **Finanza** (id, tipo, monto, descripcion?, fecha, fincaId, userId, createdAt, updatedAt)
- **Inventario** (id, nombre, categoria, cantidad, minimo, precio?, fincaId, userId, createdAt, updatedAt)
- **MovimientoInventario** (id, tipo, cantidad, motivo?, fecha, productoId)
- **Microbiologia** (id, fecha, resultado, notas?, fincaId, userId, createdAt)
- **Veterinaria** (id, fecha, diagnostico, riesgo, notas?, fincaId, userId, createdAt)

Enums: `Idioma` (es/en/pt), `Rol` (admin/productor/tecnico), `TipoMovimiento` (entrada/salida), `CategoriaProducto` (alimento/medicamento/equipo/insumo/otro)

RLS habilitado con `auth.role() = 'authenticated'`.

---

## Planes y Roles (core/plan.ts)

| Plan | Max Fincas | Max Estanques | Export | Roles disponibles |
|------|-----------|--------------|--------|------------------|
| Free | 1 | 3 | ❌ | productor |
| Pro | ∞ | ∞ | ✅ | productor, tecnico |
| Enterprise | ∞ | ∞ | ✅ | admin, productor, tecnico |

El plan y rol se almacenan en `user_metadata` de Supabase, con override vía localStorage (`aquacalc_plan_override`, `aquacalc_rol_override`) desde Admin Panel.

Gates aplicados en: `Fincas.tsx` (límite de fincas/estanques), exportaciones, y próximamente más páginas.

---

## Flujo de Autenticación

1. `AuthProvider` en `App.tsx` envuelve toda la app
2. Al montar, lee sesión existente de Supabase (`getSession`)
3. Escucha cambios de auth (`onAuthStateChange`) para mantener user/token actualizados
4. Sincroniza plan/rol desde `user_metadata` (con override de localStorage)
5. `Login.tsx`: formulario con 3 modos (login, register, forgot), checkbox "Acepto Términos"
6. `register()`: `supabase.auth.signUp()` con `data: { nombre, plan: "free", rol: "productor" }` + POST `/api/auth/register`
7. `login()`: `supabase.auth.signInWithPassword()`
8. `resetPassword()`: `supabase.auth.resetPasswordForEmail()` con redirect a `/`
9. `ProtectedRoute`: redirige a `/login` si no hay `user`
10. Confirm sign up: **OFF** — registro instantáneo sin verificación email

---

## Páginas que usan API vs localStorage

| Página | API | localStorage | Data |
|--------|:---:|:------------:|------|
| Login | ✅ Supabase | ❌ | Sesión |
| Dashboard | ✅ | ✅ | `aquacalc_*` todos |
| Calculator | ❌ | Indirecto (lookups) | Cálculos locales |
| Bitácora | ✅ | ✅ `aquacalc_bitacora` | API primario + localStorage fallback |
| Zootécnico | ❌ | ✅ `aquacalc_bitacora` | Solo localStorage |
| Especies | ✅ | ✅ `aquacalc_custom_species` | API primario + localStorage fallback |
| Fincas | ✅ | ✅ `aquacalc_fincas` | API primario + localStorage fallback |
| Parámetros | ❌ | ✅ `aquacalc_params_overrides` | Solo localStorage |
| Fórmulas | ❌ | ❌ | Estático |
| Microbiología | ✅ | ✅ `aquacalc_cultivos`, `aquacalc_medicacion` | API primario + localStorage fallback |
| Finanzas | ✅ | ✅ `aquacalc_finanzas` | API primario + localStorage fallback |
| Inventario | ✅ | ✅ `aquacalc_inventario_*` | API primario + localStorage fallback |
| Veterinaria | ✅ | ✅ `aquacalc_vet_reports` | API primario + localStorage fallback |
| Admin Panel | ❌ | ✅ Todos los `aquacalc_*` | Solo localStorage |
| Medir Estanque | ❌ | ❌ | Local (cálculos) |
| Mapa | ❌ | ❌ | Estático |
| Términos | ❌ | ❌ | Estático |

---

## Convenciones de Código

- **Sin comentarios** en código (salvo excepciones)
- **Sin Firebase** — localStorage + Supabase
- **Core puro TS** (`src/core/`) sin React ni DOM
- **Variables UI en español** (finca, estanque, bitácora…)
- **IDs**: `${prefix}_${Date.now()}`
- **Estanques**: ID compuesto `fincaId||nombre`
- **i18n**: claves camelCase, toda string visible usa `t("clave")`, agregar en los 3 idiomas en `i18n.ts`
- **CSS**: una sola hoja `index.css`, variables CSS para tema, prefijos semánticos
- **Build**: `tsc -b && vite build` debe pasar siempre
- **Paths**: alias `@/` → `src/`
- **Rol names**: `productor` (no `gestor`) en la rama `witty-engine`/`main` (renombrado a `gestor` en ramas más nuevas)

---

## Comandos Útiles

```bash
npm run dev                    # Frontend dev server (vite)
npm run build                  # Frontend build (tsc -b && vite build)
npm run test                   # 25 vitest tests
cd server && npm run dev       # Backend dev server (tsx watch)
cd server && npm run build     # Backend tsc build
cd server && npm run db:push   # Push schema to DB
cd server && npm run db:seed   # Seed data
node tools/server.mjs          # Deploy panel local (http://localhost:3456)
AcuiCal Panel.bat              # Lanzador Windows deploy panel
```

---

## Credenciales y Configuración

- Supabase URL: `https://smvjffbeshxcfltjoolm.supabase.co`
- Supabase anon key: `sb_publishable_EQRvreJDv4d-wYZmaMY3Bg_x2D3kM_v`
- DB password: `rmA2F4H0Y3FHmgD2`
- API URL (frontend): `https://acuacal21-production.up.railway.app/api`
- Admin Panel PIN: `211203`
- Resend SMTP: `smtp.resend.com:465`, key `re_XzQe6JmD_BKRZ6vsV7QdJgGogjpLHz8Mi` (solo puede enviar a owner email)
- Owner email: `acuicolasvientoenpopa@gmail.com`

---

## Ramas y Estado

| Rama | Base | Commits adelante | Notas |
|------|------|-----------------|-------|
| `main` / `origin/main` | — | HEAD | Estado actual documentado aquí |
| `opencode/silent-meadow` | `56a1ef6` | ~30+ | Contiene: sync queue, Excel lazy load, Dashboard+Parametros API, Admin rediseñado, Netlify removido, planes con precios, ONVO Pay, rename productor→gestor, landing page, webhook |

---

## Notas Técnicas

- **PWA**: `injectRegister: null` en vite config, registro manual en `main.tsx` con `controllerchange` listener para auto-reload
- **SW**: registrado en `/sw.js`, verificación en visibility change
- **Deploy panel**: servidor Node local (tools/server.mjs) que ejecuta build + git commit + push, accesible en http://localhost:3456
- **CI**: GitHub Actions build.yml — `npm ci && npm run build` en push a main
- **Service layer**: `src/services/index.ts` está vacío (`export {}`)
- **Lookups**: `useLookups()` en store/lookups.ts lee especies y fincas directamente de localStorage
- **Formulas**: incluyen cálculo de energía (bombas, aireadores, combustible) y costos reales por recibo
