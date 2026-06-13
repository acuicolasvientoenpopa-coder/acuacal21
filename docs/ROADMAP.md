# ROADMAP.md — AcuiCal

> Basado en el estado actual del código fuente. Fecha: 2026-06-13.
> No incluye planes hipotéticos ni features no implementadas.

---

## Estado Actual

### Frontend — 21 funcionalidades implementadas

| Funcionalidad | Ruta | Persistencia | Estado |
|--------------|------|-------------|:------:|
| Login/Register | /login | Supabase Auth | ✅ Producción |
| Password Reset | /login | Supabase Auth | ✅ Producción |
| Dashboard | / | localStorage (read) | ✅ Producción |
| Calculator | /calc | Local computation | ✅ Producción |
| Bitácora | /bitacora | API + localStorage | ✅ Producción |
| Zootécnico | /zootecnico | localStorage | ✅ Producción |
| Especies | /especies | API + localStorage | ✅ Producción |
| Fincas+Estanques | /fincas | API + localStorage | ✅ Producción |
| Parámetros WQ | /parametros | localStorage | ✅ Producción |
| Referencias | /formulas | Estático | ✅ Producción |
| Microbiología | /micro | API + localStorage | ✅ Producción |
| Finanzas | /finanzas | API + localStorage | ✅ Producción |
| Inventario | /inventario | API + localStorage | ✅ Producción |
| Veterinaria | /vet | API + localStorage | ✅ Producción |
| Admin Panel | /admin | localStorage + health | ✅ Producción |
| Medir Estanque | /medir-estanque | localStorage | ✅ Producción |
| Mapa Arq. | /mapa | Estático | ✅ Producción |
| i18n ES/EN/PT | global | Context | ✅ Producción |
| Tema Dark/Light | global | localStorage | ✅ Producción |
| PWA | global | Service Worker | ✅ Producción |
| Export PDF/Excel | global | jsPDF+SheetJS | ✅ Producción |

### Backend — 34 endpoints en 8 routers

| Router | Endpoints | Estado |
|--------|-----------|:------:|
| Auth | 3 (register/login/logout) | ✅ Producción |
| Fincas | 6 (CRUD + estanques) | ✅ Producción |
| Bitácora | 3 (list/create/delete) | ✅ Producción |
| Especies | 4 (CRUD) | ✅ Producción |
| Finanzas | 4 (CRUD) | ✅ Producción |
| Inventario | 6 (CRUD productos + movimientos) | ✅ Producción |
| Microbiología | 4 (CRUD) | ✅ Producción |
| Veterinaria | 4 (CRUD) | ✅ Producción |

### Infraestructura

| Componente | Estado | Detalle |
|-----------|:------:|---------|
| Frontend Netlify | ✅ | Manual deploy o GitHub push |
| Backend Railway | ✅ | Auto-deploy desde GitHub |
| Supabase DB | ✅ | PostgreSQL + RLS |
| Supabase Auth | ✅ | JWT + persistSession |
| PWA | ✅ | SW + Workbox + auto-update |
| CI (GitHub Actions) | ✅ | Build only (sin tests/deploy) |
| Deploy Panel local | ✅ | tools/server.mjs (puerto 3456) |

---

## Pendientes Técnicos

### Bugs / Issues Conocidos

| Issue | Prioridad | Detalle |
|-------|:---------:|---------|
| Precios inconsistentes | Media | `plan.ts` dice Pro=$10/mes, `Terminos.tsx` dice $29/mes |
| seed.ts no existe | Baja | package.json server referencia `db:seed` pero no existe |
| Zod declarado no usado | Baja | Server incluye zod en deps pero no lo importa |
| zootecnico y param solo localStorage | Media | Sin API, pérdida de datos si se borra localStorage |
| GeoPond.tsx huérfano | Baja | Reemplazado por MedirEstanque, no enrutado |

### Deuda Técnica

| Item | Área | Descripción |
|------|------|-------------|
| Sin middleware compartido | Frontend | `services/index.ts` vacío, fetch repetido en cada página |
| Sin store barrel | Frontend | `store/index.ts` vacío, imports directos por archivo |
| Sin rate limiting | Backend | Servidor sin protección contra abusos |
| CORS permisivo | Backend | `cors({ origin: "*" })` en producción |
| Sin validación Zod | Backend | zod en deps pero handlers no validan schemas |
| Sin logout server real | Backend | Solo `supabase.auth.signOut()`, sin invalidación de token |
| DB password en .env | Seguridad | Contraseña de DB en texto plano en server/.env |
| RLS no verificado | DB | Políticas RLS existen pero no hay tests |
| Chunk grande | Frontend | >500 kB chunk sin code splitting |

### Funcionalidades Faltantes para MVP Vendible

| Funcionalidad | Estado | Notas |
|---------------|:------:|-------|
| Sistema de pagos | ❌ | Sin implementar. ONVO Pay mencionado en Terminos |
| Multi-usuario (roles) | 🟡 | Plan/rol definidos en código pero sin gating real |
| Sync offline bidireccional | ❌ | Sin cola de cambios ni reconciliación |
| Dashboard con API | ❌ | Solo localStorage |
| Zootécnico con API | ❌ | Solo localStorage |
| Parámetros con API | ❌ | Solo localStorage |
| Code splitting | ❌ | Chunk >500 kB |
| CI/CD completo | 🟡 | Solo build, sin tests, lint ni deploy |
| Tests de backend | ❌ | 0 tests |
| Tests E2E | ❌ | 0 tests |

---

## Próximos Pasos (Priorizados)

### P0 — Crítico para producción confiable

1. Migrar Dashboard, Zootécnico y Parámetros a API (persistencia cloud)
2. Implementar rate limiting en backend
3. Restringir CORS a origen específico
4. Agregar validación Zod en handlers del backend
5. Unificar precios en plan.ts y Terminos.tsx

### P1 — Importante para MVP

6. Integrar ONVO Pay para pagos (planes Free/Pro/Enterprise)
7. Implementar gating de roles (admin/tecnico/productor)
8. Cache headers correctos en Netlify (assets + SW)
9. Agregar lint + test al CI de GitHub Actions

### P2 — Calidad de vida

10. Code splitting con `React.lazy()` + Suspense
11. Eliminar archivos huérfanos (GeoPond.tsx, services/index.ts)
12. Tests de backend con Vitest + supertest
13. Implementar `prisma/seed.ts`

### P3 — Visión

14. Sistema de suscripciones con ONVO Pay webhooks
15. Sync offline bidireccional con cola de cambios
16. Multi-tenant completo con roles funcionales
17. Tests E2E con Playwright
18. CI/CD completo con deploy automático a Netlify
