# CONTEXT.md — AcuiCal

> Contexto completo del proyecto para continuidad de desarrollo por IA.
> Actualizado: 2026-06-13 (HEAD `7a48938`, fusionado con `silent-meadow`).

---

## ¿Qué es AcuiCal?

SaaS de gestión acuícola para productores pequeños y medianos de LATAM. Offline-first, multilingüe (ES/EN/PT), con referencias científicas (FAO, Boyd, Timmons).

---

## Estado Actual

- **Frontend**: React 19 + TypeScript 6 + Vite 8 — deployado en Cloudflare Pages
- **Backend**: Express + TypeScript + Prisma — deployado en Railway
- **Base de datos**: PostgreSQL en Supabase
- **Autenticación**: Supabase Auth (JWT, persistSession)
- **Persistencia**: Híbrida — API primaria + localStorage como fallback/cache
- **PWA**: vite-plugin-pwa con service worker + Workbox
- **Tests**: 33 tests vitest para core (calcular, calcRacion, plan)
- **Roles**: admin (soporte interno), gestor (dueño finca), tecnico (empleado)
- **Admin Panel**: 5 tabs profesionales, accesible en /admin, requiere rol "admin" + PIN
- **Build**: `tsc -b && vite build` — compila y pasa

### URLs
- Frontend (app): https://app.acuical.com
- Backend API: https://acuacal21-production.up.railway.app/api
- Backend health: https://acuacal21-production.up.railway.app/api/health → `{"status":"ok","version":"1.0.0"}`
- Supabase project: `smvjffbeshxcfltjoolm`

---

## Arquitectura

