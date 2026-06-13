# ROADMAP — AcuiCal

> Hoja de ruta del producto. Actualizado: 2026-06-10.

---

## Fase 0 — Prototipo Técnico (✅ Completado)

**Objetivo**: Demostrar que la arquitectura funciona y el producto resuelve un problema real.

### Funciones
- [x] Calculadora acuícola (biomasa, FCR, rentabilidad, ración)
- [x] Bitácora de biometría con validación WQ
- [x] Seguimiento zootécnico con gráficos
- [x] CRUD de especies, fincas, parámetros, fórmulas
- [x] Microbiología, Finanzas, Wizard Veterinario
- [x] Inventario con alertas de stock
- [x] Dashboard con resumen global
- [x] GlobalSearch + Tutorial + Temas + PWA
- [x] i18n ES/EN/PT
- [x] Exportación PDF/Excel
- [x] Mapa de Arquitectura
- [x] Tests unitarios core (25 tests vitest)

---

## Fase 1 — MVP Vendible (⬅️ AHORA — ~70% completado)

**Objetivo**: Tener algo que un productor acuícola pueda pagar y usar solo.

### Completado
- [x] Backend API REST (Express + TypeScript, 8 routers)
- [x] Base de datos PostgreSQL (Prisma ORM, Supabase, 10 tablas)
- [x] Autenticación JWT (registro, login, logout, sesión persistente)
- [x] CRUD fincas + estanques vía API
- [x] CRUD bitácora vía API
- [x] CRUD especies vía API
- [x] CRUD finanzas vía API
- [x] CRUD inventario vía API
- [x] CRUD microbiología vía API
- [x] CRUD veterinaria vía API
- [x] Frontend deployado en Cloudflare Pages
- [x] Backend deployado en Railway
- [x] Página Términos y Condiciones
- [x] Checkbox "Acepto Términos" en registro
- [x] SMTP Resend configurado
- [x] 8 páginas migradas a API (con localStorage fallback)

### Pendiente
- [ ] Integración Lemon Squeezy (Stripe no disponible en Costa Rica)
- [ ] Dominio propio (~$8/yr Cloudflare)
- [ ] Migrar Dashboard, Zootécnico, Parametros a API
- [ ] Sincronización offline básica (localStorage → API)
- [ ] CI/CD básico (GitHub Actions: typecheck + test + build)
- [ ] Code splitting (bundle >500 kB)

---

## Fase 2 — Primer Cliente Pagador

**Objetivo**: Conseguir 1 productor real dispuesto a pagar.

### Requerido
- [ ] Plan Professional ($20/mes): fincas ilimitadas, multi-estanque, exportaciones
- [ ] Lemon Squeezy Checkout + Webhooks
- [ ] Portal de cliente (datos de facturación, historial de pagos)
- [ ] Onboarding guiado para nuevo usuario
- [ ] Soporte básico (email + docs)
- [ ] Encuesta NPS temprana

---

## Fase 3 — 10 Clientes

**Objetivo**: Escalar a 10 clientes pagadores con soporte activo.

### Requerido
- [ ] Multi-usuario por finca (técnico + productor)
- [ ] Roles y permisos
- [ ] Dashboard por finca
- [ ] Reportes PDF descargables (bitácora, zootécnico, finanzas)
- [ ] Feedback loop: encuestas + feature requests
- [ ] Mejoras UX basadas en feedback real

---

## Fases 4-8

Ver VISION.md para el plan detallado de escalamiento hasta 10,000 clientes y el ecosistema completo (AcuiGen, trazabilidad, NFC, etc.).

---

## Riesgos Clave de Fase 1

- Stripe no disponible en Costa Rica → Lemon Squeezy como alternativa no probada
- SMTP Resend no puede enviar sin dominio verificado → emails transaccionales bloqueados
- Sin validación con clientes → posible product-market fit incorrecto
