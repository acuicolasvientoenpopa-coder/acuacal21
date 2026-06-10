# AI_CONTEXT.md — AcuiCal

> Documento crítico para continuidad de IA.
> Última actualización: 2026-06-10.

---

## Resumen Ejecutivo

AcuiCal es un SaaS acuícola con React 19 + TypeScript 6.0 + Vite 8 (frontend), Express + Prisma (backend), PostgreSQL en Supabase, y autenticación JWT. Actualmente es un MVP funcional con 15 páginas, persistencia híbrida (API + localStorage), PWA, i18n ES/EN/PT. 8 páginas ya migradas a API, 4 aún solo localStorage. Sin facturación ni multi-usuario. El objetivo inmediato es agregar pagos con Lemon Squeezy.

---

## Estado Actual

- **Nivel**: MVP funcional (~65% del camino a SaaS vendible)
- **Páginas**: 15 (13 protegidas + Login + Términos)
- **Persistencia**: Híbrida — API primaria, localStorage como caché/fallback
- **Backend**: Express + Prisma + Supabase PostgreSQL (8 routers, 26 endpoints)
- **Auth**: Supabase Auth con JWT (confirm sign up OFF)
- **PWA**: Service worker + manifest + Workbox precaching
- **i18n**: ES (base), EN, PT — ~430 claves cada uno
- **Tests**: 25 tests vitest para core (calcular, calcRacion)
- **Build**: `tsc -b && vite build` — ambos pasan
- **Deploy**: Frontend en Netlify, Backend en Railway
- **SMTP**: Resend configurado, no puede enviar sin dominio verificado

---

## Arquitectura

```
acucal2.1/
├── src/               Frontend (React + Vite)
│   ├── core/          TypeScript puro (sin React)
│   ├── store/         Context + hooks (auth, language, currency, theme, lookups, inventario)
│   ├── components/    Layout, Sidebar, GlobalSearch, Toast, Tutorial
│   ├── pages/         15 páginas (ver CONTEXT.md para detalle)
│   ├── App.tsx        Router + providers
│   ├── main.tsx       Entry + registerSW
│   └── index.css      Estilos globales
├── server/            Backend (Express + Prisma)
│   ├── src/routes/    8 routers (auth, fincas, bitacora, especies, finanzas, inventario, microbiologia, veterinaria)
│   ├── prisma/        schema + migration SQL
│   └── .env           Credenciales
├── CONTEXT.md         Documento principal de contexto
└── ...
```

---

## Decisiones Tomadas (actualizado)

| Decisión | Opción | Motivo |
|----------|--------|--------|
| Framework | React 19 + Vite 8 | Ecosistema maduro, HMR rápido, TS nativo |
| Backend | Express + Prisma | Simple, maduro, TypeScript nativo |
| Base de datos | Supabase PostgreSQL | Gratuito, escalable, REST API si conexión directa bloqueada |
| Autenticación | Supabase Auth (JWT) | Integrado con PostgreSQL, persistSession, autoRefresh |
| Persistencia offline | localStorage | Offline-first, sin backend requerido |
| Persistencia cloud | API primaria + localStorage fallback | Sincronización progresiva |
| Pagos (futuro) | Lemon Squeezy | Stripe no disponible en Costa Rica |
| PWA | vite-plugin-pwa | Instalable mobile, precaching automático |
| i18n | Context + objeto plano | Sin dependencias, liviano |
| CSS | CSS plano (index.css) | Sin runtime, control total |
| Despliegue frontend | Netlify | SPA hosting gratuito con _redirects |
| Despliegue backend | Railway | Node hosting gratuito con Dockerfile |

---

## Convenciones

- **Sin comentarios** en código
- **Sin Firebase** — localStorage + Supabase
- **Core puro TS** — sin imports de React/DOM
- **Variables UI en español**
- **IDs**: `${prefix}_${Date.now()}`
- **Toda string visible** usa `t("clave")` desde `useTranslation()`
- **CSS**: una hoja, variables para tema, prefijos semánticos
- **Build**: `tsc -b && vite build` debe pasar siempre

---

## Pendientes Críticos

1. **Lemon Squeezy** — reemplazar Stripe, configurar planes Free/Pro/Enterprise
2. **Dominio propio** — ~$8/yr Cloudflare, para emails y URL marcada
3. **Migrar Dashboard, Zootécnico, Parametros a API** — hoy solo localStorage
4. **Multi-usuario** — roles (admin/productor/tecnico), permisos, aislamiento por tenant
5. **Sincronización offline** — cola de cambios + reconciliación
6. **CI/CD** — GitHub Actions (typecheck + test + build)
7. **Code splitting** — reducir chunk size >500 kB

---

## Riesgos

- **Sin validación de clientes**: posible product-market fit incorrecto
- **Sin tests backend**: regresiones en API
- **Sin CI/CD**: deploys manuales frágiles
- **Stripe no disponible en CR**: Lemon Squeezy como alternativa no probada
- **Imágenes base64 en localStorage**: puede llenar cuota (~5MB)

---

## Próxima Tarea Recomendada

Configurar Lemon Squeezy para pagos. Se necesita:
1. Crear cuenta en https://lemonsqueezy.com
2. Definir productos/planes (Free, Professional $29/mes, Enterprise $99/mes)
3. Implementar checkout en frontend
4. Configurar webhooks para actualizar estado de suscripción
5. Proteger rutas según plan del usuario

---

## Comandos Útiles

```bash
npm run dev           # Frontend dev
npm run build         # Frontend build (tsc -b && vite build)
npm run test          # 25 tests vitest
cd server && npm run dev   # Backend dev
cd server && npm run build # Backend build
```

---

## Notas

- `Confirm sign up` en Supabase está OFF — registro instantáneo
- SMTP Resend configurado pero sin dominio verificado
- Master Panel PIN: `211203`
- Tema: `aquacalc_theme` en localStorage
- Currency: `aquacalc_currency` en localStorage
- API URL: `https://acuacal21-production.up.railway.app/api`
