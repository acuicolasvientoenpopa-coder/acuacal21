# Extracción de lógica reutilizable — AquaCalc v3.5

> Fuente: `github.com/acuicolasvientoenpopa-coder/Prueva-02-calcu-acui`
> Formato: HTML + CSS + JS inline (2640 líneas, 1 archivo)
> Stack: Firebase Auth + Firestore + localStorage + PWA

---

## /core — Lógica de negocio reutilizable (migrar primero)

### 1. Fórmulas de cálculo acuícola (`index.html:1854-1901`)

**Función `calcular()`** — dependencias: solo inputs numéricos y `state.especieSeleccionada`

```
totalAnimales    = volumen × densidad
biomasaInicial   = totalAnimales × pesoInicial / 1000
supervivientes   = totalAnimales × (supervivencia / 100)
biomasaCosecha   = supervivientes × pesoCosecha / 1000
gananciaPeso     = biomasaCosecha - biomasaInicial
alimentoTotal    = gananciaPeso × FCR               (si gananciaPeso > 0)
costoAlimento    = alimentoTotal × precioAlimento
ingreso          = biomasaCosecha × precioVenta
utilidad         = ingreso - costoAlimento
diasEstimados    = (pesoCosecha - pesoInicial) / GPD (si GPD > 0)
costoPorKg       = costoAlimento / biomasaCosecha   (si biomasaCosecha > 0)
```

**Función `calcRacion()`** — dependencias: inputs biomasa actual + especie

```
racionDiaria   = biomasaActual × (tasaAlimentacion / 100)
racionComida   = racionDiaria / comidasPorDia
```

### 2. Validación de calidad de agua (`index.html:1906-1931`)

| Parámetro | Rango normal | Acción |
|---|---|---|
| Oxígeno disuelto | 2–20 mg/L | Warning si fuera de rango |
| Temperatura | 5–45°C | Warning si fuera de rango |
| pH | 0–14 | Error si fuera de rango |
| Amonio NH₃ | >0.5 mg/L → warning | Warning si elevado |
| Nitrito NO₂ | >0.3 mg/L → warning | Warning si elevado |

### 3. Validación de formulario bitácora (`index.html:1933-1954`)

- Fecha no puede ser futura
- Campos requeridos: fecha, estanque
- Validaciones: alimento ≥ 0, mortalidad ≥ 0, pH 0–14

### 4. Datos de especies predeterminadas (`index.html:931-939`)

```js
ESPECIES_DEFAULT = [
  { id, nombre, sci, emoji, custom: false,
    params: { densidad, densidadUnit, supervivencia, fcr, tasaAlim,
              comidasDia, gpd, precioAlimento, precioVenta,
              pesoInicial, pesoCosecha, volumenUnit } }
]
// 7 especies: tilapia, trucha, camarón, guapote, langostino, pangasio, carpa
```

### 5. Monedas latinoamericanas (`index.html:1392-1409`)

```js
MONEDAS = {
  USD: { simbolo: '$',    nombre: 'USD', locale: 'en-US' },
  CRC: { simbolo: '₡',    nombre: 'CRC', locale: 'es-CR' },
  MXN: { simbolo: '$',    nombre: 'MXN', locale: 'es-MX' },
  COP: { simbolo: '$',    nombre: 'COP', locale: 'es-CO' },
  PEN: { simbolo: 'S/',   nombre: 'PEN', locale: 'es-PE' },
  CLP: { simbolo: '$',    nombre: 'CLP', locale: 'es-CL' },
  ARS: { simbolo: '$',    nombre: 'ARS', locale: 'es-AR' },
  BRL: { simbolo: 'R$',   nombre: 'BRL', locale: 'pt-BR' },
  GTQ: { simbolo: 'Q',    nombre: 'GTQ', locale: 'es-GT' },
  HNL: { simbolo: 'L',    nombre: 'HNL', locale: 'es-HN' },
  NIO: { simbolo: 'C$',   nombre: 'NIO', locale: 'es-NI' },
  PYG: { simbolo: '₲',    nombre: 'PYG', locale: 'es-PY' },
  BOB: { simbolo: 'Bs',   nombre: 'BOB', locale: 'es-BO' },
  UYU: { simbolo: '$U',   nombre: 'UYU', locale: 'es-UY' },
  DOP: { simbolo: '$',    nombre: 'DOP', locale: 'es-DO' },
  VES: { simbolo: 'Bs.S', nombre: 'VES', locale: 'es-VE' }
}
```

### 6. i18n — Objeto de traducciones (`index.html:1428-1681`)

