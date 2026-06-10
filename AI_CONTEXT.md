# AI_CONTEXT.md — AcuiCal

> Documento crítico para continuidad de IA.
> Última actualización: 2026-06-09.

---

## Resumen Ejecutivo

AcuiCal es un SaaS acuícola offline-first, construido con React 19 + TypeScript 6.0 + Vite 8. Actualmente es un prototipo funcional de frontend con 13 páginas, persistencia en localStorage, PWA, i18n ES/EN/PT y ~430 claves de traducción. No tiene backend, autenticación, multiusuario ni facturación. El objetivo inmediato es construir el MVP vendible con backend, auth y suscripciones.

---

## Estado Actual

- **Nivel**: Prototipo funcional / MVP técnico (~40% del camino a SaaS)
- **Páginas funcionales**: 13 (Dashboard, Calculator, Bitácora, Zootécnico, Especies, Fincas, Parámetros, Fórmulas, Microbiología, Finanzas, Vet Wizard, Inventario, Master Panel)
- **Mapa de Arquitectura**: Página oculta en `/mapa`, accesible solo desde Master Panel
- **Persistencia**: localStorage (claves prefijo `aquacalc_`)
- **PWA**: Service worker + manifest + Workbox precaching
- **Idiomas**: ES (base), EN, PT — ~430 claves cada uno
- **Exportaciones**: Excel (SheetJS/xlsx), PDF (jsPDF)
- **Build**: `tsc -b && vite build` — ambos deben pasar
- **Último build**: 266 modules, ~1496 KiB

---

## Arquitectura

```
src/
├── core/           # TypeScript puro (sin React, sin DOM)
│   ├── formulas.ts         # Cálculos acuícolas (biomasa, FCR, ración)
│   ├── species.ts          # 7 especies + ENERGY_DEFAULTS
│   ├── currencies.ts       # 16 monedas con formato locale
│   ├── i18n.ts             # ~430 claves × 3 idiomas
│   ├── validators.ts       # WQ, formularios, email (contiene código huérfano Firebase)
│   ├── observations.ts     # 10 observaciones clínicas
│   ├── inventario-types.ts # Producto, Movimiento, Categoría
│   └── index.ts
├── store/          # React Context + hooks
│   ├── language.ts         # LanguageProvider + useTranslation
│   ├── currency.ts         # CurrencyProvider + useCurrency
│   ├── theme.ts            # ThemeProvider + useTheme
│   ├── lookups.ts          # useLookups() — fincas, especies, estanques
│   ├── inventario.ts       # useInventario() — CRUD + alertas
│   └── saveIndicator.ts    # useSaveIndicator()
├── components/     # Componentes compartidos
│   ├── Layout.tsx          # Header + Sidebar + main content
│   ├── Sidebar.tsx         # Navegación + idioma + moneda + tema
│   ├── GlobalSearch.tsx    # Búsqueda en localStorage (corregida)
│   ├── Toast.tsx           # Sistema de notificaciones
│   └── Tutorial.tsx        # Tutorial interactivo 5 pasos
├── pages/          # 13 páginas (una por módulo)
│   ├── Calculator.tsx, Bitacora.tsx, Zootecnico.tsx
│   ├── Especies.tsx, Fincas.tsx, Parametros.tsx
│   ├── Formulas.tsx, Microbiologia.tsx, Finanzas.tsx
│   ├── VeterinaryReportWizard.tsx, Inventario.tsx
│   ├── Dashboard.tsx, MasterPage.tsx, Mapa.tsx
│   └── index.ts
├── data/
│   └── navLinks.ts         # Definición de navegación
├── utils/
│   └── debugData.ts        # Generación de datos de prueba
├── App.tsx                  # Routes (14 rutas)
├── main.tsx                 # Entry point + registerSW
└── index.css                # Estilos globales (~2450 líneas)
```

---

## Decisiones Tomadas

