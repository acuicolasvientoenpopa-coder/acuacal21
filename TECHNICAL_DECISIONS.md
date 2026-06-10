# TECHNICAL DECISIONS — AcuiCal

> Registro de decisiones técnicas importantes.
> Actualizado: 2026-06-09.

---

## 2026-06-09 — Sistema formal de documentación del proyecto

**Decisión**: Crear 7 documentos obligatorios (PROJECT_STATUS, CHANGELOG, ROADMAP, BUSINESS_PLAN, AI_CONTEXT, TECHNICAL_DECISIONS, VISION) más actualización de README.

**Motivo**: Estandarizar la documentación para garantizar continuidad entre sesiones de IA y humanos. Sin documentos formales, cada IA parte de cero.

**Alternativas evaluadas**: Documentación dispersa (estilo anterior), wiki externa, Notion.

**Consecuencias futuras**: Cada tarea ahora requiere actualizar documentación antes de darse por terminada. Mayor overhead inicial, pero continuidad asegurada.

---

## 2026-06-09 — Mapa de Arquitectura como página oculta

**Decisión**: La página Mapa solo se accede desde el Master Panel, no desde el sidebar.

**Motivo**: Es una herramienta de desarrollo/auditoría, no una función de producto para el usuario final. Evita confusión en la navegación principal.

**Alternativas evaluadas**: Sidebar, dashboard, ruta pública.

**Consecuencias futuras**: Fácil de mover a público cuando tenga valor para el cliente (ej: "estado de mi granja").

---

## 2026-06-09 — Estanques como string[] dentro de Finca

**Decisión**: Almacenar estanques como array de strings dentro del objeto Finca en localStorage.

**Motivo**: Simplicidad máxima. Una sola clave de localStorage por finca. Migración automática para datos existentes. Sin tablas separadas.

**Alternativas evaluadas**: Clave separada `aquacalc_estanques`, array de objetos con metadatos.

**Consecuencias futuras**: Al migrar a PostgreSQL, los estanques serán una tabla separada con FK a fincas. El ID compuesto `fincaId||nombre` facilitará la migración.

---

## 2026-06-09 — Inventario con patrón idéntico a Finanzas/Fincas

**Decisión**: El módulo de inventario sigue exactamente el mismo patrón que Finanzas, Fincas y Especies: tipos en `core/`, hook en `store/`, página en `pages/`.

**Motivo**: Consistencia arquitectónica. Si en el futuro se cambia localStorage por backend, solo cambia el hook, no las páginas ni los tipos.

**Alternativas evaluadas**: Clase singleton, store global única, Redux.

**Consecuencias futuras**: Fácil migración a backend. Cada módulo es independiente y testeable.

---

## Anteriores (reconstruido de memoria del proyecto)

### Elección de React 19 + Vite 8

**Decisión**: React 19 + Vite 8 + TypeScript 6.0.

**Motivo**: Ecosistema maduro, HMR rápido, TypeScript nativo. Migración desde HTML+Firebase monolítico.

**Alternativas**: Svelte, Angular, Vue, HTML+JS vanilla.

**Consecuencias**: Bundle de ~1.5 MB. Posible code splitting futuro.

### Reemplazo de Firebase por localStorage

**Decisión**: Eliminar Firebase (Auth + Firestore) y usar localStorage para persistencia.

**Motivo**: Offline-first, cero costos de infraestructura, simplicidad durante desarrollo inicial.

**Alternativas**: Firebase (mantener), Supabase, Appwrite, backend propio desde el día 1.

**Consecuencias**: Ahora necesitamos construir backend propio. localStorage no escala más allá de 1 usuario/dispositivo.

### i18n con Context + objeto plano

**Decisión**: No usar react-i18next ni ninguna librería de i18n. Objeto plano con claves + React Context.

**Motivo**: Cero dependencias externas, control total, rendimiento predecible.

**Alternativas**: react-i18next, FormatJS, Lingui.

**Consecuencias**: Sin detección automática de plurales, sin interpolación avanzada. Fácil de migrar si se necesita.

### CSS plano sin frameworks

**Decisión**: Una sola hoja CSS (`index.css`) con variables. Sin Tailwind, styled-components, CSS modules, etc.

**Motivo**: Sin runtime adicional, sin build step extra, control total. Suficiente para el tamaño del proyecto.

**Alternativas**: Tailwind, styled-components, Material UI, Chakra.

**Consecuencias**: A medida que el proyecto crezca, considerar CSS modules o Tailwind para evitar hoja monolítica.