```
acucal2.1/
├── src/                          # Frontend React + Vite
│   ├── core/                     # TypeScript puro (sin React, sin DOM)
│   │   ├── formulas.ts           # cálculos acuícolas (biomasa, FCR, ración)
│   │   ├── species-defaults.ts   # 7 especies predefinidas + ENERGY_DEFAULTS
│   │   ├── currencies.ts         # 16 monedas con formato locale
│   │   ├── i18n.ts               # ~494 claves × 3 idiomas (ES/EN/PT)
│   │   ├── validators.ts         # validación WQ, formularios, email
│   │   ├── observations.ts       # 10 observaciones clínicas
│   │   ├── inventario-types.ts   # tipos Producto, Movimiento, Categoría
│   │   ├── plan.ts               # Plan/Rol system
│   │   ├── __tests__/            # 33 tests vitest
│   │   └── index.ts
│   ├── store/                    # React Context + hooks
│   │   ├── auth.tsx              # AuthProvider (Supabase login/register/logout)
│   │   ├── language.tsx          # LanguageProvider + useTranslation
│   │   ├── currency.tsx          # CurrencyProvider + useCurrency
│   │   ├── theme.tsx             # ThemeProvider + useTheme
│   │   ├── lookups.ts            # useLookups() — fincas, especies, estanques
│   │   ├── inventario.ts         # useInventario() — CRUD + alertas (localStorage)
│   │   └── saveIndicator.ts      # useSaveIndicator()
│   ├── components/               # Componentes compartidos
│   │   ├── Layout.tsx            # Header + Sidebar + main + logout
│   │   ├── GlobalSearch.tsx      # búsqueda en localStorage
│   │   ├── Toast.tsx             # notificaciones toast
│   │   ├── Tutorial.tsx          # tutorial interactivo 5 pasos
│   │   ├── Profile.tsx           # modal perfil de usuario
│   │   ├── SyncBadge.tsx         # badge cola de sincronización
│   │   ├── FeedbackWidget.tsx    # widget de feedback
│   │   ├── ErrorBoundary.tsx     # boundary de errores
│   │   └── ConfirmModal.tsx      # modal de confirmación
│   ├── pages/                    # 15 páginas (13 protegidas + login + terminos)
│   │   ├── Login.tsx             # login/register con checkbox términos
│   │   ├── Terminos.tsx          # términos y condiciones (público)
│   │   ├── Dashboard.tsx         # resumen global (API + localStorage)
│   │   ├── Calculator.tsx        # calculadora acuícola (local)
│   │   ├── Bitacora.tsx          # biometría diaria (API + localStorage)
│   │   ├── Zootecnico.tsx        # seguimiento gráficos (API + localStorage)
│   │   ├── Especies.tsx          # CRUD especies (API + localStorage)
│   │   ├── Fincas.tsx            # CRUD fincas + estanques (API + localStorage)
│   │   ├── Parametros.tsx        # parámetros WQ (API + localStorage)
│   │   ├── Formulas.tsx          # referencias técnicas (estático)
│   │   ├── Microbiologia.tsx     # registro microbiológico (API + localStorage)
│   │   ├── Finanzas.tsx          # gestión financiera (API + localStorage)
│   │   ├── Inventario.tsx        # productos + movimientos (API + localStorage)
│   │   ├── veterinary/           # wizard diagnóstico sanitario (API + localStorage)
│   │   ├── Admin.tsx             # panel admin (5 tabs, PIN, override plan/rol)
│   │   ├── Planes.tsx            # selector de planes/roles
│   │   ├── Mapa.tsx              # mapa arquitectura (solo desde Master)
│   │   └── MedirEstanque.tsx     # medir estanque con Leaflet
│   ├── hooks/                    # Custom hooks
│   │   └── useGeolocation.ts     # geolocalización GPS
│   ├── services/                 # Capa de servicios
│   │   ├── api.ts                # cliente HTTP
│   │   ├── sync.ts               # cola de sincronización offline
│   │   ├── analytics.ts          # analytics (PostHog)
│   │   └── geo.ts                # servicios geoespaciales
│   ├── data/navLinks.ts          # definición navegación
│   ├── utils/                    # Utilidades
│   │   ├── config.ts             # configuración
│   │   ├── debugData.ts          # datos de prueba
│   │   ├── excel.ts              # exportación Excel
│   │   ├── migrateKeys.ts        # migración de claves localStorage
│   │   └── pdf.ts                # exportación PDF
│   ├── App.tsx                   # router (15 rutas + AuthProvider)
│   ├── main.tsx                  # entry point + PWA
│   └── index.css                 # estilos globales
│
├── server/                       # Backend Express + Prisma
│   ├── src/
│   │   ├── index.ts              # servidor Express (14 routers)
│   │   ├── middleware/
│   │   │   ├── auth.ts           # verificación JWT Supabase
│   │   │   └── errorHandler.ts   # manejo global de errores
│   │   └── routes/               # 14 routers, 30+ endpoints
│   │       ├── auth.ts           # POST /api/auth/register, /login, /logout
│   │       ├── fincas.ts         # CRUD /api/fincas + estanques
│   │       ├── bitacora.ts       # CRUD /api/bitacora
│   │       ├── especies.ts       # CRUD /api/especies
│   │       ├── finanzas.ts       # CRUD /api/finanzas
│   │       ├── inventario.ts     # CRUD /api/inventario
│   │       ├── microbiologia.ts  # CRUD /api/microbiologia
│   │       ├── veterinaria.ts    # CRUD /api/veterinaria
│   │       ├── dashboard.ts      # GET /api/dashboard/stats
│   │       ├── parametros.ts     # GET/PUT /api/parametros
│   │       ├── pagos.ts          # POST /api/pagos/checkout, /webhook, /subscription
│   │       ├── feedback.ts       # POST /api/feedback
│   │       ├── geo.ts            # POST /api/geo/estanques
│   │       └── admin.ts          # GET /api/admin/users, /stats, /subscriptions
│   ├── prisma/
│   │   ├── schema.prisma         # 10 tablas + enums
│   │   ├── seed.ts               # seed de datos
│   │   └── migration_*.sql       # migraciones incrementales
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── public/
│   ├── _redirects                # SPA fallback para Cloudflare Pages
│   ├── _headers                  # headers de seguridad
│   ├── favicon.svg
│   └── icons/                    # iconos PWA
├── tools/                        # Deploy panel local
│   ├── server.mjs                # servidor HTTP local
│   └── index.html                # UI del deploy panel
├── .github/workflows/build.yml  # CI
├── wrangler.toml                 # Config Cloudflare Pages
├── dist/                         # build de producción
├── package.json
├── vite.config.ts
├── CONTEXT.md                    # este archivo
├── README.md
├── AI_CONTEXT.md
├── CHANGELOG.md
├── PROJECT_STATUS.md
├── ROADMAP.md
└── ... (otros docs)
```

---

## Funcionalidades Implementadas

