# AcuiCal 🐟

> Plataforma SaaS de gestión acuícola — offline-first, multilingüe, con referencias científicas.

AcuiCal es el primer producto del ecosistema **Acuícolas Viento en Popa**. Diseñado para productores acuícolas pequeños y medianos de LATAM.

**Estado**: MVP funcional con backend + auth. [Ver estado completo →](PROJECT_STATUS.md)  
**Frontend**: https://acuacla2112.netlify.app  
**Backend API**: https://acuacal21-production.up.railway.app/api

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript 6.0 + Vite 8 |
| Backend | Express + TypeScript + Prisma |
| Base de datos | PostgreSQL (Supabase) |
| Autenticación | Supabase Auth (JWT) |
| Persistencia | API primaria + localStorage (fallback/cache) |
| PWA | vite-plugin-pwa (service worker + Workbox) |
| PDF | jsPDF |
| Excel | SheetJS (xlsx) |
| CSS | CSS plano con variables |
| i18n | Context + objeto plano (~430 claves × 3 idiomas) |

---

## Páginas (15)

| Ruta | Página | Persistencia |
|------|--------|-------------|
| `/login` | Login/Register | Supabase Auth |
| `/terminos` | Términos y Condiciones | Estático |
| `/` | Dashboard | localStorage |
| `/calc` | Calculadora | Local |
| `/bitacora` | Bitácora | API + localStorage |
| `/zootecnico` | Zootécnico | localStorage |
| `/especies` | Especies | API + localStorage |
| `/fincas` | Fincas + Estanques | API + localStorage |
| `/parametros` | Parámetros WQ | localStorage |
| `/formulas` | Fórmulas | Estático |
| `/micro` | Microbiología | API + localStorage |
| `/finanzas` | Finanzas | API + localStorage |
| `/inventario` | Inventario | API + localStorage |
| `/vet` | Veterinaria | API + localStorage |
| `/master` | Master Panel | localStorage |
| `/mapa` | Mapa Arquitectura | Estático |

---

## Instalación

```bash
git clone <repo>
cd acucal

# Frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run test     # 25 tests vitest

# Backend
cd server
npm install
npm run dev      # http://localhost:3001
npm run build    # tsc
```

---

## Despliegue

Frontend en Netlify (`dist/` con `_redirects` para SPA fallback).  
Backend en Railway (Node, Express, TypeScript).  
Base de datos en Supabase PostgreSQL (conexión directa bloqueada, API REST).

---

## Documentación del Proyecto

| Documento | Propósito |
|-----------|-----------|
| [CONTEXT.md](CONTEXT.md) | Contexto completo para IA |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Estado actual, avance, riesgos |
| [ROADMAP.md](ROADMAP.md) | Hoja de ruta |
| [BUSINESS_PLAN.md](BUSINESS_PLAN.md) | Estrategia comercial |
| [AI_CONTEXT.md](AI_CONTEXT.md) | Contexto legacy para IA |
| [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md) | Decisiones técnicas |
| [VISION.md](VISION.md) | Visión estratégica |
| [CHANGELOG.md](CHANGELOG.md) | Historial de cambios |
| [TERMS.md](TERMS.md) | Términos y Condiciones |

---

## Licencia

Propietaria. Todos los derechos reservados — Acuícolas Viento en Popa.