| Decisión | Opción Elegida | Motivo |
|----------|---------------|--------|
| Framework | React 19 + Vite 8 | Ecosistema maduro, HMR rápido, TypeScript nativo |
| Persistencia | localStorage | Offline-first, sin backend, rápido |
| PWA | vite-plugin-pwa | Instalable en mobile, precaching automático |
| i18n | Context + objeto plano | Sin dependencias externas, liviano |
| Monedas | Context + mapa fijo | 16 monedas con locale, sin API externa |
| CSS | CSS plano (index.css) | Sin runtime, sin dependencias, control total |
| Rutas | React Router v7 | Estándar de la industria |
| PDF | jsPDF | Única opción viable sin backend |
| Excel | SheetJS (xlsx) | Estándar para exportación tabular |
| IDs | `${prefix}_${Date.now()}` | Simple, único, sin dependencias |
| Estanques | string[] dentro de Finca | Almacenamiento simple, migración automática |
| Búsqueda global | indexed loop sobre localStorage | Compatible cross-browser, robusto |

---

## Convenciones

### Código
- **No comentarios** en el código (salvo excepciones justificadas)
- **No Firebase** — no se usa, no se agrega. localStorage + futuro backend propio
- **Core puro TS** — `src/core/` no importa React, no toca el DOM
- **Variables en español** en la UI (finca, estanque, bitácora, etc.)
- **IDs**: `r_${Date.now()}`, `f_${Date.now()}`, `inv_prod_${Date.now()}`, etc.
- **Estanques**: ID compuesto `fincaId||estanqueNombre`

### i18n
- Claves en camelCase (e.g. `mapaTitle`, `inventarioValorTotal`)
- Archivo plano en `core/i18n.ts` con 3 objetos (es/en/pt)
- Toda string visible usa `t("clave")` desde `useTranslation()`
- Agregar claves SIEMPRE en los 3 idiomas

### CSS
- Una sola hoja: `src/index.css`
- Variables CSS para tema (--bg, --surface, --accent, etc.)
- Clases con prefijo semántico (`.card-`, `.btn-`, `.modal-`, `.wizard-`)
- No usar librerías de CSS (Tailwind, styled-components, etc.)

### Estado
- `useState` + `useEffect` para estado local
- `localStorage` para persistencia (getItem/setItem con JSON parse/stringify)
- try/catch en toda lectura de localStorage
- Notificaciones vía `toast()` desde `Toast.tsx`

---

## Pendientes Críticos

1. **Backend API** — Express + Prisma + PostgreSQL
2. **Autenticación JWT** — registro, login, logout, recuperación
3. **Migración de datos** — localStorage → PostgreSQL
4. **Sincronización offline** — cola de cambios + reconciliación
5. **Tests unitarios** — vitest para core/formulas.ts, core/validators.ts
6. **CI/CD** — GitHub Actions
7. **Suscripciones** — Stripe Checkout + Webhooks
8. **Multi-usuario** — roles, permisos, aislamiento por tenant

---

## Riesgos

- **Sin tests**: regresiones al escalar
- **Código huérfano Firebase** en `core/validators.ts:traducirError()` — no hay Firebase en package.json
- **Sin CI/CD**: despliegues manuales frágiles
- **Tamaño de build**: ~1.5 MB sin code splitting
- **Sin validación de clientes**: posible product-market fit incorrecto

---

## Prioridades

1. **Tests del core** (vitest) — base para refactor seguro
2. **Backend API** (Express + Prisma) — condición necesaria para SaaS
3. **Autenticación** — condición necesaria para SaaS
4. **Suscripciones** (Stripe) — condición suficiente para vender
5. **Multi-usuario** — condición necesaria para crecimiento

---

## Próxima Tarea Recomendada

Escribir tests unitarios para `src/core/formulas.ts` usando vitest. Esto:
- Estabiliza el core antes de tocar backend
- Detecta regresiones temprano
- Es requisito para CI/CD
- Es código 100% TypeScript puro — no necesita DOM ni React

---

## Comandos Útiles

```bash
npm run dev          # Servidor desarrollo (http://10.83.170.182:5173)
npm run build        # Compilar producción
tsc -b               # TypeScript build (proyectos references)
vite build           # Vite build
cmd /c "tsc --noEmit"  # Type-check sin emitir (funciona en Windows PowerShell)
```

---

## Notas Adicionales

- El proyecto se desarrolla en Windows. Usar `cmd /c` para comandos npm/tsc.
- `tsc --noEmit` puede pasar cuando `tsc -b` falla (project references).
- No hay WSL requerido.
- Dev server corre en `10.83.170.182:5173`.
- Tema almacenado en `aquacalc_theme` (dark/light) con `data-theme` en `<html>`.
- Master Panel PIN: `211203`.
