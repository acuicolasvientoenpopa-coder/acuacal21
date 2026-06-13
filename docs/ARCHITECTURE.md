# ARCHITECTURE.md — AcuiCal

> Basado exclusivamente en el código fuente actual.
> Fecha: 2026-06-13.

---

## 1. Stack Tecnológico

```
Frontend (Netlify)
├── React 19 + TypeScript 6.0.2
├── Vite 8 + @vitejs/plugin-react 6
├── react-router-dom 7 (React Router v7)
├── @supabase/supabase-js 2 (Auth + DB client)
├── leaflet 1.9 + react-leaflet 5 (mapa)
├── jspdf 4 (exportación PDF)
├── xlsx 0.18 (exportación Excel)
├── vite-plugin-pwa 1.3 (PWA + Service Worker)
└── vitest 4 (testing)

Backend (Railway)
├── Express 4.21 + TypeScript 5.8
├── Prisma 6 + @prisma/client 6
├── @supabase/supabase-js 2 (JWT verification)
├── helmet 8 + cors 2
├── zod 3 (declarado pero no usado en server/)
└── tsx 4 (dev server)

Base de datos
├── PostgreSQL (Supabase)
└── Prisma schema + migration.sql
```

---

## 2. Frontend — Layers

### 2.1 Core Layer (`src/core/`)
TypeScript puro sin dependencias del DOM ni React.

| Módulo | Responsabilidad |
|--------|----------------|
| `formulas.ts` | Cálculos: biomasa, FCR, SGR, ración, volúmenes (6 formas), energía, rentabilidad |
| `species-defaults.ts` | 7 especies predefinidas con parámetros completos + defaults energéticos |
| `currencies.ts` | 16 monedas con símbolo, código, locale para Intl.NumberFormat |
| `i18n.ts` | 451 claves × 3 idiomas, tipos TranslationKey e Idioma |
| `validators.ts` | Validación calidad de agua, formulario bitácora, email |
| `observations.ts` | 10 observaciones clínicas predefinidas |
| `inventario-types.ts` | Tipos Producto, Movimiento, Categoría |
| `plan.ts` | Planes (free/pro/enterprise), roles, límites, helpers |

**Salida:** Ninguna (no emite, solo exporta tipos y funciones).

### 2.2 Store Layer (`src/store/`)
React Context para estado global.

| Provider/Context | Estado | Persistencia |
|-----------------|--------|-------------|
| `AuthProvider` | user, token, loading, plan, rol | Supabase session (localStorage) |
| `LanguageProvider` | lang (es/en/pt) | — (default es) |
| `CurrencyProvider` | code (CRC/USD/EUR/...) | localStorage `aquacalc_currency` |
| `ThemeProvider` | theme (dark/light) | localStorage `aquacalc_theme` |

| Hook | Fuente de datos |
|------|----------------|
| `useLookups()` | localStorage (`aquacalc_custom_species`, `aquacalc_fincas`) + ESPECIES_DEFAULT |
| `useInventario()` | localStorage (`aquacalc_inventario_productos`, `aquacalc_inventario_movimientos`) |
| `useSaveIndicator(deps)` | Estado local (saving/saved/"") |

### 2.3 Component Layer (`src/components/`)
Componentes reutilizables sin lógica de página.

- `Layout` — Header + sidebar + main outlet + logout
- `ToastContainer` + `toast()` — notificaciones globales
- `GlobalSearch` — búsqueda full-text en localStorage
- `Tutorial` — overlay interactivo de 5 pasos
- `ConfirmModal` — diálogo de confirmación genérico
- `ProfileModal` + `useProfile` + `getProfile` — perfil de usuario

### 2.4 Page Layer (`src/pages/`)
18 archivos, 15 rutas activas en App.tsx.

- 2 públicas: Login, Terminos
- 13 protegidas (dentro de Layout): Dashboard, Calculator, Bitacora, Zootecnico, Especies, Fincas, Parametros, Formulas, Microbiologia, Finanzas, Administrador, Inventario, VeterinaryWizard, MedirEstanque, Mapa
- 2 huérfanas (no enrutadas): MasterPage (acceso por 5-clicks logo), GeoPond (reemplazado)