### Frontend (100% funcional)
| Feature | Estado | Persistencia |
|---------|--------|-------------|
| Calculadora acuícola (biomasa, FCR, rentabilidad, ración) | ✅ | Local |
| Bitácora de biometría con validación WQ | ✅ | API + localStorage |
| Seguimiento zootécnico con gráficos | ✅ | API + localStorage |
| CRUD especies (7 predefinidas + personalizadas) | ✅ | API + localStorage |
| CRUD fincas + estanques (jerarquía) | ✅ | API + localStorage |
| Parámetros WQ por especie | ✅ | API + localStorage |
| Fórmulas de referencia (FAO, Boyd, Timmons) | ✅ | Estático |
| Microbiología (cultivos + medicación) | ✅ | API + localStorage |
| Finanzas por ciclo | ✅ | API + localStorage |
| Inventario (productos, movimientos, alertas) | ✅ | API + localStorage |
| Wizard veterinario (diagnóstico sanitario) | ✅ | API + localStorage |
| Dashboard con resumen global | ✅ | API + localStorage |
| Admin Panel (5 tabs: Overview, Usuarios, Suscripciones, Sistema, Herramientas) | ✅ | API + localStorage |
| Mapa de arquitectura | ✅ | localStorage |
| Login / Register con Supabase Auth + step indicators | ✅ | API (Supabase) |
| Términos y Condiciones | ✅ | Estático |
| i18n ES/EN/PT (~494 claves) | ✅ | Contexto |
| PWA (instalable, service worker) | ✅ | N/A |
| Exportación PDF (jsPDF) | ✅ | N/A |
| Exportación Excel (exceljs) | ✅ | N/A |
| Temas dark/light | ✅ | localStorage |
| Búsqueda global | ✅ | localStorage |
| Tutorial interactivo (5 pasos) | ✅ | localStorage |
| Sidebar responsive + hamburger menu | ✅ | Contexto |
| Indicador de guardado + toast | ✅ | Contexto |
| UI polish: cards hover lift + glow, dash-card gradient border | ✅ | N/A |
| Planes con selector de rol (Pro/Enterprise) | ✅ | API + localStorage |
| Sincronización offline (cola persistente) | ✅ | IndexedDB |
| Feedback widget | ✅ | API |
| Medir estanque con GPS + 6 formas | ✅ | Local |
| Analytics (PostHog) | ✅ | API |

### Backend (14 routers, 30+ endpoints)
| Router | Endpoints | Auth |
|--------|-----------|------|
| `auth.ts` | 3 POST (register, login, logout) | ❌ |
| `fincas.ts` | 6 (GET, POST, PUT/:id, DELETE/:id, POST/:id/estanques, DELETE/:fincaId/estanques/:estanqueId) | ✅ JWT |
| `bitacora.ts` | 3 (GET list, POST, DELETE/:id) | ✅ JWT |
| `especies.ts` | 4 (GET list, POST, PUT/:id, DELETE/:id) | ✅ JWT |
| `finanzas.ts` | 4 (GET list, POST, PUT/:id, DELETE/:id) | ✅ JWT |
| `inventario.ts` | 6 (GET productos, POST productos, PUT/:id, DELETE/:id, GET movimientos, POST movimientos) | ✅ JWT |
| `microbiologia.ts` | 4 (GET list, POST, PUT/:id, DELETE/:id) | ✅ JWT |
| `veterinaria.ts` | 3 (GET list, POST, DELETE/:id) | ✅ JWT |
| `dashboard.ts` | 1 (GET /stats) | ✅ JWT |
| `parametros.ts` | 2 (GET, PUT) | ✅ JWT |
| `geo.ts` | 1 (POST /estanques) | ✅ JWT |
| `pagos.ts` | 3 (checkout, webhook, subscription) | ✅ JWT (mix) |
| `feedback.ts` | 1 (POST) | ❌ |
| `admin.ts` | 3 (GET users, stats, subscriptions) | ✅ JWT + admin |

### Base de datos (10 tablas PostgreSQL en Supabase)
- User, Finca, Estanque, Especie, Bitacora, Finanza, Inventario, MovimientoInventario, Microbiologia, Veterinaria
- RLS habilitado con `auth.role() = 'authenticated'`
- Enums: Idioma (es/en/pt), Rol (admin/gestor/tecnico), TipoMovimiento (entrada/salida), CategoriaProducto (alimento/medicamento/equipo/insumo/otro)

### Infraestructura
- Frontend: Cloudflare Pages (SPA con `_redirects` + `wrangler.toml`)
- Backend: Railway (express, Node)
- Base de datos: Supabase PostgreSQL
- Auth: Supabase Auth (JWT, persistSession, autoRefreshToken)
- SMTP configurado: Resend (smtp.resend.com:465) — dominio acuical.com verificado ✅

---

## Flujo de Autenticación

1. `AuthProvider` en `App.tsx` envuelve toda la app
2. Al montar, lee sesión existente de Supabase (`getSession`)
3. Escucha cambios de auth (`onAuthStateChange`) para mantener user/token actualizados
4. `Login.tsx`: formulario con toggle login/register, step indicators visuales en registro, checkbox "Acepto Términos"
5. `register()`: llama a `supabase.auth.signUp()` + POST `/api/auth/register` para crear perfil en DB
6. `login()`: llama a `supabase.auth.signInWithPassword()`
7. `ProtectedRoute`: redirige a `/login` si no hay `user`
8. Confirm sign up: **OFF** — registro instantáneo sin verificación email

