export const OBSERVACIONES = [
  "alimentacion_activa",
  "alimentacion_reducida",
  "boqueo",
  "agua_verde",
  "agua_cafe",
  "agua_clara",
  "espuma",
  "mortalidades_observadas",
  "peces_lentos",
  "nado_erratico",
] as const;

export type Observacion = (typeof OBSERVACIONES)[number];
