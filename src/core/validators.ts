// --- Tipos ---

export interface WaterQualityValues {
  oxigeno?: number | null;
  temperatura?: number | null;
  ph?: number | null;
  amonio?: number | null;
  nitrito?: number | null;
}

export interface BitacoraFormValues {
  fecha?: string;
  estanque?: string;
  alimento?: number | null;
  mortalidad?: number | null;
  ph?: number | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

// --- Validación de calidad de agua ---

export function validateWaterQuality(values: WaterQualityValues): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (values.oxigeno != null && values.oxigeno > 0) {
    if (values.oxigeno < 2 || values.oxigeno > 20) {
      warnings.oxigeno = "Valor fuera de rango normal (2–20 mg/L)";
    }
  }

  if (values.temperatura != null && values.temperatura > 0) {
    if (values.temperatura < 5 || values.temperatura > 45) {
      warnings.temperatura = "Valor fuera de rango (5–45°C)";
    }
  }

  if (values.ph != null && values.ph > 0) {
    if (values.ph < 0 || values.ph > 14) {
      errors.ph = "pH debe estar entre 0 y 14";
    }
  }

  if (values.amonio != null && values.amonio > 0.5) {
    warnings.amonio = "Amonio elevado (>0.5 mg/L)";
  }

  if (values.nitrito != null && values.nitrito > 0.3) {
    warnings.nitrito = "Nitrito elevado (>0.3 mg/L)";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// --- Validación de formulario de bitácora ---

export function validateBitacoraForm(values: BitacoraFormValues): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (!values.fecha) {
    errors.fecha = "Campo requerido";
  } else {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaD = new Date(values.fecha + "T00:00:00");
    if (fechaD > hoy) {
      errors.fecha = "La fecha no puede ser futura";
    }
  }

  if (!values.estanque || !values.estanque.trim()) {
    errors.estanque = "Campo requerido";
  }

  if (values.alimento != null && values.alimento < 0) {
    errors.alimento = "No puede ser negativo";
  }

  if (values.mortalidad != null && values.mortalidad < 0) {
    errors.mortalidad = "No puede ser negativo";
  }

  if (values.ph != null && values.ph > 0 && (values.ph < 0 || values.ph > 14)) {
    errors.ph = "pH debe estar entre 0 y 14";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// --- Validación de email ---

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --- Traducción de errores Firebase Auth ---

const ERROR_MAP: Record<string, string> = {
  "auth/user-not-found": "Usuario no encontrado",
  "auth/wrong-password": "Contraseña incorrecta",
  "auth/invalid-email": "Correo inválido",
  "auth/email-already-in-use": "Este correo ya está registrado",
  "auth/weak-password": "Mínimo 6 caracteres",
  "auth/invalid-credential": "Correo o contraseña incorrectos",
};

export function traducirError(code: string): string {
  return ERROR_MAP[code] || "Error: " + code;
}
