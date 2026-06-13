# FEATURES.md — AcuiCal

> Inventario completo de funcionalidades basado en el código fuente actual.
> Fecha: 2026-06-13.

---

## Frontend

### 1. Autenticación (Login.tsx + auth.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Login con email/password | ✅ | Supabase `signInWithPassword` |
| Registro con email/password + nombre | ✅ | Supabase `signUp` + POST `/api/auth/register` |
| Olvidé mi contraseña | ✅ | Supabase `resetPasswordForEmail` con redirect |
| Selector de idioma en login | ✅ | ES/EN/PT con botones de bandera |
| Checkbox "Acepto Términos" | ✅ | Obligatorio para registro, link a /terminos |
| Sesión persistente | ✅ | Supabase `persistSession: true`, `autoRefreshToken: true` |
| Plan/Rol desde user_metadata | ✅ | Plan por defecto "free", rol "productor" |
| Logout | ✅ | Supabase `signOut` |

### 2. Dashboard (Dashboard.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Resumen de todas las secciones | ✅ | Tarjetas con conteos desde localStorage |
| Resumen financiero | ✅ | Total gastos + biomasa desde `aquacalc_finanzas` |
| Resumen inventario | ✅ | Valor total + alertas desde `aquacalc_inventario_productos` |
| Export All Excel | ✅ | `exportAllExcel()` todos los datos |

### 3. Calculadora Acuícola (Calculator.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Cálculo de biomasa | ✅ | `calcular()` |
| Cálculo de FCR | ✅ | `calcular()` |
| Cálculo de SGR | ✅ | `calcular()` |
| Cálculo de rentabilidad | ✅ | Ingreso, utilidad, costo/kg |
| Cálculo de días al mercado | ✅ | `calcular()` |
| Selector de especie | ✅ | Desde ESPECIES_DEFAULT + custom species |
| Volumen por forma (6 tipos) | ✅ | Rectangular, circular, trapezoidal, tanque, triangular, poligonal (con `calcVolumen()`) |
| Cálculo de ración diaria | ✅ | `calcRacion()` |
| Costos energéticos | ✅ | Eléctrico, combustible, recibo real |
| Selector de moneda | ✅ | 16 monedas vía CurrencyProvider |

### 4. Bitácora de Biometría (Bitacora.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| CRUD de registros | ✅ | GET/POST/DELETE /api/bitacora |
| Validación WQ en vivo | ✅ | `validateWaterQuality()` con colores |
| Observaciones clínicas | ✅ | Chip selector desde OBSERVACIONES |
| Campos zootécnicos | ✅ | Biomasa, SGR, FCR acumulado |
| Export PDF | ✅ | `exportBitacoraPDF()` |
| Filtro por estanque | ✅ | Desde useLookups() |
| Persistencia híbrida | ✅ | API primaria + localStorage fallback |

### 5. Seguimiento Zootécnico (Zootecnico.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Gráfico de barras paramétrico | ✅ | 9 parámetros seleccionables |
| Tabla de datos (últimos 30) | ✅ | Reverse chronological |
| Filtro por estanque | ✅ | Selector dropdown |
| Export PDF | ✅ | `exportZootecnicoPDF()` |
| Export Excel | ✅ | `exportZootecnicoExcel()` |
| Persistencia | ✅ | Solo localStorage (lee `aquacalc_bitacora`) |

### 6. Especies (Especies.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| 7 especies de referencia | ✅ | Con parámetros completos de ESPECIES_DEFAULT |
| CRUD especies personalizadas | ✅ | API primaria + localStorage fallback |
| Límite de 3 especies custom | ✅ | UI bloquea después de 3 |
| Modal de edición | ✅ | Todos los SpeciesParams editables |
| Persistencia híbrida | ✅ | GET/POST/PUT/DELETE /api/especies |

### 7. Fincas y Estanques (Fincas.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| CRUD de fincas | ✅ | API primaria + localStorage fallback |
| CRUD de estanques (inline) | ✅ | POST/DELETE /api/fincas/:id/estanques |
| Límites por plan | ✅ | `excedeLimiteFincas()`, `excedeLimiteEstanques()` |
| Auto-creación de estanque default | ✅ | Al crear finca, crea estanque con mismo nombre |
| Migración de datos legacy | ✅ | `migrar()` para formato antiguo |
| Persistencia híbrida | ✅ | GET/POST/PUT/DELETE /api/fincas |

### 8. Parámetros WQ (Parametros.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Override de parámetros por especie | ✅ | Partial SpeciesParams |
| Pestañas por especie | ✅ | 7 tabs para cada especie predefinida |
| Indicador de modificación | ✅ | Badge en campos sobreescritos |
| Restaurar especie/todas | ✅ | Elimina overrides |
| Persistencia | ✅ | Solo localStorage (`aquacalc_params_overrides`) |

