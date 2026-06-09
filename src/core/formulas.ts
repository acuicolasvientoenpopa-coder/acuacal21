export interface CalculationInputs {
  volumen: number;
  densidad: number;
  pesoInicial: number;
  pesoCosecha: number;
  supervivencia: number;
  fcr: number;
  precioAlimento: number;
  precioVenta: number;
  gpd: number;
}

export interface CalculationResults {
  totalAnimales: number;
  biomasaInicial: number;
  supervivientes: number;
  biomasaCosecha: number;
  gananciaPeso: number;
  alimentoTotal: number;
  costoAlimento: number;
  ingreso: number;
  utilidad: number;
  dias: number;
  costoKg: number;
}

export interface RacionInputs {
  biomasaActual: number;
  tasaAlimentacion: number;
  comidasPorDia: number;
}

export interface RacionResults {
  racionDiaria: number;
  racionComida: number;
}

// --- Cálculos ---

export function calcular(inputs: CalculationInputs): CalculationResults {
  const {
    volumen,
    densidad,
    pesoInicial,
    pesoCosecha,
    supervivencia,
    fcr,
    precioAlimento,
    precioVenta,
    gpd,
  } = inputs;

  const totalAnimales = volumen * densidad;
  const biomasaInicial = (totalAnimales * pesoInicial) / 1000;
  const supervivientes = totalAnimales * (supervivencia / 100);
  const biomasaCosecha = (supervivientes * pesoCosecha) / 1000;
  const gananciaPeso = biomasaCosecha - biomasaInicial;
  const alimentoTotal = gananciaPeso > 0 ? gananciaPeso * fcr : 0;
  const costoAlimento = alimentoTotal * precioAlimento;
  const ingreso = biomasaCosecha * precioVenta;
  const utilidad = ingreso - costoAlimento;
  const dias = gpd > 0 ? (pesoCosecha - pesoInicial) / gpd : 0;
  const costoKg = biomasaCosecha > 0 ? costoAlimento / biomasaCosecha : 0;

  return {
    totalAnimales,
    biomasaInicial,
    supervivientes,
    biomasaCosecha,
    gananciaPeso,
    alimentoTotal,
    costoAlimento,
    ingreso,
    utilidad,
    dias,
    costoKg,
  };
}

export function calcRacion(inputs: RacionInputs): RacionResults {
  const { biomasaActual, tasaAlimentacion, comidasPorDia } = inputs;

  const racionDiaria = biomasaActual * (tasaAlimentacion / 100);
  const racionComida = racionDiaria / comidasPorDia;

  return { racionDiaria, racionComida };
}

// --- Fórmulas de referencia (texto informativo) ---

export interface ReferenceFormula {
  id: string;
  title: string;
  formula: string;
  description: string;
}

export const REFERENCE_FORMULAS: ReferenceFormula[] = [
  {
    id: "biomasa",
    title: "Biomasa",
    formula: "Biomasa (kg) = N° animales × Peso promedio (g) ÷ 1000",
    description:
      "Indica el peso total de los animales en el sistema. Ejemplo: 1000 peces × 300g = 300 kg de biomasa.",
  },
  {
    id: "fcr",
    title: "FCR — Factor de Conversión Alimenticia",
    formula: "FCR = Alimento consumido (kg) ÷ Ganancia de peso (kg)",
    description:
      "Mide la eficiencia alimenticia. Un FCR de 1.5 significa que se necesitan 1.5 kg de alimento para producir 1 kg de carne. Menor es mejor.",
  },
  {
    id: "sgr",
    title: "SGR — Tasa de Crecimiento Específico",
    formula: "SGR (%/día) = [(ln Pf − ln Pi) ÷ días] × 100",
    description:
      "Indica el porcentaje de ganancia de peso por día relativo al peso corporal. Pf = peso final, Pi = peso inicial.",
  },
  {
    id: "supervivencia",
    title: "Supervivencia",
    formula: "Supervivencia (%) = (Animales finales ÷ Animales iniciales) × 100",
    description:
      "Porcentaje de animales que sobreviven durante el ciclo de producción.",
  },
  {
    id: "factor_condicion",
    title: "Factor de Condición (K)",
    formula: "K = (Peso (g) ÷ Longitud (cm)³) × 100",
    description:
      "Indica el estado de bienestar del pez. Valores cercanos a 1 son normales. Valores menores pueden indicar desnutrición.",
  },
  {
    id: "cv",
    title: "Coeficiente de Variación (CV)",
    formula: "CV (%) = (Desviación estándar ÷ Media) × 100",
    description:
      "Mide la uniformidad del lote. CV menor a 20% indica lote uniforme. Mayor a 35% sugiere heterogeneidad problemática.",
  },
  {
    id: "tasa_alimentacion",
    title: "Tasa de Alimentación",
    formula: "Ración diaria (kg) = Biomasa (kg) × Tasa (%) ÷ 100",
    description:
      "La tasa de alimentación varía según especie, temperatura y etapa de crecimiento. Generalmente entre 1% y 6% de la biomasa por día.",
  },
  {
    id: "densidad",
    title: "Densidad de Siembra",
    formula: "Densidad = N° animales ÷ Volumen (m³ o m²)",
    description:
      "Define cuántos animales se colocan por unidad de volumen o área. Afecta directamente la calidad del agua y el crecimiento.",
  },
  {
    id: "costo_kg",
    title: "Costo por kg Producido",
    formula: "Costo/kg = Costo total alimento ÷ Biomasa cosechada (kg)",
    description:
      "Indica cuánto cuesta producir cada kilogramo de producto. Es el principal indicador de rentabilidad.",
  },
  {
    id: "utilidad",
    title: "Utilidad",
    formula: "Utilidad = Ingreso bruto − Costo de alimento",
    description:
      "Ingreso bruto = Biomasa cosechada × Precio de venta. Nota: no incluye otros costos operativos.",
  },
  {
    id: "dias_mercado",
    title: "Días al Mercado",
    formula: "Días = (Peso cosecha − Peso inicial) ÷ GPD",
    description:
      "GPD = Ganancia de peso diaria (g/día). Estima el tiempo necesario para alcanzar el peso de cosecha.",
  },
];