---

## Páginas que usan API vs localStorage

| Página | API | localStorage | Data |
|--------|:---:|:------------:|------|
| Login | ✅ Supabase | ❌ | Sesión |
| Dashboard | ✅ | ✅ | `aquacalc_*` todos | API + localStorage fallback |
| Calculator | ❌ | Indirecto (lookups) | Cálculos locales |
| Bitácora | ✅ | ✅ `aquacalc_bitacora` | API primario + localStorage fallback |
| Zootécnico | ✅ | ✅ `aquacalc_bitacora` | API primario + localStorage fallback |
| Especies | ✅ | ✅ `aquacalc_custom_species` | API primario + localStorage fallback |
| Fincas | ✅ | ✅ `aquacalc_fincas` | API primario + localStorage fallback |
| Parámetros | ✅ | ✅ `aquacalc_params_overrides` | API primario + localStorage fallback |
| Fórmulas | ❌ | ❌ | Estático |
| Microbiología | ✅ | ✅ `aquacalc_cultivos`, `aquacalc_medicacion` | API primario + localStorage fallback |
| Finanzas | ✅ | ✅ `aquacalc_finanzas` | API primario + localStorage fallback |
| Inventario | ✅ | ✅ `aquacalc_inventario_*` | API primario + localStorage fallback |
| Veterinaria | ✅ | ✅ `aquacalc_vet_reports` | API primario + localStorage fallback |
| Admin Panel | ✅ | ✅ Todos los `aquacalc_*` | API + localStorage |
| Planes | ✅ | ❌ | API |
| Mapa | ❌ | ❌ | Estático |
| Medir Estanque | ❌ | ❌ | Local (cálculos) |
| Términos | ❌ | ❌ | Estático |

---

## Pendientes para MVP Vendible

1. **Pagos**: ONVO Pay. Planes Free/Pro ($20)/Enterprise ($50). Código listo, falta crear productos en dashboard ONVO y configurar webhook + keys en Railway.
2. **Dominio**: ✅ COMPLETADO — acuical.com (Cloudflare)
3. **Multi-usuario**: roles admin/gestor/tecnico con gating de permisos — ✅ IMPLEMENTADO
4. **Sync offline**: cola de cambios localStorage → API — ✅ IMPLEMENTADO (IndexedDB)
5. **Dashboard + Parametros + Zootécnico**: migrados a API — ✅ COMPLETADO
6. **CI/CD**: GitHub Actions (typecheck + test + build) — ✅ IMPLEMENTADO
7. **Code splitting**: pdf.js separado, excel.js separado — ✅ COMPLETADO

---

## Convenciones de Código

- **Sin comentarios** en código (salvo excepciones)
- **Sin Firebase** — localStorage + Supabase
- **Core puro TS** (`src/core/`) sin React ni DOM
- **Variables UI en español** (finca, estanque, bitácora…)
- **IDs**: `${prefix}_${Date.now()}`
- **Estanques**: ID compuesto `fincaId||nombre`
- **i18n**: claves camelCase, toda string visible usa `t("clave")`, agregar en los 3 idiomas
- **CSS**: una sola hoja `index.css`, variables CSS para tema, prefijos semánticos
- **Build**: `tsc -b && vite build` debe pasar siempre

---

## Comandos Útiles

```bash
npm run dev              # Frontend dev server
npm run build            # Frontend build (tsc -b && vite build)
npm run test             # 33 vitest tests
npm run deploy           # Build + deploy a Cloudflare Pages (requiere wrangler)
cd server && npm run dev # Backend dev server (tsx watch)
cd server && npm run build # Backend tsc build
cd server && npm run db:seed # Seed datos demo
```

---

## Credenciales y Configuración

- Supabase URL: `https://smvjffbeshxcfltjoolm.supabase.co`
- Supabase anon key: `sb_publishable_EQRvreJDv4d-wYZmaMY3Bg_x2D3kM_v`
- DB password: `WA2zbvqKVGkoY4aLrjS71E8s` (rotada 2026-06-11)
- API URL (frontend): `https://acuacal21-production.up.railway.app/api`
- Admin Panel PIN: `211203`
- Resend SMTP: `smtp.resend.com:465`, key `re_XzQe6JmD_BKRZ6vsV7QdJgGogjpLHz8Mi` (solo puede enviar a owner email)
- Owner email: `acuicolasvientoenpopa@gmail.com`