### 9. Referencias Técnicas (Formulas.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| 5 secciones de referencias | ✅ | Formulas, especies, agua, energía, diagnósticos |
| 33 cards con fuente verificable | ✅ | FAO, Boyd, Timmons, etc. |
| Sin persistencia | ✅ | Contenido estático en `referencias.ts` |

### 10. Microbiología (Microbiologia.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Registro de cultivos | ✅ | GET/POST/PUT/DELETE /api/microbiologia |
| Antibiograma (7 antibióticos) | ✅ | S/I/R radio buttons |
| Registro de medicación | ✅ | Fechas, dosis, vía, retiro |
| Cuenta regresiva de retiro | ✅ | `diasRetiro()` |
| Alertas de retiro activo | ✅ | Sección de alertas |
| Export cultivo como TXT | ✅ | Reporte plano |
| Persistencia híbrida | ✅ | API + localStorage (`aquacalc_cultivos`, `aquacalc_medicacion`) |

### 11. Finanzas (Finanzas.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| CRUD de registros financieros | ✅ | API primaria + localStorage fallback |
| Gráfico de distribución de costos | ✅ | Barras por categoría |
| Resumen: total, costo/kg, margen | ✅ | Tarjetas de resumen |
| Filtro por estanque | ✅ | Selector |
| 9 categorías de costos | ✅ | Semilla, alimento, medicación, electricidad, combustible, manoObra, mantenimiento, transporte, otros |
| Export Excel | ✅ | `exportFinanzasExcel()` |
| Migración legacy (energía) | ✅ | Convierte campo antiguo a electricidad+combustible |
| Persistencia híbrida | ✅ | GET/POST /api/finanzas |

### 12. Inventario (Inventario.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| CRUD de productos | ✅ | API + useInventario() |
| Registro de movimientos | ✅ | Entrada/salida + auto-ajuste stock |
| Alertas de stock mínimo | ✅ | Pestaña dedicada |
| 5 categorías | ✅ | Alimento, medicamento, equipo, insumo, otro |
| Cálculo de valor total | ✅ | Suma stockActual × precioUnitario |
| Persistencia híbrida | ✅ | API + localStorage |

### 13. Wizard Veterinario (VeterinaryReportWizard.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Wizard de 6 pasos | ✅ | Estanque → Alimentación → Comportamiento → Síntomas → Agua → Resumen |
| Reglas de síntomas (22 total) | ✅ | 4 alimentación, 5 comportamiento, 8 síntomas, 5 agua |
| Cálculo de riesgo | ✅ | `calcularRiesgo()` → puntaje + nivel (rojo/amarillo/verde) |
| Diagnóstico automático | ✅ | `findDiagnoses()` con pesos |
| Resumen generado automáticamente | ✅ | `generateResumen()` |
| Adjuntar fotos (cámara/file) | ✅ | Base64, preview, persistencia |
| Historial de reportes | ✅ | Lista con indicador de riesgo |
| Export PDF | ✅ | `exportVetPDF()` |
| Creación inline de estanques | ✅ | Desde el wizard |
| Persistencia híbrida | ✅ | GET/POST/DELETE /api/veterinaria |

### 14. Medir Estanque (MedirEstanque.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| 6 formas de estanque | ✅ | Rectangular, circular, trapezoidal, tanque, triangular, poligonal |
| Modo manual | ✅ | Input directo de dimensiones |
| Modo geo (mapa) | ✅ | Leaflet + OpenStreetMap, clicks para marcar puntos |
| Cálculo de área/volumen | ✅ | `calcAreaPoligono()`, `calcVolumen*()` |
| Overlay visual en mapa | ✅ | Rectángulo, círculo, polígono |
| Enviar a calculadora | ✅ | Guarda en `aquacalc_geo_dimensions`, redirige a /calc |

### 15. Admin Panel (Admin.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Protección PIN | ✅ | Token `211203` |
| Override plan/rol | ✅ | Selectores localStorage + reload |
| Health check backend | ✅ | GET /api/health |
| Generadores de datos test | ✅ | `generateBitacora()`, `generateFincas()`, etc. |
| Estado del sistema | ✅ | API online/offline, localStorage KB, plan/rol activo |
| Force SW update | ✅ | `reg.update()` + reload |
| Export/Import localStorage | ✅ | JSON download/upload |
| Zona de peligro | ✅ | Clear all data con confirmación |

### 16. MasterPage (MasterPage.tsx) — Legacy
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Protección PIN | ✅ | Token `211203` |
| Editor localStorage | ✅ | Lista, edita, elimina cualquier clave aquacalc_* |
| PWA Cache Inspector | ✅ | Lista y limpia Cache Storage |
| Export/Import | ✅ | JSON backup/restore |
| Reset tutorial | ✅ | Borra `aquacalc_tutorial_done` |
| Link a Mapa | ✅ | Navegación a /mapa |

### 17. Mapa de Arquitectura (Mapa.tsx)
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Diagrama visual de capas | ✅ | Core → Store → Pages → Infrastructure |
| Indicadores de estado | ✅ | ok/partial/pending por módulo |
| Navegación a páginas | ✅ | Links clickables |

