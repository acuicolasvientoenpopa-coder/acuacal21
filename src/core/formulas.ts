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
  // Energía — estimación por equipo
  bombaHP?: number;
  bombaCount?: number;
  bombaHoursDay?: number;
  aireadorHP?: number;
  aireadorCount?: number;
  aireadorHoursDay?: number;
  precioKWh?: number;
  motorBombaConsumo?: number;
  motorBombaHoursDay?: number;
  motorAireadorConsumo?: number;
  motorAireadorHoursDay?: number;
  precioCombustible?: number;
  // Energía — datos reales de recibo (sobreescribe estimación si >0)
  gastoPeriodoElect?: number;
  diasPeriodoElect?: number;
  gastoPeriodoComb?: number;
  diasPeriodoComb?: number;
  diasCiclo?: number;
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
  // Energía
  costoBombeoElect?: number;
  costoAireacionElect?: number;
  costoElectTotal?: number;
  costoBombeoComb?: number;
  costoAireacionComb?: number;
  costoCombTotal?: number;
  costoEnergiaTotal?: number;
  costoEnergiaPorKg?: number;
  costoTotalFinal?: number;
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

// --- Cálculos de Volumen de Estanques ---

export interface VolumenResult {
  volumenM3: number;
  litros: number;
}

export function calcVolumenRectangular(largo: number, ancho: number, profundidad: number): VolumenResult {
  const m3 = largo * ancho * profundidad;
  return { volumenM3: m3, litros: m3 * 1000 };
}

export function calcVolumenCircular(diametro: number, profundidad: number): VolumenResult {
  const radio = diametro / 2;
  const m3 = Math.PI * radio * radio * profundidad;
  return { volumenM3: m3, litros: m3 * 1000 };
}

export function calcVolumenTrapezoidal(
  largoSup: number, anchoSup: number,
  largoInf: number, anchoInf: number,
  profundidad: number
): VolumenResult {
  const areaSup = largoSup * anchoSup;
  const areaInf = largoInf * anchoInf;
  const m3 = (profundidad / 3) * (areaSup + areaInf + Math.sqrt(areaSup * areaInf));
  return { volumenM3: m3, litros: m3 * 1000 };
}

export function calcVolumenTanqueCilindrico(diametro: number, altura: number): VolumenResult {
  const radio = diametro / 2;
  const m3 = Math.PI * radio * radio * altura;
  return { volumenM3: m3, litros: m3 * 1000 };
}

export function calcVolumenTriangular(base: number, altura: number, profundidad: number): VolumenResult {
  const areaBase = (base * altura) / 2;
  const m3 = areaBase * profundidad;
  return { volumenM3: m3, litros: m3 * 1000 };
}

export function calcAreaPoligono(puntos: { x: number; y: number }[]): number {
  if (puntos.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < puntos.length; i++) {
    const j = (i + 1) % puntos.length;
    area += puntos[i].x * puntos[j].y;
    area -= puntos[j].x * puntos[i].y;
  }
  return Math.abs(area) / 2;
}

export type FormaEstanque = "manual" | "rectangular" | "circular" | "trapezoidal" | "tanque" | "triangular" | "poligono";

export interface DimensionesEstanque {
  forma: FormaEstanque;
  largo?: number;
  ancho?: number;
  largoSup?: number;
  anchoSup?: number;
  largoInf?: number;
  anchoInf?: number;
  diametro?: number;
  profundidad?: number;
  altura?: number;
  base?: number;
  alturaTri?: number;
}

