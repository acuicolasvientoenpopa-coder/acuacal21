# VISIÓN — AcuiCal y el Ecosistema Acuícolas Viento en Popa

> Documento estratégico. Actualizado: 2026-06-10. Post Fase 1-3 (seguridad, calidad, pagos ONVO Pay, CI/CD).

---

## Visión de AcuiCal

**AcuiCal es la plataforma de gestión acuícola que cualquier productor puede usar, pagar y amar.**

No queremos ser el ERP más complejo del mercado. Queremos ser la herramienta que un productor de camarón en Ecuador abre en su celular sin internet, registra su biometría diaria, y sabe si su cultivo va bien o mal.

### Principios
1. **Offline-first** — el 80% de las granjas no tiene internet estable
2. **Idioma local** — el productor merece la herramienta en su idioma
3. **Precio justo** — $20/mes, no $200/mes
4. **Científico pero simple** — fórmulas validadas por FAO, Boyd, Timmons; interfaz para cualquier usuario
5. **Ecosistema** — AcuiCal es el primero de muchos módulos

### Objetivos a 5 años
- 1,000 clientes pagadores activos
- Presencia en 10+ países de LATAM
- MRR > $50,000/mes
- Reconocimiento como herramienta estándar en acuicultura latinoamericana
- Integración con laboratorios de calidad de agua y centros de diagnóstico

### Objetivos a 10 años
- 10,000 clientes pagadores
- Presencia global (LATAM, África, SE Asia)
- MRR > $500,000/mes
- Ecosistema completo: AcuiCal + AcuiGen + trazabilidad + NFC + PIT Tags
- Estándar de facto para gestión acuícola en mercados emergentes

---

## Visión de AcuiGen

AcuiGen será el módulo de mejoramiento genético. Integrará:

- **Control reproductivo**: registro de reproductores, apareamientos, desoves
- **Pedigrí**: árboles genealógicos por individuo
- **Consanguinidad**: cálculo automático de coeficientes
- **BLUP**: Best Linear Unbiased Prediction para selección genética
- **Conexión con PIT Tags y NFC**: identificación individual

AcuiGen compartirá con AcuiCal:
- Base de datos de especies
- Sistema de autenticación
- Modelo de suscripción (probablemente add-on $49/mes)
- Infraestructura y APIs

---

## Integración Futura

```
AcuiCal (gestión producción + sanidad)
    │
    ├── AcuiGen (mejoramiento genético)
    ├── Control Reproductivo
    ├── Pedigrí + Consanguinidad + BLUP
    ├── Inventarios Avanzados + Trazabilidad
    ├── NFC + PIT Tags (hardware)
    ├── Empacadora (control de calidad)
    ├── Exportación (documentación sanitaria)
    ├── Fábrica de Alimentos Balanceados
    └── Fábrica de Harina de Pescado
```

Cada módulo será:
- Independiente (se puede comprar por separado)
- Integrable (comparten API y modelo de datos)
- Suscribible (pricing individual)
- Offline-first (misma arquitectura que AcuiCal)

---

## Ecosistema Acuícolas Viento en Popa

> "Acuícolas Viento en Popa" es la marca paraguas que agrupará todos los productos tecnológicos para la acuicultura.

### Productos planeados
1. **AcuiCal** — Gestión de producción y sanidad (actual)
2. **AcuiGen** — Mejoramiento genético (siguiente)
3. **AcuiTrace** — Trazabilidad desde el huevo hasta la exportación
4. **AcuiFeed** — Fábrica de alimentos balanceados
5. **AcuiHarina** — Fábrica de harina de pescado
6. **AcuiPack** — Empacadora y control de calidad
7. **AcuiID** — NFC + PIT Tags para identificación individual

### Estrategia de lanzamiento
1. Lanzar AcuiCal solo (MVP vendible → tracción)
2. Agregar AcuiGen como add-on cuando AcuiCal tenga 50+ clientes
3. Los demás módulos cuando cada uno tenga mercado validado

---

## Decisión Estratégica Clave

**No construir todo antes de vender.**

El ecosistema completo es la visión a 10 años. El objetivo del año 1 es tener 50 clientes pagando por AcuiCal. Cada módulo nuevo se justifica solo si:
1. Hay clientes pidiéndolo
2. Mejora la retención (reduce churn)
3. Aumenta el MRR significativamente

---

## Riesgos Estratégicos

- **Extensión excesiva**: construir muchos módulos antes de validar el primero
- **Sobreingeniería**: preparar para 10,000 clientes cuando tenemos 0
- **Subestimación del soporte**: el cliente acuícola necesita acompañamiento
- **Dependencia de hardware**: NFC/PIT Tags requieren fabricación y logística