### 18. PWA
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Service Worker con Workbox | ✅ | Precaching de assets |
| Instalable | ✅ | Manifest con display standalone |
| Auto-update en visibilitychange | ✅ | `reg.update()` al volver a la pestaña |
| Fallback SPA | ✅ | `_redirects` para Netlify |
| Cache headers | ✅ | `_headers` para SW + assets |

### 19. i18n
| Feature | Estado | Detalle |
|---------|:------:|---------|
| 3 idiomas | ✅ | ES, EN, PT |
| 451 claves por idioma | ✅ | 100% de cobertura entre idiomas |
| Tipo estricto TranslationKey | ✅ | Union type de 451 strings |
| Fallback a key name | ✅ | Si no encuentra clave |

### 20. Tema
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Dark/Light | ✅ | CSS variables, `data-theme` en `<html>` |
| Persistencia | ✅ | localStorage `aquacalc_theme` |
| Toggle en sidebar | ✅ | Botón en el menú lateral |

### 21. Exportaciones
| Feature | Librería | Detalle |
|---------|----------|---------|
| Bitácora PDF | jsPDF | Landscape, WQ color coding |
| Zootécnico PDF | jsPDF | Landscape, tabla de datos |
| Veterinario PDF | jsPDF | Portrait, riesgo coloreado, fotos |
| Excel Zootécnico | SheetJS | Datos de bitácora |
| Excel Finanzas | SheetJS | Resumen por registro |
| Excel All | SheetJS | 4 hojas: Bitácora, Cultivos, Medicación, Finanzas |

### 22. Otras Funcionalidades
| Feature | Estado | Detalle |
|---------|:------:|---------|
| Búsqueda global | ✅ | `GlobalSearch.tsx` — full-text en localStorage |
| Tutorial interactivo | ✅ | 5 pasos con overlay |
| Sidebar responsive | ✅ | Hamburguesa en mobile |
| Indicador de guardado | ✅ | `useSaveIndicator()` |
| Toast notifications | ✅ | `toast()` |
| Términos y Condiciones | ✅ | Página pública /terminos |

---

## Backend — 34 Endpoints

### Auth (3, sin auth)
| Método | Ruta | Función |
|--------|------|---------|
| POST | /api/auth/register | Registro: signUp Supabase + crear User en DB |
| POST | /api/auth/login | Login: signInWithPassword Supabase |
| POST | /api/auth/logout | Logout: signOut Supabase |

### Fincas (6, con JWT)
| Método | Ruta | Función |
|--------|------|---------|
| GET | /api/fincas | Listar fincas con estanques |
| POST | /api/fincas | Crear finca |
| PUT | /api/fincas/:id | Actualizar finca |
| DELETE | /api/fincas/:id | Eliminar finca |
| POST | /api/fincas/:id/estanques | Crear estanque |
| DELETE | /api/fincas/:fincaId/estanques/:estanqueId | Eliminar estanque |

### Bitácora (3, con JWT)
| Método | Ruta | Función |
|--------|------|---------|
| GET | /api/bitacora | Listar registros |
| POST | /api/bitacora | Crear registro |
| DELETE | /api/bitacora/:id | Eliminar registro |

### Especies (4, con JWT)
| Método | Ruta | Función |
|--------|------|---------|
| GET | /api/especies | Listar especies (propias + públicas) |
| POST | /api/especies | Crear especie |
| PUT | /api/especies/:id | Actualizar especie |
| DELETE | /api/especies/:id | Eliminar especie |

### Finanzas (4, con JWT)
| Método | Ruta | Función |
|--------|------|---------|
| GET | /api/finanzas | Listar registros |
| POST | /api/finanzas | Crear registro |
| PUT | /api/finanzas/:id | Actualizar registro |
| DELETE | /api/finanzas/:id | Eliminar registro |

### Inventario (6, con JWT)
| Método | Ruta | Función |
|--------|------|---------|
| GET | /api/inventario/productos | Listar productos |
| POST | /api/inventario/productos | Crear producto |
| PUT | /api/inventario/productos/:id | Actualizar producto |
| DELETE | /api/inventario/productos/:id | Eliminar producto |
| GET | /api/inventario/movimientos | Listar movimientos |
| POST | /api/inventario/movimientos | Crear movimiento |

### Microbiología (4, con JWT)
| Método | Ruta | Función |
|--------|------|---------|
| GET | /api/microbiologia | Listar registros |
| POST | /api/microbiologia | Crear registro |
| PUT | /api/microbiologia/:id | Actualizar registro |
| DELETE | /api/microbiologia/:id | Eliminar registro |

### Veterinaria (4, con JWT)
| Método | Ruta | Función |
|--------|------|---------|
| GET | /api/veterinaria | Listar reportes |
| POST | /api/veterinaria | Crear reporte |
| PUT | /api/veterinaria/:id | Actualizar reporte |
| DELETE | /api/veterinaria/:id | Eliminar reporte |
