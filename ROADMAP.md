# ROADMAP — AcuiCal

> Hoja de ruta del producto. Actualizado: 2026-06-09.

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

**Riesgo**: Sin backend, auth ni multiusuario. No es vendible.

---

## Fase 1 — MVP Vendible (⬅️ AHORA)

**Objetivo**: Tener algo que un productor acuícola pueda pagar y usar solo.

### Requerido
- [ ] Backend API REST (Node.js + Express)
- [ ] Base de datos PostgreSQL (Prisma ORM)
- [ ] Autenticación JWT (registro, login, logout, recuperación)
- [ ] Migración de datos de localStorage a DB
- [ ] Sincronización offline básica (localStorage → API)
- [ ] Tests unitarios del core (vitest)
- [ ] CI/CD básico (GitHub Actions: typecheck + test + build)
- [ ] Landing page simple (presentación + registro)
- [ ] Plan Free (1 finca, 1 usuario, funcionalidades básicas)

**Riesgo**: Alto — es el primer salto a backend. Dependencia crítica: elegir bien la arquitectura de API.

**Impacto comercial**: Sin esto no hay SaaS.

**Estimación**: 3-4 semanas full-time.

---

## Fase 2 — Primer Cliente Pagador

**Objetivo**: Conseguir 1 productor real dispuesto a pagar.

### Requerido
- [ ] Plan Professional ($29/mes): fincas ilimitadas, multi-estanque, exportaciones
- [ ] Stripe Checkout + Webhooks
- [ ] Portal de cliente (datos de facturación, historial de pagos)
- [ ] Onboarding guiado para nuevo usuario
- [ ] Soporte básico (email + docs)
- [ ] Encuesta NPS temprana

**Riesgo**: Validación de precio. Si nadie paga, el producto no sirve.

**Impacto comercial**: Primer ingreso real. Valida el modelo.

**Estimación**: +2-3 semanas desde Fase 1.

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

**Riesgo**: Soportar 10 clientes con 0 devs de soporte es agotador. Automatizar todo lo posible.

**Impacto comercial**: MRR ~$290/mes (10 × $29). Valida tracción.

**Estimación**: +4-6 semanas desde Fase 2.

---

## Fase 4 — 50 Clientes

**Objetivo**: Escalar a 50 clientes. Contratar primer soporte.

### Requerido
- [ ] Plan Enterprise ($99/mes): multi-usuario, soporte prioritario, API
- [ ] Facturación automática (Stripe Billing)
- [ ] Dashboard de administrador (métricas de uso)
- [ ] Términos de servicio + privacidad
- [ ] SLA básico

**Riesgo**: Soportar 50 clientes requiere al menos 1 persona de soporte. Costos de infraestructura suben.

**Impacto comercial**: MRR ~$1,450-$4,950/mes. Depende del mix de planes.

**Estimación**: +8-12 semanas desde Fase 3.

---

## Fase 5 — 100 Clientes

**Objetivo**: Escalar a 100 clientes. Producto estable.

### Requerido
- [ ] Automatización de facturación completa
- [ ] Self-service: registro, upgrade, downgrade, cancelación
- [ ] Analíticas de uso del producto
- [ ] Roadmap público
- [ ] Changelog público
- [ ] API pública documentada

**Riesgo**: Competidores empiezan a notar. Diferenciación debe ser clara.

**Impacto comercial**: MRR ~$2,900-$9,900/mes. Negocio sostenible.

**Estimación**: +12-16 semanas desde Fase 4.

---

## Fase 6 — Escalamiento Nacional

**Objetivo**: Dominar el mercado acuícola del país de origen.

### Requerido
- [ ] Equipo: 2 devs + 1 soporte + 1 ventas
- [ ] Campaña de marketing dirigida
- [ ] Alianzas con universidades y centros de investigación
- [ ] Presencia en ferias y congresos acuícolas
- [ ] Casos de éxito publicables
- [ ] Versión mobile nativa o PWA avanzada

**Riesgo**: Competencia local reacciona. Guerra de precios.

**Impacto comercial**: MRR ~$10,000-$30,000/mes.

---

## Fase 7 — Escalamiento Internacional

**Objetivo**: Exportar a LATAM y mercados de habla hispana/portuguesa.

### Requerido
- [ ] Multi-moneda completo (USD, BRL, MXN, CLP, COP, PEN)
- [ ] Cumplimiento fiscal local (facturación electrónica, impuestos)
- [ ] Traducción completa a portugués (Brasil)
- [ ] Data centers regionales o CDN
- [ ] Partner channels en cada país
- [ ] Equipo de ventas internacional

**Riesgo**: Complejidad fiscal y regulatoria por país.

**Impacto comercial**: MRR ~$50,000-$150,000/mes.

---

## Fase 8 — Ecosistema Acuícolas Viento en Popa

**Objetivo**: Lanzar AcuiGen y demás módulos del ecosistema.

- AcuiGen (mejoramiento genético)
- Control reproductivo, Pedigrí, Consanguinidad, BLUP
- NFC, PIT Tags, Trazabilidad
- Empacadora, Exportación
- Fábrica de alimentos balanceados
- Fábrica de harina de pescado

**Riesgo**: Extensión excesiva. Mantener foco.

**Impacto comercial**: MRR > $200,000/mes. Empresa consolidada.
