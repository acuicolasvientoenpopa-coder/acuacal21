# AquaCalc 🐟

Calculadora acuícola con bitácora, seguimiento zootécnico y soporte multilingüe (ES/EN/PT).

Migración completa de una app monolítica HTML+Firebase a React+Vite+TypeScript.

## Stack

- **React 19** + **TypeScript 6.0**
- **Vite 8** con HMR
- **React Router** (7 rutas)
- **localStorage** para persistencia offline (sin Firebase)
- **PWA** (`vite-plugin-pwa`) con service worker + manifest
- **jsPDF** para exportar bitácora a PDF
- Traducción de toda la UI vía `IDIOMAS` + React Context

## Páginas

| Ruta | Página |
|------|--------|
| `/` | Calculadora (cálculos de biomasa, FCR, rentabilidad) |
| `/bitacora` | Biometría (registro diario con validación de calidad de agua) |
| `/zootecnico` | Seguimiento zootécnico (gráficos + tabla filtrable) |
| `/parametros` | Parámetros por especie (agrupados por sección) |
| `/especies` | Mis Especies (referencia + especies personalizadas CRUD) |
| `/formulas` | Fórmulas de referencia (con traducciones ES/EN/PT) |
| `/fincas` | Mis Fincas (CRUD de unidades productivas) |

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Previsualizar build
```

## Despliegue (servidor propio)

```bash
npm run build
# Copiar el contenido de dist/ a la raíz del servidor web
```

La app es estática (HTML+JS+CSS). Funciona con cualquier servidor web (Nginx, Apache, etc.). Configurarlo para que sirva `index.html` en todas las rutas para soportar React Router (ej: `try_files $uri /index.html` en Nginx).

## Estructura

```
src/
├── core/           # Lógica pura TS (sin React, sin DOM)
│   ├── formulas.ts
│   ├── validators.ts
│   ├── i18n.ts
│   ├── species-defaults.ts
│   ├── currencies.ts
│   └── observations.ts
├── store/          # Estado global (LanguageProvider)
├── components/     # Layout, Toast, Profile, etc.
├── pages/          # 7 páginas de la app
└── utils/          # Utilidades (PDF export)
```