### 2.5 Data Layer (`src/data/`)
- `navLinks.ts` — 12 enlaces de navegación con ruta, clave i18n, emoji, descripción tutorial
- `referencias.ts` — 33 referencias técnicas en 5 secciones (fórmulas, especies, agua, energía, diagnósticos)

### 2.6 Util Layer (`src/utils/`)
- `pdf.ts` — 6 funciones de exportación (PDF con jsPDF, Excel con SheetJS)
- `debugData.ts` — 6 generadores de datos de prueba para Admin/MasterPage

---

## 3. Backend — Capas

### 3.1 Entry Point (`server/src/index.ts`)
```typescript
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }))
app.use(express.json())

// Endpoints
GET /api/health → { status: "ok", version: "1.0.0" }

// Routers (8)
/api/auth     → authRouter     (sin auth middleware)
/api/fincas   → fincasRouter   (con requireAuth)
/api/bitacora → bitacoraRouter (con requireAuth)
/api/especies → especiesRouter (con requireAuth)
/api/finanzas → finanzasRouter (con requireAuth)
/api/inventario → inventarioRouter (con requireAuth)
/api/microbiologia → microbiologiaRouter (con requireAuth)
/api/veterinaria  → veterinariaRouter (con requireAuth)

// Error handler
app.use(errorHandler)
```

### 3.2 Auth Middleware (`server/src/middleware/auth.ts`)
- Extrae token Bearer del header Authorization
- Crea cliente Supabase autenticado con el token
- Verifica con `supabase.auth.getUser(token)`
- Inyecta `req.userId` y `req.supabase` en la request

### 3.3 Error Handler (`server/src/middleware/errorHandler.ts`)
- Captura errores lanzados con `statusCode`
- Retorna `{ error: mensaje }` con código HTTP apropiado
- En development incluye stack trace

### 3.4 Route Handlers
Todos los handlers protegidos siguen el patrón:
```typescript
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const data = await req.supabase!
    .from("tabla")
    .select("*")
    .eq("userId", req.userId)
  res.json(data)
})
```

---

## 4. Base de Datos

### 4.1 Modelos (10 tablas)

```
User            → id, email (unique), nombre, idioma, rol, timestamps
  └─→ Finca    → id, nombre, ubicacion?, userId (FK → User)
       └─→ Estanque → id, nombre, fincaId (FK → Finca)
       └─→ Bitacora → id, fecha, userId, fincaId, estanqueId?, especieId?, params WQ
       └─→ Finanza → id, tipo, monto, descripcion?, fecha, fincaId, userId
       └─→ Inventario → id, nombre, categoria, cantidad, minimo, precio?, fincaId, userId
            └─→ MovimientoInventario → id, tipo, cantidad, motivo?, fecha, productoId (FK → Inventario)
       └─→ Microbiologia → id, fecha, resultado, notas?, fincaId, userId
       └─→ Veterinaria → id, fecha, diagnostico, riesgo, notas?, fincaId, userId

Especie         → id, nombre, nombreCientifico?, userId?, esPersonal, parametros (Json?)
```

### 4.2 Enums (4)
- Idioma: es, en, pt
- Rol: admin, productor, tecnico
- TipoMovimiento: entrada, salida
- CategoriaProducto: alimento, medicamento, equipo, insumo, otro

### 4.3 Migraciones
- No usa Prisma Migrate (no hay carpeta `migrations/`)
- Usa `prisma db push` para sincronizar esquema
- `migration.sql` contiene el DDL completo como referencia

---

## 5. Flujo de Datos

### 5.1 Estrategia de Persistencia

| Tipo | Descripción | Páginas |
|------|-------------|---------|
| API primaria + localStorage fallback | Intenta API primero; si falla, usa/cachea en localStorage | Bitacora, Especies, Fincas, Microbiologia, Finanzas, Inventario, Vet Wizard |
| Solo localStorage | Lectura/escritura directa a localStorage | Dashboard, Zootecnico, Parametros, Admin, MasterPage, MedirEstanque |
| Solo API (Supabase Auth) | Autenticación | Login, Register, Reset Password |
| Estático | Sin persistencia | Formulas, Terminos, Mapa |
| Cálculo local | Sin persistencia, solo computación | Calculator |

### 5.2 localStorage Keys

