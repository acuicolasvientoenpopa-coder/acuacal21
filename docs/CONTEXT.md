# CONTEXT.md — AcuiCal

> Documento generado automáticamente desde el código fuente.
> Fecha: 2026-06-13.

---

## ¿Qué es AcuiCal?

SaaS de gestión acuícola para productores pequeños y medianos de LATAM.
Offline-first, multilingüe (ES/EN/PT), con referencias científicas verificables (FAO, Boyd, Timmons, etc.).

---

## Stack Actual

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 19, TS 6.0.2, Vite 8 |
| Backend | Express + TypeScript + Prisma | Express 4.21, TS 5.8, Prisma 6 |
| Base de datos | PostgreSQL (Supabase) | — |
| Autenticación | Supabase Auth (JWT, persistSession, autoRefreshToken) | — |
| Persistencia | Híbrida — API primaria + localStorage fallback/cache | — |
| PWA | vite-plugin-pwa + Workbox (SW auto-update on visibility change) | 1.3 |
| Tests | Vitest | 4.1 (33 tests) |
| Build | tsc -b && vite build | Pasa limpio |

---

## URLs

- **Frontend**: https://acuacla2112.netlify.app
- **Backend API**: https://acuacal21-production.up.railway.app/api
- **Backend health**: GET /api/health → `{"status":"ok","version":"1.0.0"}`
- **Supabase project**: smvjffbeshxcfltjoolm
- **GitHub**: https://github.com/acuicolasvientoenpopa-coder/acuacal21

---

## Arquitectura