Estructura: `IDIOMAS[idioma]['clave']` — 3 idiomas (es/en/pt), ~100 claves cada uno.
Categorías: tabs, auth, calculadora, bitácora, zootécnico, parámetros, especies, fórmulas, fincas, perfil, toasts, validaciones, PDF, observaciones.

### 7. Observaciones de campo (`index.html:1959-1974`)

```js
OBSERVACIONES = [
  'alimentacion_activa', 'alimentacion_reducida', 'boqueo',
  'agua_verde', 'agua_cafe', 'agua_clara', 'espuma',
  'mortalidades_observadas', 'peces_lentos', 'nado_erratico'
]
// UI: checkboxes → se guarda array de strings en el registro
```

### 8. Fórmulas de referencia (texto estático, `index.html:735-787`)

| Fórmula | Expresión |
|---|---|
| Biomasa | = N × peso(g) / 1000 |
| FCR | = alimento(kg) / ganancia peso(kg) |
| SGR | = [(ln Pf − ln Pi) / días] × 100 |
| Supervivencia | = (finales / iniciales) × 100 |
| Factor K | = (peso / longitud³) × 100 |
| CV | = (desv. estándar / media) × 100 |
| Tasa alimentación | = biomasa × tasa% / 100 |
| Densidad | = N / volumen |
| Costo/kg | = costo alimento / biomasa cosechada |
| Utilidad | = ingreso − costo alimento |
| Días al mercado | = (pesoCosecha − pesoInicial) / GPD |

---

## /firebase — Configuración y funciones de Firebase (migrar segundo)

### 1. Configuración (`index.html:915-926`)

```js
// Firebase v10.12.0 (modular)
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword,
         signInWithEmailAndPassword, signOut,
         onAuthStateChanged, sendPasswordResetEmail,
         sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQVYs78jJcVPG34hqPwKgBZemk8mYWgQo",
  authDomain: "acuacalweb.firebaseapp.com",
  projectId: "acuacalweb",
  storageBucket: "acuacalweb.firebasestorage.app",
  messagingSenderId: "717276911914",
  appId: "1:717276911914:web:96cd11b48d17b1d31b6653"
};
```

### 2. Funciones de autenticación (`index.html:1157-1199, 1201-1246`)

| Función | Descripción |
|---|---|
| `doLogin(email, pass)` | `signInWithEmailAndPassword` + validación |
| `doRegister(nombre, finca, email, pass)` | `createUserWithEmailAndPassword` + `sendEmailVerification` + `setDoc(usuarios/{uid})` |
| `doLogout()` | `signOut()` |
| `doForgotPassword(email)` | `sendPasswordResetEmail` |
| `reenviarVerificacion()` | `sendEmailVerification` |
| `traducirError(code)` | Mapeo de códigos Firebase a español |

### 3. Estructura de Firestore

```
Colección: usuarios
  Documento: {uid}
    - nombre: string
    - finca: string
    - email: string
    - params: { [especieId]: { densidad, fcr, ... } }
    - bitacora: [{ id, fecha, estanque, especie, alimento, mortalidad, peso,
                   oxigeno, temperatura, ph, amonio, nitrito, nitrato,
                   alcalinidad, salinidad, dureza, biomasa, nanimales,
                   sgr, fcrAcum, condicion, cv, obsChecks, observaciones,
                   pendingSync }]
    - customSpecies: [{ id, nombre, sci, emoji, custom: true, params }]
    - fincas: [{ id, nombre, ubicacion, descripcion }]
    - fincaActiva: string | null
    - pendingSync: []  ← NO se usa realmente en nube
    - creadoEn: ISO string
```

### 4. Estrategia offline (`index.html:964-1068`)

```
guardarDatos():
  1. guardarLocal()  → localStorage key: 'aquacalc_data_{uid}'
  2. if online → updateDoc(firestore)
  3. if offline → pendingSync se acumula
```

### 5. Patrón de carga (`index.html:1276-1290`)

```
cargarDatosNube(uid):
  1. getDoc(usuarios/{uid})
  2. Sobrescribe state con datos de nube
  3. Limpia pendingSync
  4. guardarLocal()

onAuthStateChanged → cargarLocal() primero → cargarDatosNube() después
```

---

## /ui — Código que será reemplazado en React (listado de referencia)

### 1. Templates HTML (226 líneas CSS + ~600 líneas HTML)