| Key | Contenido |
|-----|-----------|
| `aquacalc_bitacora` | Array de registros de bitácora |
| `aquacalc_cultivos` | Array de cultivos microbiológicos |
| `aquacalc_medicacion` | Array de registros de medicación |
| `aquacalc_fincas` | Array de fincas con estanques anidados |
| `aquacalc_custom_species` | Array de especies personalizadas |
| `aquacalc_params_overrides` | Overrides de parámetros por especie |
| `aquacalc_finanzas` | Array de registros financieros |
| `aquacalc_inventario_productos` | Array de productos |
| `aquacalc_inventario_movimientos` | Array de movimientos |
| `aquacalc_vet_reports` | Array de reportes veterinarios |
| `aquacalc_geo_dimensions` | Dimensiones medidas para calculadora |
| `aquacalc_profile` | Perfil de usuario (nombre, email) |
| `aquacalc_theme` | Tema (dark/light) |
| `aquacalc_currency` | Código de moneda |
| `aquacalc_admin_unlocked` | Estado de desbloqueo del Admin panel |
| `aquacalc_plan_override` | Override de plan para testing |
| `aquacalc_rol_override` | Override de rol para testing |
| `aquacalc_tutorial_done` | Flag de tutorial completado |

### 5.3 API Communication
- Todas las llamadas API usan `fetch()` nativo
- Header común: `Authorization: Bearer <token>`
- URL base: `https://acuacal21-production.up.railway.app/api`
- Sin cliente HTTP compartido (no axios, sin `services/index.ts`)

---

## 6. Routing (Frontend)

```
<BrowserRouter>
  <AuthProvider>
    <LanguageProvider>
      <CurrencyProvider>
        <ThemeProvider>
          <Routes>
            /login           → Login (público)
            /terminos        → Terminos (público)
            <Layout>         → Sidebar + Header + Outlet
              /              → Dashboard
              /calc          → Calculator
              /bitacora      → Bitacora
              /zootecnico    → Zootecnico
              /especies      → Especies
              /fincas        → Fincas
              /parametros    → Parametros
              /formulas      → Formulas
              /micro         → Microbiologia
              /finanzas      → Finanzas
              /vet           → VeterinaryReportWizard
              /inventario    → Inventario
              /admin         → Admin
              /mapa          → Mapa
              /medir-estanque → MedirEstanque
            </Layout>
          </Routes>
          <ToastContainer />
        </ThemeProvider>
      </CurrencyProvider>
    </LanguageProvider>
  </AuthProvider>
</BrowserRouter>
```

ProtectedRoute redirige a `/login` si no hay usuario autenticado.

---

## 7. PWA y Service Worker

- **Plugin**: `vite-plugin-pwa` con `registerType: 'autoUpdate'` e `injectRegister: null`
- **Registro manual** en `main.tsx`:
  - Escucha `controllerchange` para recargar cuando hay nuevo SW
  - Registra `/sw.js` con scope `/`
  - En `visibilitychange` (cuando la pestaña se vuelve visible) llama a `reg.update()`
- **Headers**: `public/_headers` con caché controlado (no-cache para SW, inmutable para assets)
- **Redirects**: `public/_redirects` con `/* /index.html 200`

---

## 8. Infraestructura y Deploy

| Componente | Proveedor | Método |
|-----------|-----------|--------|
| Frontend | Netlify | Manual (deploy.bat arrastrar dist/) o GitHub push |
| Backend | Railway | Auto-deploy desde GitHub |
| DB | Supabase PostgreSQL | Directa (prisma db push) |
| CI | GitHub Actions | `npm ci && npm run build` en push a main |
| Deploy local | tools/server.mjs (puerto 3456) | Build + commit + push |

---

## 9. Archivos Huérfanos

| Archivo | Estado |
|---------|--------|
| `src/pages/GeoPond.tsx` | Reemplazado por MedirEstanque, no importado, no enrutado |
| `src/pages/MasterPage.tsx` | Reemplazado por Admin, no enrutado (acceso por 5-clicks logo) |
| `src/services/index.ts` | Vacío (export {}) |
| `src/store/index.ts` | Vacío (export {}) |
| `server/prisma/seed.ts` | No existe (package.json lo referencia) |