```
acucal2.1/
├── src/                          # Frontend React + Vite
│   ├── core/                     # TypeScript puro (sin React, sin DOM)
│   │   ├── formulas.ts           # 9 funciones de cálculo acuícola
│   │   ├── species-defaults.ts   # 7 especies predefinidas + ENERGY_DEFAULTS
│   │   ├── currencies.ts         # 16 monedas con formato locale
│   │   ├── i18n.ts               # 451 claves × 3 idiomas (ES/EN/PT)
│   │   ├── validators.ts         # validación WQ, formularios, email
│   │   ├── observations.ts       # 10 observaciones clínicas
│   │   ├── inventario-types.ts   # tipos Producto, Movimiento, Categoría
│   │   ├── plan.ts               # Planes (free/pro/enterprise) + roles
│   │   ├── __tests__/            # 33 tests vitest
│   │   └── index.ts              # barrel exports
│   ├── store/                    # React Context + hooks
│   │   ├── auth.tsx              # AuthProvider (Supabase login/register/logout/resetPassword)
│   │   ├── language.tsx          # LanguageProvider + useTranslation
│   │   ├── currency.tsx          # CurrencyProvider + useCurrency
│   │   ├── theme.tsx             # ThemeProvider + useTheme
│   │   ├── lookups.ts            # useLookups() — species, fincas, estanques (localStorage)
│   │   ├── inventario.ts         # useInventario() — CRUD + alertas (localStorage)
│   │   └── saveIndicator.ts      # useSaveIndicator()
│   ├── components/               # Componentes compartidos
│   │   ├── Layout.tsx            # Header + Sidebar + main + logout
│   │   ├── Sidebar interno       # navegación + idioma + moneda + tema
│   │   ├── GlobalSearch.tsx      # búsqueda en localStorage
│   │   ├── Toast.tsx             # notificaciones toast
│   │   ├── Tutorial.tsx          # tutorial interactivo 5 pasos
│   │   ├── ConfirmModal.tsx      # modal de confirmación genérico
│   │   └── Profile.tsx           # ProfileModal + useProfile
│   ├── pages/                    # 18 páginas
│   │   ├── Login.tsx             # login/register/forgot-password + selector idioma
│   │   ├── Terminos.tsx          # términos y condiciones (público)
│   │   ├── Dashboard.tsx         # resumen global (localStorage)
│   │   ├── Calculator.tsx        # calculadora acuícola (local)
│   │   ├── Bitacora.tsx          # biometría diaria (API + localStorage)
│   │   ├── Zootecnico.tsx        # seguimiento gráficos (localStorage)
│   │   ├── Especies.tsx          # CRUD especies (API + localStorage)
│   │   ├── Fincas.tsx            # CRUD fincas + estanques (API + localStorage)
│   │   ├── Parametros.tsx        # parámetros WQ (localStorage)
│   │   ├── Formulas.tsx          # referencias técnicas (estático)
│   │   ├── Microbiologia.tsx     # registro microbiológico (API + localStorage)
│   │   ├── Finanzas.tsx          # gestión financiera (API + localStorage)
│   │   ├── Inventario.tsx        # productos + movimientos (API + localStorage)
│   │   ├── Admin.tsx             # panel admin (localStorage + health check)
│   │   ├── MasterPage.tsx        # panel dev legacy (no enrutado)
│   │   ├── Mapa.tsx              # mapa arquitectura (solo desde MasterPage)
│   │   ├── MedirEstanque.tsx     # medir estanque 6 formas (localStorage)
│   │   ├── GeoPond.tsx           # reemplazado por MedirEstanque (no enrutado)
│   │   └── veterinary/           # wizard diagnóstico sanitario (API + localStorage)
│   ├── data/
│   │   ├── navLinks.ts           # 12 enlaces de navegación
│   │   └── referencias.ts        # 33 referencias técnicas en 5 secciones
│   ├── utils/
│   │   ├── pdf.ts                # exportación PDF (jsPDF) + Excel (SheetJS)
│   │   └── debugData.ts          # generadores de datos de prueba
│   ├── services/index.ts         # vacío (placeholder)
│   ├── App.tsx                   # router: 15 rutas (2 públicas, 13 protegidas)
│   ├── main.tsx                  # entry point + SW registration con visibilitychange
│   ├── index.css                 # estilos globales con variables CSS
│   └── App.css                   # estilos adicionales
│
├── server/                       # Backend Express + Prisma
│   ├── src/
│   │   ├── index.ts              # servidor Express (34 endpoints, 8 routers)
│   │   ├── middleware/
│   │   │   ├── auth.ts           # requireAuth — verificación JWT Supabase
│   │   │   └── errorHandler.ts   # manejo global de errores
│   │   └── routes/
│   │       ├── auth.ts           # 3 endpoints (register, login, logout)
│   │       ├── fincas.ts         # 6 endpoints (CRUD + estanques)
│   │       ├── bitacora.ts       # 3 endpoints (GET list, POST, DELETE)
│   │       ├── especies.ts       # 4 endpoints (CRUD)
│   │       ├── finanzas.ts       # 4 endpoints (CRUD)
│   │       ├── inventario.ts     # 6 endpoints (CRUD productos + movimientos)
│   │       ├── microbiologia.ts  # 4 endpoints (CRUD)
│   │       └── veterinaria.ts    # 4 endpoints (CRUD)
│   ├── prisma/
│   │   ├── schema.prisma         # 10 tablas, 4 enums
│   │   └── migration.sql         # migración SQL única
│   ├── package.json              # 6 runtime, 6 dev deps
│   ├── tsconfig.json
│   └── .env
│
├── tools/
│   ├── server.mjs                # servidor Node local (puerto 3456)
│   └── index.html                # UI del Deploy Panel
├── public/
│   ├── _redirects                # SPA fallback (/* /index.html 200)
│   ├── _headers                  # Cache control headers
│   ├── favicon.svg
│   └── icons.svg                 # sprite sheet de iconos
├── .github/workflows/
│   └── build.yml                 # CI: npm ci + npm run build (sin tests ni deploy)
├── deploy.bat                    # script manual deploy a Netlify
├── dist/                         # build de producción
├── package.json
├── vite.config.ts
└── eslint.config.js
```

---

## Frontend: 15 Rutas

| Ruta | Página | Auth | Persistencia |
|------|--------|:----:|-------------|
| `/login` | Login | No | Supabase Auth |
| `/terminos` | Terminos | No | Estático |
| `/` | Dashboard | Sí | localStorage (read all) |
| `/calc` | Calculator | Sí | Local computation |
| `/bitacora` | Bitacora | Sí | API + localStorage |
| `/zootecnico` | Zootecnico | Sí | localStorage (read) |
| `/especies` | Especies | Sí | API + localStorage |
| `/fincas` | Fincas | Sí | API + localStorage |
| `/parametros` | Parametros | Sí | localStorage |
| `/formulas` | Formulas | Sí | Estático |
| `/micro` | Microbiologia | Sí | API + localStorage |
| `/finanzas` | Finanzas | Sí | API + localStorage |
| `/vet` | Veterinary Wizard | Sí | API + localStorage |
| `/inventario` | Inventario | Sí | API + localStorage |
| `/admin` | Admin | Sí | localStorage + health check |
| `/mapa` | Mapa | Sí | Estático |
| `/medir-estanque` | MedirEstanque | Sí | localStorage (write) |

---

## Backend: 34 Endpoints

