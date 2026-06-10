import type { SymptomEntry } from "./symptomRules";

// Referencia del sistema de puntuación:
// Ausvet / OIE (2007). Risk Analysis in Aquatic Animal Health: A Framework for the Evaluation of Aquatic Animal Health Risks.
// FAO / World Organisation for Animal Health.
// Puntajes: 0–2 = riesgo verde (bajo), 3–5 = riesgo amarillo (moderado), ≥6 = riesgo rojo (alto),
// basado en la metodología de matrices de riesgo cualitativas adaptada para acuicultura.

export interface RiskResult {
  puntaje: number;
  riesgo: "verde" | "amarillo" | "rojo";
}

export function calcularRiesgo(diagnosticos: { diagnosis: string; weight: number }[]): RiskResult {
  const puntaje = diagnosticos.reduce((sum, d) => sum + d.weight, 0);
  let riesgo: RiskResult["riesgo"];
  if (puntaje <= 2) riesgo = "verde";
  else if (puntaje <= 5) riesgo = "amarillo";
  else riesgo = "rojo";
  return { puntaje, riesgo };
}

export function calcularDesdeFormData(
  alimentacion: string[],
  comportamiento: string[],
  sintomas: string[],
  agua: string[],
  rules: {
    ALIMENTACION_RULES: SymptomEntry[];
    COMPORTAMIENTO_RULES: SymptomEntry[];
    SINTOMAS_RULES: SymptomEntry[];
    AGUA_RULES: SymptomEntry[];
  },
): { diagnosticos: { diagnosis: string; weight: number }[]; riesgo: RiskResult } {
  const diagnosticos = [
    ...rules.ALIMENTACION_RULES.filter((r) => alimentacion.includes(r.id)).map((r) => ({ diagnosis: r.diagnosis, weight: r.weight })),
    ...rules.COMPORTAMIENTO_RULES.filter((r) => comportamiento.includes(r.id)).map((r) => ({ diagnosis: r.diagnosis, weight: r.weight })),
    ...rules.SINTOMAS_RULES.filter((r) => sintomas.includes(r.id)).map((r) => ({ diagnosis: r.diagnosis, weight: r.weight })),
    ...rules.AGUA_RULES.filter((r) => agua.includes(r.id)).map((r) => ({ diagnosis: r.diagnosis, weight: r.weight })),
  ];
  return { diagnosticos, riesgo: calcularRiesgo(diagnosticos) };
}