export function calcVolumen(dim: DimensionesEstanque): VolumenResult {
  switch (dim.forma) {
    case "rectangular":
      return calcVolumenRectangular(dim.largo || 0, dim.ancho || 0, dim.profundidad || 0);
    case "circular":
      return calcVolumenCircular(dim.diametro || 0, dim.profundidad || 0);
    case "trapezoidal":
      return calcVolumenTrapezoidal(
        dim.largoSup || 0, dim.anchoSup || 0,
        dim.largoInf || 0, dim.anchoInf || 0,
        dim.profundidad || 0
      );
    case "tanque":
      return calcVolumenTanqueCilindrico(dim.diametro || 0, dim.altura || 0);
    case "triangular":
      return calcVolumenTriangular(dim.base || 0, dim.alturaTri || 0, dim.profundidad || 0);
    default:
      return { volumenM3: 0, litros: 0 };
  }
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
    bombaHP, bombaCount, bombaHoursDay,
    aireadorHP, aireadorCount, aireadorHoursDay, precioKWh,
    motorBombaConsumo, motorBombaHoursDay,
    motorAireadorConsumo, motorAireadorHoursDay, precioCombustible,
    gastoPeriodoElect, diasPeriodoElect,
    gastoPeriodoComb, diasPeriodoComb,
    diasCiclo,
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

  // Energía (solo si hay datos)
  const dc = diasCiclo && diasCiclo > 0 ? diasCiclo : (dias > 0 ? dias : 0);
  let costoBombeoElect: number | undefined;
  let costoAireacionElect: number | undefined;
  let costoElectTotal: number | undefined;
  let costoBombeoComb: number | undefined;
  let costoAireacionComb: number | undefined;
  let costoCombTotal: number | undefined;
  let costoEnergiaTotal: number | undefined;
  let costoEnergiaPorKg: number | undefined;
  let costoTotalFinal: number | undefined;

  if (dc > 0) {
    // Electricidad — recibo real sobreescribe estimación
    if (gastoPeriodoElect && gastoPeriodoElect > 0 && diasPeriodoElect && diasPeriodoElect > 0) {
      costoElectTotal = (gastoPeriodoElect / diasPeriodoElect) * dc;
      costoBombeoElect = 0;
      costoAireacionElect = 0;
    } else {
      if (bombaHP && bombaCount && bombaHoursDay && precioKWh) {
        costoBombeoElect = bombaHP * 0.746 * bombaCount * bombaHoursDay * precioKWh * dc;
      }
      if (aireadorHP && aireadorCount && aireadorHoursDay && precioKWh) {
        costoAireacionElect = aireadorHP * 0.746 * aireadorCount * aireadorHoursDay * precioKWh * dc;
      }
      const electItems = [costoBombeoElect, costoAireacionElect].filter((x): x is number => x !== undefined);
      costoElectTotal = electItems.length > 0 ? electItems.reduce((a, b) => a + b, 0) : undefined;
    }

    // Combustible — recibo real sobreescribe estimación
    if (gastoPeriodoComb && gastoPeriodoComb > 0 && diasPeriodoComb && diasPeriodoComb > 0) {
      costoCombTotal = (gastoPeriodoComb / diasPeriodoComb) * dc;
      costoBombeoComb = 0;
      costoAireacionComb = 0;
    } else {
      if (motorBombaConsumo && motorBombaHoursDay && precioCombustible) {
        costoBombeoComb = motorBombaConsumo * motorBombaHoursDay * precioCombustible * dc;
      }
      if (motorAireadorConsumo && motorAireadorHoursDay && precioCombustible) {
        costoAireacionComb = motorAireadorConsumo * motorAireadorHoursDay * precioCombustible * dc;
      }
      const combItems = [costoBombeoComb, costoAireacionComb].filter((x): x is number => x !== undefined);
      costoCombTotal = combItems.length > 0 ? combItems.reduce((a, b) => a + b, 0) : undefined;
    }

    const energiaItems = [costoElectTotal, costoCombTotal].filter((x): x is number => x !== undefined);
    costoEnergiaTotal = energiaItems.length > 0 ? energiaItems.reduce((a, b) => a + b, 0) : undefined;

    if (costoEnergiaTotal !== undefined && biomasaCosecha > 0) {
      costoEnergiaPorKg = costoEnergiaTotal / biomasaCosecha;
    }
    if (costoEnergiaTotal !== undefined) {
      costoTotalFinal = costoAlimento + costoEnergiaTotal;
    }
  }

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
    costoBombeoElect,
    costoAireacionElect,
    costoElectTotal,
    costoBombeoComb,
    costoAireacionComb,
    costoCombTotal,
    costoEnergiaTotal,
    costoEnergiaPorKg,
    costoTotalFinal,
  };
}

export function calcRacion(inputs: RacionInputs): RacionResults {
  const { biomasaActual, tasaAlimentacion, comidasPorDia } = inputs;

  const racionDiaria = biomasaActual * (tasaAlimentacion / 100);
  const racionComida = racionDiaria / comidasPorDia;

  return { racionDiaria, racionComida };
}


