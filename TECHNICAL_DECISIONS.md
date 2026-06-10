# TECHNICAL DECISIONS — AcuiCal

> Registro de decisiones técnicas importantes.
> Actualizado: 2026-06-10.

---

## 2026-06-10 — Syncing documentación con estado real del proyecto

**Decisión**: Actualizar los 9 documentos de proyecto para reflejar el estado actual con backend, auth, migración de páginas y deploys.

**Motivo**: La documentación decía "no tiene backend ni autenticación" cuando ya tiene Express + Prisma + Supabase Auth + Railway + Netlify.

**Consecuencias futuras**: La documentación queda como fuente de verdad para IA y humanos.

---

## 2026-06-09 — Lemon Squeezy vs Stripe para pagos

**Decisión**: Usar Lemon Squeezy en lugar de Stripe para procesamiento de pagos.

**Motivo**: Stripe no está disponible en Costa Rica (país del dueño). Lemon Squeezy funciona globalmente, maneja impuestos automáticamente, y tiene API para suscripciones.

**Alternativas evaluadas**: Stripe, PayPal, Paddle, Credomatic.

**Consecuencias futuras**: Comisión ~5% (vs 2.9% de Stripe), pero es la única opción viable desde CR.

---

## 2026-06-09 — Confirm sign up OFF en Supabase

**Decisión**: Mantener "Confirm sign up" desactivado en Supabase Auth.

**Motivo**: No tenemos dominio verificado para enviar emails de confirmación vía Resend. El registro debe ser instantáneo para no bloquear usuarios.

**Alternativas evaluadas**: Activar confirmación con magic link, emails de verificación con Resend.

**Consecuencias futuras**: Cualquiera puede registrarse con cualquier email (incluso no propio). Riesgo de cuentas spam. Se activará cuando tengamos dominio.

---

## 2026-06-09 — Backend Express + Prisma + Supabase en Railway

**Decisión**: Backend en Express + Prisma + TypeScript, desplegado en Railway.

**Motivo**: Express es el estándar Node.js, Prisma para ORM, Supabase para PostgreSQL gratuito. Railway ofrece hosting Node simple con deploy desde GitHub.

**Alternativas**: Fastify, NestJS, Koa; PlanetScale, Neon; Heroku, Fly.io.

**Consecuencias futuras**: Fácil de escalar horizontalmente. Railway tiene límite de proyectos gratuitos.

---

## 2026-06-09 — Frontend en Netlify con _redirects para SPA

**Decisión**: Desplegar frontend en Netlify con `_redirects` para SPA fallback.

**Motivo**: Netlify es hosting gratuito, soporta deploy automático, y el _redirects resuelve React Router en producción.

**Alternativas**: Vercel, Cloudflare Pages, GitHub Pages.

**Consecuencias futuras**: Cero costo operativo de frontend. Fácil de agregar dominio personalizado.

---

## 2026-06-09 — API primaria + localStorage fallback

**Decisión**: Cada página primero intenta escribir en API; si falla, escribe solo en localStorage. En carga, prioriza API pero cae a localStorage si API no responde.

**Motivo**: Offline-first progresivo. No podemos requerir conexión para operar, pero queremos datos en la nube cuanto antes.

**Alternativas**: localStorage-only (sin nube), API-only (sin offline), cola de sincronización diferida.

**Consecuencias futuras**: Datos pueden divergir entre localStorage y API. Necesitamos reconciliación.

---

## 2026-06-09 — Sistema formal de documentación del proyecto

**Decisión**: Crear 7 documentos obligatorios (PROJECT_STATUS, CHANGELOG, ROADMAP, BUSINESS_PLAN, AI_CONTEXT, TECHNICAL_DECISIONS, VISION) más actualización de README.

**Motivo**: Estandarizar la documentación para garantizar continuidad entre sesiones de IA y humanos.

**Alternativas evaluadas**: Documentación dispersa (estilo anterior), wiki externa, Notion.

**Consecuencias futuras**: Cada tarea ahora requiere actualizar documentación antes de darse por terminada.

---

## 2026-06-09 — Mapa de Arquitectura como página oculta

**Decisión**: La página Mapa solo se accede desde el Master Panel, no desde el sidebar.

**Motivo**: Es una herramienta de desarrollo/auditoría, no una función de producto para el usuario final.

**Alternativas evaluadas**: Sidebar, dashboard, ruta pública.

---

## 2026-06-09 — Estanques como tabla separada en DB

**Decisión**: En PostgreSQL, Estanque es una tabla separada con FK → Finca. En localStorage se mantiene como string[] dentro de Finca.

**Motivo**: En DB relacional, los estanques necesitan ser entidades propias para relaciones (Bitacora → Estanque, etc.).

**Alternativas evaluadas**: Array JSON en columna Finca, ENUM fijo.

**Consecuencias futuras**: El ID compuesto `fincaId||nombre` en localStorage facilita migración a DB.

---

## 2026-06-09 — Inventario con patrón idéntico a Finanzas/Fincas

**Decisión**: El módulo de inventario sigue exactamente el mismo patrón que Finanzas, Fincas y Especies: tipos en `core/`, hook en `store/`, página en `pages/`.

**Motivo**: Consistencia arquitectónica. Si en el futuro se cambia localStorage por backend, solo cambia el hook, no las páginas ni los tipos.

**Alternativas evaluadas**: Clase singleton, store global única, Redux.

---

## Anteriores (reconstruido de memoria del proyecto)

### Elección de React 19 + Vite 8
**Decisión**: React 19 + Vite 8 + TypeScript 6.0.  
**Alternativas**: Svelte, Angular, Vue, HTML+JS vanilla.

### Reemplazo de Firebase por localStorage
**Decisión**: Eliminar Firebase (Auth + Firestore) y usar localStorage para persistencia.  
**Motivo**: Offline-first, cero costos de infraestructura, simplicidad durante desarrollo inicial.  
**Alternativas**: Firebase (mantener), Supabase, Appwrite, backend propio desde el día 1.  
**Consecuencias**: Ahora necesitamos construir backend propio.

### i18n con Context + objeto plano
**Decisión**: No usar react-i18next. Objeto plano con claves + React Context.  
**Alternativas**: react-i18next, FormatJS, Lingui.

### CSS plano sin frameworks
**Decisión**: Una sola hoja CSS (`index.css`) con variables. Sin Tailwind, styled-components.  
**Alternativas**: Tailwind, Material UI, Chakra.
