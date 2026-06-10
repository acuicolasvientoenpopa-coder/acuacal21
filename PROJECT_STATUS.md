# PROJECT STATUS — AcuiCal

> Última actualización: 2026-06-10

---

## Nivel de Madurez

**MVP funcional con backend + auth** — 8 páginas migradas a API, 4 solo localStorage. Sin facturación ni multi-usuario.

**Avance estimado: ~65% del camino a SaaS vendible.**

---

## Funcionalidades Terminadas (100%)

### Core (TypeScript puro)
- Cálculos acuícolas: biomasa, FCR, rentabilidad, ración diaria
- 11 fórmulas de referencia (FAO, Boyd, Timmons)
- 7 especies predefinidas con parámetros energéticos
- 16 monedas con formato locale
- i18n: ~430 claves × 3 idiomas (ES/EN/PT)
- Validadores: calidad de agua, formularios, email
- 10 observaciones clínicas predefinidas
- Tipos de inventario (Producto, Movimiento, Categoría)
- 25 tests vitest (calcular, calcRacion)

### Store (React Context + Hooks)
- AuthProvider (Supabase login/register/logout/sesión persistente)
- LanguageProvider, CurrencyProvider, ThemeProvider
- useLookups() — fincas, especies, estanques
- useInventario() — CRUD productos + movimientos + alertas
- useSaveIndicator() — indicador de guardado

### Backend
- API REST con Express + TypeScript (8 routers, 26 endpoints)
- CRUD auth (register, login, logout)
- CRUD fincas + estanques
- CRUD bitácora con joins (Finca, Estanque, Especie)
- CRUD especies (personales + públicas)
- CRUD finanzas (datos como JSON en descripcion)
- CRUD inventario (productos + movimientos)
- CRUD microbiología (cultivos + medicación)
- CRUD veterinaria (reportes)
- Middleware JWT + error handler

### Base de datos (Supabase PostgreSQL)
- 10 tablas: User, Finca, Estanque, Especie, Bitacora, Finanza, Inventario, MovimientoInventario, Microbiologia, Veterinaria
- RLS con auth.role() = 'authenticated'
- Enums: Idioma (es/en/pt), Rol (admin/productor/tecnico), TipoMovimiento (entrada/salida), CategoriaProducto (alimento/medicamento/equipo/insumo/otro)

### Frontend
- 15 páginas (13 protegidas + Login + Términos)
- AuthProvider con sesión persistente (Supabase)
- Login/Register con checkbox "Acepto Términos"
- ProtectedRoute + logout
- 8 páginas migradas a API con fallback localStorage:
  - Fincas, Bitácora, Especies, Finanzas, Inventario, Microbiología, Veterinaria
- PWA: manifest + service worker + Workbox precaching
- Temas dark/light (persistente)
- Exportación Excel (SheetJS) y PDF (jsPDF)
- GlobalSearch con barra de búsqueda + navegación por teclado
- Tutorial interactivo en 5 pasos
- Sidebar responsive + hamburger menu
- Toast notifications
- Mapa de Arquitectura (vista visual del sistema)

### Infraestructura
- Frontend en Netlify (SPA con _redirects)
- Backend en Railway (Node + Express)
- Base de datos en Supabase PostgreSQL
- SMTP Resend configurado (pendiente dominio verificado)
- Build `tsc -b && vite build` pasa

---

## Funcionalidades Pendientes para MVP Vendible

### Facturación (prioridad crítica)
- Integración Lemon Squeezy (Stripe no disponible en Costa Rica)
- Planes: Free (1 finca, 3 estanques), Professional ($29/mes), Enterprise ($99/mes)
- Portal de cliente
- Webhooks para cambios de suscripción

### Dominio
- Comprar dominio (~$8/yr Cloudflare)
- Configurar DNS para frontend y backend
- Verificar dominio en Resend para emails transaccionales

### Páginas solo localStorage → API
- Dashboard (resumen global)
- Zootécnico (seguimiento con gráficos)
- Parametros (WQ overrides)

### Sync offline
- Cola de cambios cuando offline
- Reconciliación al reconectar
- Indicador de sync

### Multi-usuario
- Roles y permisos (admin, productor, técnico)
- Aislamiento de datos por tenant
- Colaboración en fincas compartidas

### CI/CD
- GitHub Actions: lint + typecheck + test + build
- Deploy automático a Netlify + Railway

### Code splitting
- Dividir bundle >500 kB
- Lazy loading de páginas

---

## Riesgos Actuales

### Técnicos
| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Sin facturación | No se puede vender | Alta | Priorizar Lemon Squeezy |
| Sin tests backend | Regresiones en API | Media | Agregar tests de integración |
| Sin CI/CD | Deploys manuales frágiles | Media | Configurar GitHub Actions |
| localStorage imagen base64 | Cuota llena (~5MB) | Baja | Limpiar o comprimir imágenes |
| Sin code splitting | Bundle grande (~1.5MB) | Baja | Lazy loading cuando escalen páginas |

### Comerciales
| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Sin validación con clientes reales | Producto no deseado | Alta | Entrevistas con productores |
| Stripe no disponible en CR | Bloqueante | Alta | Lemon Squeezy como alternativa |
| Competencia consolidada | Barrera de entrada | Media | Diferenciarse en nicho + precio offline |

---

## Próximos Pasos Inmediatos

1. ⬅️ Configurar Lemon Squeezy para pagos
2. Comprar dominio + verificar en Resend
3. Migrar Dashboard, Zootécnico, Parametros a API
4. GitHub Actions CI/CD
5. Multi-usuario y roles