| Sección | ID | Descripción |
|---|---|---|
| Auth screen | `#auth-screen` | Login/register/forgot password |
| Sync bar | `#sync-bar` | Banner offline/sync |
| Header | `header` | Logo, idioma, perfil, logout |
| Tabs | `.tabs` | 7 tabs de navegación |
| Calculadora | `#panel-calc` | Species grid + inputs + resultados + ración |
| Bitácora | `#panel-bitacora` | Formulario + filtros + lista de registros |
| Zootécnico | `#panel-zootecnico` | Filtros + gráfico + tabla |
| Parámetros | `#panel-params` | Mini-tabs + inputs de parámetros |
| Mis Especies | `#panel-especies` | Lista + modal CRUD |
| Fórmulas | `#panel-formulas` | Texto estático de referencia |
| Mis Fincas | `#panel-fincas` | Selector + lista + modal CRUD |
| Modales | `#modal-finca`, `#modal-perfil`, `#modal-especie`, `#modal-sync` | CRUD overlays |
| Toast | `#toast` | Notificación flotante |

### 2. Render functions (todas serán React components)

| Función | Línea | Reemplazo React |
|---|---|---|
| `renderSpeciesGrid()` | 1358 | `<SpeciesGrid>` |
| `renderBitacora()` | 2051 | `<BitacoraList>` + `<BitacoraForm>` |
| `renderZootecnico()` | 2119 | `<ZootecnicoChart>` + `<ZootecnicoTable>` |
| `renderParamTabs()` | 2172 | `<ParamTabs>` |
| `renderParamContent()` | 2179 | `<ParamPanel>` |
| `renderCustomSpeciesList()` | 2229 | `<CustomSpeciesList>` |
| `renderFincas()` | 2348 | `<FincaList>` + `<FincaSelector>` |
| `poblarSelectsEspecie()` | 2105 | Se vuelve prop drilling o context |

### 3. Funciones UI puras (ahora hooks o helpers)

| Función | Línea | Comportamiento |
|---|---|---|
| `toggleTooltip(id)` | 2591 | Toggle clase `show` en tooltip |
| `toggleObsCheck()` | 1959 | Toggle clase `selected` en checkbox custom |
| `getObsChecks()` | 1964 | Lee checkboxes seleccionados |
| `clearObsChecks()` | 1972 | Resetea checkboxes |
| `showToast()` | 2632 | Notificación temporal |
| `showFieldError/Warning()` | 2602 | Estilos de error en inputs |
| `clearFieldError/Warning()` | 2614 | Limpia estilos de error |
| `toggleFormBitacora()` | 1979 | Show/hide formulario |
| `limpiarFormBitacora()` | 2027 | Resetea formulario |
| `exportarPDF()` | 2461 | Genera PDF con jsPDF |
| `cambiarIdioma()` | 1721 | Aplica traducciones a todo el DOM |
| `cambiarMoneda()` | 1413 | Actualiza símbolos de moneda |
| `instalarPWA()` | 1125 | Manejo de beforeinstallprompt |

### 4. Estado global (`index.html:944-957`) — será Context o Zustand store

```ts
interface AppState {
  user: User | null;
  perfil: { nombre: string; finca: string } | null;
  especieSeleccionada: string | null;
  params: Record<string, SpeciesParams>;
  bitacora: BitacoraEntry[];
  customSpecies: CustomSpecies[];
  fincas: Farm[];
  fincaActiva: string | null;
  paramActivo: string;
  isOnline: boolean;
  pendingSync: number[];
  lastSync: string | null;
}
```

---

## Orden recomendado de extracción

```
Fase 1 — Core (sin dependencias de UI ni Firebase)
├── /core/formulas.ts          → calcular(), calcRacion()
├── /core/validators.ts        → validarCampoLive(), validarFormBitacora(), validarEmail()
├── /core/species-defaults.ts  → ESPECIES_DEFAULT
├── /core/currencies.ts        → MONEDAS
├── /core/i18n/               → IDIOMAS (es/en/pt)
│   ├── es.ts
│   ├── en.ts
│   └── pt.ts
├── /core/observations.ts     → OBSERVACIONES
└── /core/reference-formulas.ts → texto de fórmulas

Fase 2 — Firebase (depende de /core para tipos)
├── /firebase/config.ts       → firebaseConfig + initializeApp
├── /firebase/auth.ts         → login, register, logout, forgotPassword, verifyEmail
├── /firebase/firestore.ts    → getDoc, setDoc, updateDoc + estructura
└── /firebase/sync.ts         → offline-first: guardarLocal, cargarLocal, guardarDatos

Fase 3 — UI (depende de /core y /firebase) → migrar a React
├── /ui/state.ts              → tipo AppState + acciones
└── /ui/components/           → todos los componentes React
```

---

## Dependencias npm necesarias (para cuando se migre a React)

```json
{
  "firebase": "^10.12.0",
  "jspdf": "^2.5.1",
  "react": "^18",
  "react-dom": "^18",
  "zustand": "^4"  // o React Context
}
```

No se necesitan dependencias adicionales para la Fase 1 (cálculos puros en TypeScript).
