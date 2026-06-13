# PROJECT STATUS — AcuiCal

> Última actualización: 2026-06-12

---

## Nivel de Madurez

**MVP con seguridad, calidad, pagos ONVO Pay, CI/CD, Admin Panel y UI/UX refinada** — Backend con rate limiting, Zod, helmet. Frontend con code splitting nativo (pdf.js separado). Integración ONVO Pay lista (requiere config manual). 10 páginas en API. Admin Panel con 5 tabs. Todos los módulos offline-first con híbrido API + localStorage.

**Avance estimado: ~90% del camino a SaaS vendible.**

---

## Funcionalidades Terminadas (100%)

### Core (TypeScript puro)
- Cálculos acuícolas: biomasa, FCR, rentabilidad, ración diaria
- 11 fórmulas de referencia (FAO, Boyd, Timmons)
- 7 especies predefinidas con parámetros energéticos
- 16 monedas con formato locale
- i18n: ~460+ claves × 3 idiomas (ES/EN/PT)
- Validadores: calidad de agua, formularios, email
- 10 observaciones clínicas predefinidas
- Tipos de inventario (Producto, Movimiento, Categoría)
- Plan gates + precios (Free/Pro/Enterprise)
- 33 tests vitest (calcular, calcRacion, plan)

### Store (React Context + Hooks)
- AuthProvider (Supabase login/register/logout/sesión persistente)
- LanguageProvider (idioma persistido en localStorage), CurrencyProvider, ThemeProvider
- useLookups() — fincas, especies, estanques
- useInventario() — CRUD productos + movimientos + alertas
- useSaveIndicator() — indicador de guardado

### Backend
- API REST con Express + TypeScript (14 routers, 30+ endpoints)
- CRUD auth (register, login, logout)
- CRUD fincas + estanques (con PUT estanque, validación roles gestor/admin)
- CRUD bitácora con joins (Finca, Estanque, Especie) + PUT
- CRUD especies (personales + públicas)
- CRUD finanzas (datos como JSON en descripcion)
- CRUD inventario (productos + movimientos)
- CRUD microbiología (cultivos + medicación)
- CRUD veterinaria (reportes)
- **Admin API**: GET /api/admin/users, /stats, /subscriptions (verifica rol "admin" via Supabase Admin API)
- **Pagos ONVO Pay**: checkout, webhook, subscription status, **POST /api/pagos/rol** (cambio de rol)
- **Webhook**: updateUserPlan() con merge de user_metadata (no sobrescribe)
- **Seguridad**: CORS origen específico, helmet CSP, rate limiting (100 global, 10 auth), Zod validation en todos los POST/PUT, sin spread de req.body
- Middleware JWT + error handler

### Base de datos (Supabase PostgreSQL)
- 11 tablas: User, Finca, Estanque, Especie, Bitacora, Finanza, Inventario, MovimientoInventario, Microbiologia, Veterinaria, **Subscription**
- RLS con auth.role() = 'authenticated'
- Enums: Idioma (es/en/pt), Rol (admin/gestor/tecnico), TipoMovimiento (entrada/salida), CategoriaProducto (alimento/medicamento/equipo/insumo/otro)
- Índices SQL generados (11 índices)
- RLS policies SQL generadas

### Frontend
- 16 páginas (14 protegidas + Login + Términos)
- AuthProvider con sesión persistente (Supabase)
- Login/Register con checkbox "Acepto Términos", step indicators en registro, i18n completo, loading states
- ProtectedRoute + logout
- 10 páginas migradas a API con fallback localStorage:
  - Fincas, Bitácora, Especies, Finanzas, Inventario, Microbiología, Veterinaria, **Dashboard**, **Zootécnico**, **Parámetros**