| Router | Endpoints | Auth |
|--------|-----------|:----:|
| auth.ts | POST register, POST login, POST logout | No |
| fincas.ts | GET list, POST create, PUT update, DELETE delete, POST estanques, DELETE estanque | JWT |
| bitacora.ts | GET list, POST create, DELETE delete | JWT |
| especies.ts | GET list, POST create, PUT update, DELETE delete | JWT |
| finanzas.ts | GET list, POST create, PUT update, DELETE delete | JWT |
| inventario.ts | GET productos, POST productos, PUT productos, DELETE productos, GET movimientos, POST movimientos | JWT |
| microbiologia.ts | GET list, POST create, PUT update, DELETE delete | JWT |
| veterinaria.ts | GET list, POST create, PUT update, DELETE delete | JWT |

---

## Base de Datos (10 tablas PostgreSQL en Supabase)

- User, Finca, Estanque, Especie, Bitacora, Finanza, Inventario, MovimientoInventario, Microbiologia, Veterinaria
- RLS habilitado con `auth.role() = 'authenticated'`
- 4 enums: Idioma (es/en/pt), Rol (admin/productor/tecnico), TipoMovimiento (entrada/salida), CategoriaProducto (alimento/medicamento/equipo/insumo/otro)
- Sin migraciones formales de Prisma (usa `prisma db push`)
- Sin archivo seed (seed.ts no existe)

---

## Planes y Roles

| Plan | Fincas | Estanques | Export | Roles |
|------|--------|-----------|:------:|-------|
| Free | 1 | 3 | No | productor |
| Pro | ∞ | ∞ | Sí | productor, tecnico |
| Enterprise | ∞ | ∞ | Sí | admin, productor, tecnico |

- Roles: `productor` (default), `tecnico`, `admin`
- Plan/Rol se almacenan en `user_metadata` de Supabase y pueden sobreescribirse vía Admin panel (localStorage)

---

## PWA y Service Worker

- `vite-plugin-pwa` con `injectRegister: null` (registro manual)
- Registro manual en `main.tsx` con detección de `visibilitychange` para actualización en segundo plano
- `controllerchange` event → reload for new SW
- `public/_headers` con `Cache-Control: no-cache` para sw.js y workbox, `immutable` para assets

---

## i18n

- 451 claves de traducción en 3 idiomas (ES/EN/PT)
- 100% de cobertura — las mismas claves existen en los 3 idiomas
- Tipo `TranslationKey` estricto (union de las 451 claves)
- `t()` devuelve el key name como fallback si no encuentra la clave

---

## Tests

- 33 tests vitest en `src/core/__tests__/formulas.test.ts`
- Cubren: calcular (22 tests), calcVolumen* (6 tests), calcRacion (3 tests), calcVolumen dispatch (2 tests)
- Comando: `npm test`

---

## Convenciones de Código

- Sin comentarios en código (salvo excepciones)
- Sin Firebase — localStorage + Supabase
- Core puro TS (src/core/) sin React ni DOM
- Variables UI en español (finca, estanque, bitácora…)
- IDs: `${prefix}_${Date.now()}`
- Estanques: ID compuesto `fincaId||nombre`
- i18n: claves camelCase, toda string visible usa `t("clave")`, agregar en los 3 idiomas
- CSS: `index.css` + `App.css`, variables CSS para tema, prefijos semánticos
- Build: `tsc -b && vite build` debe pasar siempre

---

## Comandos Útiles

```bash
npm run dev              # Frontend dev server
npm run build            # Frontend build (tsc -b && vite build)
npm run test             # 33 vitest tests
cd server && npm run dev # Backend dev server (tsx watch)
cd server && npm run build # Backend tsc build
node tools/server.mjs   # Deploy Panel local (puerto 3456)
```

---

## Credenciales

- Supabase URL: `https://smvjffbeshxcfltjoolm.supabase.co`
- Supabase anon key: `sb_publishable_EQRvreJDv4d-wYZmaMY3Bg_x2D3kM_v`
- DB: `postgresql://postgres:rmA2F4H0Y3FHmgD2@db.smvjffbeshxcfltjoolm.supabase.co:5432/postgres`
- API URL: `https://acuacal21-production.up.railway.app/api`
- Admin Panel PIN: `211203`
- Master Page PIN: `211203`
- Owner email: `acuicolasvientoenpopa@gmail.com`

---

## Discrepancias Conocidas (intencionales)

- `plan.ts` precio Pro = $10/mes, `Terminos.tsx` dice $29/mes — pendiente de unificación
- `deploy.bat` para deploy manual (Netlify drag-and-drop), GitHub Actions solo build (sin deploy automático)
- `prisma/seed.ts` no existe aunque `db:seed` está en package.json
