export { calcular, calcRacion, REFERENCE_FORMULAS } from "./formulas";
export type {
  CalculationInputs,
  CalculationResults,
  RacionInputs,
  RacionResults,
  ReferenceFormula,
} from "./formulas";

export { ESPECIES_DEFAULT, getAllSpecies } from "./species-defaults";
export type { SpeciesParams, Species } from "./species-defaults";

export { MONEDAS } from "./currencies";
export type { Currency } from "./currencies";

export { OBSERVACIONES } from "./observations";
export type { Observacion } from "./observations";

export { IDIOMAS } from "./i18n";
export type { Idioma, TranslationKey } from "./i18n";

export {
  validateWaterQuality,
  validateBitacoraForm,
  validarEmail,
  traducirError,
} from "./validators";
export type {
  WaterQualityValues,
  BitacoraFormValues,
  ValidationResult,
} from "./validators";
