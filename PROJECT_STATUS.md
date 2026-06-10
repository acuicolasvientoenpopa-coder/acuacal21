# PROJECT STATUS — AcuiCal

> Última actualización: 2026-06-09

---

## Nivel de Madurez

**Prototipo funcional / MVP técnico** — No es un producto vendible sin backend, auth, multiusuario ni billing.

**Avance estimado: ~55% del camino a SaaS vendible.**

---

## Funcionalidades Terminadas (100%)

### Core (TypeScript puro)
- Cálculos acuícolas: biomasa, FCR, rentabilidad, ración diaria
- 11 fórmulas de referencia (FAO, Boyd, Timmons, etc.)
- 7 especies predefinidas con parámetros energéticos
- 16 monedas con formato locale
- i18n: ~430 claves × 3 idiomas (ES/EN/PT)
- Validadores: calidad de agua, formularios, email
- 10 observaciones clínicas predefinidas
- Tipos de inventario (Producto, Movimiento, Categoría)

### Store (React Context + Hooks)
- LanguageProvider, CurrencyProvider, ThemeProvider
- useLookups() — fincas, especies, estanques
- useInventario() — CRUD productos + movimientos + alertas
- useSaveIndicator() — indicador de guardado

### Páginas (13 funcionales)
- Dashboard, Calculator, Bitácora, Zootécnico, Especies, Fincas
- Parámetros, Fórmulas de Referencia, Microbiología
- Finanzas, Veterinary Wizard, Inventario, Master Panel

### Backend
- [x] API REST (Express + TypeScript, compila y funciona)
- [x] Base de datos PostgreSQL en Supabase (10 tablas)
- [x] Autenticación JWT (register, login, logout)
- [x] Rutas protegidas con middleware
- [x] CRUD fincas + estanques vía API
- [x] CRUD bitácora vía API
- [x] CRUD especies vía API
- [ ] Migrar resto de páginas a API (Dashboard, Calculator, etc.)
- [ ] Sincronización offline bidireccional

### Frontend
- [x] AuthProvider con sesión persistente
- [x] Página de Login/Register
- [x] Rutas protegidas
- [x] Botón logout en Layout
- [x] Fincas migrado a API (con fallback localStorage)
- [ ] Migrar resto de páginas a API

### Infraestructura
- PWA: manifest + service worker + Workbox precaching
- Temas: dark/light, persistente
- Rutas con React Router (14 rutas)
- Exportación a Excel (SheetJS/xlsx) y PDF (jsPDF)
- GlobalSearch con barra de búsqueda + navegación por teclado
- Tutorial interactivo en 5 pasos
- Mapa de Arquitectura (vista visual del sistema)
- Indicador de guardado + toast notifications
- Sidebar responsive + hamburger menu
- Botón de instalación PWA

---

## Funcionalidades en Desarrollo

*(Ninguna actualmente)*

---

## Funcionalidades Pendientes para MVP Vendible

### Backend (prioridad crítica)
- API REST con Node.js + Express
- Base de datos PostgreSQL con Prisma ORM
- Autenticación JWT (registro + login + recuperación)
- Modelo de datos relacional (usuarios, fincas, bitácoras, etc.)

### Multi-usuario
- Roles y permisos (admin, productor, técnico)
- Aislamiento de datos por tenant
- Colaboración en fincas compartidas

### Suscripciones y Facturación
- Integración con Stripe
- Planes: Free, Professional, Enterprise
- Facturación mensual/anual
- Portal de cliente

### Sincronización Offline
- localStorage → backend bidireccional
- Conflictos y resolución
- Indicador de sync

### Testing
- Tests unitarios (vitest) para core
- Tests de integración para API
- Tests e2e (Playwright o Cypress)

### CI/CD
- GitHub Actions: lint + typecheck + test + build
- Despliegue automático

---

## Riesgos Actuales

### Técnicos
| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Sin backend ni base de datos | No se puede vender SaaS | Alta | Priorizar backend en fase 1 |
| Sin tests | Regresiones al escalar | Alta | Empezar con tests del core |
| Sin CI/CD | Despliegues manuales frágiles | Media | Configurar GitHub Actions |
| Código huérfano (Firebase en validators.ts) | Confusión | Baja | Limpiar en refactor |
| Sin tipos estrictos en rutas | Errores en navegación | Baja | Tipar con enums/routes constantes |

### Comerciales
| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Sin validación con clientes reales | Producto no deseado | Alta | Entrevistas con productores |
| Sin precios definidos | No se puede vender | Media | Definir pricing en Business Plan |
| Competencia consolidada (XpertSea, etc.) | Barrera de entrada | Media | Diferenciarse en nicho + precio |
| Sin estrategia de marketing | 0 clientes | Alta | Plan de growth desde el día 1 |

---

## Próximos Pasos Inmediatos

1. ✅ Tests unitarios para `core/formulas.ts`
2. ✅ Base de datos PostgreSQL en Supabase
3. ✅ API REST (Express + Supabase)
4. ✅ Autenticación JWT
5. ✅ Términos y Condiciones (TERMS.md)
6. ✅ Migración piloto: Fincas a API
7. ⬅️ Migrar las demás páginas a API (Dashboard, Calculator, Bitácora, etc.)
8. Subir frontend `dist/` al subdominio `acuicolascalculator.qzz.io`
9. Desplegar backend en Railway/Hetzner
10. Agregar planes de suscripción (Stripe)