- PWA: manifest + service worker + Workbox precaching + splash screen + icons SVG + shortcuts
- Temas dark/light (persistente)
- Exportación Excel (exceljs — 0 vulnerabilidades) y PDF (jsPDF)
- GlobalSearch con barra de búsqueda + navegación por teclado
- Tutorial interactivo en 5 pasos
- Sidebar responsive + hamburger menu
- Toast notifications
- Mapa de Arquitectura (vista visual del sistema)
- **ErrorBoundary** con captura de errores React
- **Lazy loading** + Suspense en todas las páginas (code splitting nativo)
- **Loading states** en todos los formularios CRUD
- **Página Planes** con cards Free/Pro/Enterprise + selector de rol para planes pagos + botón upgrade
- **Gating de features** por plan via `plan.ts` + `user.user_metadata`
- **UI/UX refinada**: cards con hover lift + glow, dash-card con gradiente top border, Dashboard reordenado por importancia
- **Admin Panel** rediseñado: 5 tabs (Overview con health checks, Usuarios, Suscripciones, Sistema con sync queue + network log, Herramientas con debug data + localStorage editor)

### Infraestructura
- Frontend en Cloudflare Pages (SPA con _redirects)
- Backend en Railway (Node + Express)
- Base de datos en Supabase PostgreSQL
- SMTP Resend configurado (pendiente dominio verificado)
- Build `tsc -b && vite build` pasa (0 errors)
- GitHub Actions CI: 2 jobs (frontend + server), typecheck + test + build
- PostHog analytics (desactivado por defecto)

---

## Funcionalidades Pendientes para MVP Vendible

### Configuración ONVO Pay (crítica - código listo, falta config manual)
- [ ] Crear productos/precios en dashboard ONVO Pay
- [ ] Configurar webhook en ONVO Pay
- [ ] Copiar API key + webhook secret + price IDs a `server/.env`
- [ ] Probar flujo completo checkout → webhook → upgrade

### Dominio
- [x] Comprar dominio — ✅ acuical.com
- [x] Configurar DNS (acuical.com → landing, app.acuical.com → app) — ✅
- [x] Verificar dominio en Resend para emails transaccionales — ✅ acuical.com verificado
- [x] Activar confirmación de email en Supabase Auth — ✅ SMTP + confirm sign up ON

### Base de datos (pendiente ejecución)
- [ ] Ejecutar RLS policies en Supabase SQL Editor
- [ ] Ejecutar índices SQL en Supabase SQL Editor
- [ ] Rotar DB password en Supabase (expuesta en commits anteriores)

### Páginas solo localStorage → API
- [x] Dashboard
- [x] Zootécnico (seguimiento con gráficos)
- [x] Parametros (WQ overrides)

### Sync offline
- [ ] Cola de cambios cuando offline
- [ ] Reconciliación al reconectar
- [ ] Indicador de sync

### Multi-usuario
- [x] Roles y permisos (admin, gestor, técnico) — implementado
- [ ] Aislamiento de datos por tenant
- [ ] Colaboración en fincas compartidas

### Mejoras post-MVP
- [ ] Activar confirmación de email en Supabase Auth (requiere dominio verificado en Resend)
- [ ] Migrar xlsx → exceljs (✅ completado)
- [ ] CI/CD: GitHub Actions typecheck + test + build (✅ completado)

---

## Riesgos Actuales

### Técnicos
| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| ONVO Pay no probado en producción | Pagos rotos al lanzar | Media | Probar sandbox primero |
| DB password expuesta en git | Acceso no autorizado a DB | Alta | Rotar password ahora |
| Sin tests backend | Regresiones en API | Media | Agregar tests de integración |
| localStorage imagen base64 | Cuota llena (~5MB) | Baja | Limpiar o comprimir imágenes |
| Bundle grande (pdf.js) | Carga lenta | Baja | Lazy loading ya implementado |

### Comerciales
| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Sin validación con clientes reales | Producto no deseado | Alta | Entrevistas con productores |
| ONVO Pay no aceptado por clientes | Barrera de pago | Media | Ofrecer transferencia bancaria |
| Competencia consolidada | Barrera de entrada | Media | Diferenciarse en nicho + precio offline |

---

## Próximos Pasos Inmediatos

1. ⬅️ Configurar ONVO Pay (productos, webhook, keys)
2. Ejecutar RLS policies + índices + rotar DB password en Supabase
3. Comprar dominio + verificar en Resend
4. Activar confirmación de email en Supabase Auth
5. ~~Migrar Zootécnico y Parámetros a API~~ ✅
6. Desplegar cambios a Railway + Cloudflare Pages
