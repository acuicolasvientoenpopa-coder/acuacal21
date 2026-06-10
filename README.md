# AcuiCal 🐟

> Plataforma SaaS de gestión acuícola — offline-first, multilingüe, con referencias científicas.

AcuiCal es el primer producto del ecosistema **Acuícolas Viento en Popa**. Está diseñado para productores acuícolas pequeños y medianos que necesitan una herramienta completa, económica y que funcione sin internet.

**Estado actual**: Prototipo funcional (~40% del camino a SaaS vendible). [Ver estado completo →](PROJECT_STATUS.md)

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript 6.0 + Vite 8 |
| Ruteo | React Router |
| Persistencia | localStorage (offline-first) |
| PWA | vite-plugin-pwa (service worker + manifest + Workbox) |
| PDF | jsPDF |
| Excel | SheetJS (xlsx) |
| CSS | CSS plano con variables (sin frameworks) |
| i18n | Context + objeto plano (~430 claves × 3 idiomas) |

---

## Páginas (13 funcionales)

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | Dashboard | Resumen global del sistema |
| `/calc` | Calculadora | Biomasa, FCR, rentabilidad, ración diaria |
| `/bitacora` | Bitácora | Biometría diaria con validación WQ |
| `/zootecnico` | Zootécnico | Seguimiento con gráficos y tabla filtrable |
| `/especies` | Especies | CRUD + referencia de especies |
| `/fincas` | Fincas | CRUD de fincas + estanques |
| `/parametros` | Parámetros | Parámetros WQ por especie |
| `/formulas` | Fórmulas | Referencias técnicas con citas FAO/Boyd/Timmons |
| `/micro` | Microbiología | Registro microbiológico |
| `/finanzas` | Finanzas | Gestión financiera por ciclo |
| `/vet` | Veterinaria | Wizard de diagnóstico sanitario |
| `/inventario` | Inventario | Productos, movimientos, alertas de stock |
| `/master` | Master Panel | Desarrollo — PIN: `211203` |
| `/mapa` | Mapa | Arquitectura del sistema (solo desde Master Panel) |

---

## Instalación

```bash
git clone <repo>
cd acucal
npm install
npm run dev      # Servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Previsualizar build
```

El servidor de desarrollo corre en `http://10.83.170.182:5173`.

---

## Despliegue

```bash
npm run build
# Copiar dist/ a la raíz del servidor web
# Configurar SPA fallback (ej: Nginx try_files $uri /index.html)
```

La app es estática (HTML+JS+CSS). Funciona con cualquier servidor web.

---

## Documentación del Proyecto

| Documento | Propósito |
|-----------|-----------|
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Estado actual, avance, riesgos |
| [ROADMAP.md](ROADMAP.md) | Hoja de ruta: MVP → internacionalización |
| [BUSINESS_PLAN.md](BUSINESS_PLAN.md) | Estrategia comercial y modelo SaaS |
| [AI_CONTEXT.md](AI_CONTEXT.md) | Contexto completo para continuidad de IA |
| [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md) | Decisiones técnicas registradas |
| [VISION.md](VISION.md) | Visión estratégica a 5 y 10 años |
| [CHANGELOG.md](CHANGELOG.md) | Historial de cambios por sesión |

---

## Estructura del Proyecto

```
src/
├── core/           # Lógica pura TypeScript (sin React, sin DOM)
│   ├── formulas.ts          # Cálculos acuícolas (FAO, Boyd, Timmons)
│   ├── species.ts           # 7 especies predefinidas + ENERGY_DEFAULTS
│   ├── currencies.ts        # 16 monedas con formato locale
│   ├── i18n.ts              # Traducciones (ES/EN/PT) ~430 claves c/u
│   ├── validators.ts        # Validación WQ, formularios, email
│   ├── observations.ts      # 10 observaciones clínicas
│   ├── inventario-types.ts  # Tipos: Producto, Movimiento, Categoría
│   └── index.ts
├── store/          # React Context + hooks personalizados
│   ├── language.ts          # Idioma (useTranslation)
│   ├── currency.ts          # Moneda (useCurrency)
│   ├── theme.ts             # Tema (useTheme)
│   ├── lookups.ts           # Fincas, especies, estanques
│   ├── inventario.ts        # CRUD inventario + alertas
│   └── saveIndicator.ts     # Indicador de guardado
├── components/     # Componentes compartidos (Layout, Sidebar, Toast, etc.)
├── pages/          # 13 páginas funcionales + Mapa
├── data/           # Datos estáticos (navLinks)
├── utils/          # Utilidades (debugData)
├── App.tsx         # Router principal (14 rutas)
├── main.tsx        # Entry point + PWA registerSW
└── index.css       # Estilos globales (~2500 líneas)
```

---

## Licencia

Propietaria. Todos los derechos reservados — Acuícolas Viento en Popa.
