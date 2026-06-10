export interface SpeciesParams {
  densidad: number;
  densidadUnit: string;
  supervivencia: number;
  fcr: number;
  tasaAlim: number;
  comidasDia: number;
  gpd: number;
  precioAlimento: number;
  precioVenta: number;
  pesoInicial: number;
  pesoCosecha: number;
  volumenUnit: string;
}

export interface Species {
  id: string;
  nombre: string;
  sci: string;
  emoji: string;
  custom: boolean;
  params: SpeciesParams;
  fuente?: string;
}

export const ESPECIES_DEFAULT: Species[] = [
  {
    id: "tilapia",
    nombre: "Tilapia",
    sci: "O. niloticus",
    emoji: "🐟",
    custom: false,
    params: {
      densidad: 20,
      densidadUnit: "peces/m³",
      supervivencia: 90,
      fcr: 1.4,
      tasaAlim: 3.0,
      comidasDia: 3,
      gpd: 3.5,
      precioAlimento: 850,
      precioVenta: 2200,
      pesoInicial: 5,
      pesoCosecha: 500,
      volumenUnit: "m³",
    },
    fuente: "El-Sayed, A.F.M. (2006). Tilapia Culture. CABI Publishing. ISBN 978-1845931737.",
  },
  {
    id: "trucha",
    nombre: "Trucha",
    sci: "O. mykiss",
    emoji: "🐠",
    custom: false,
    params: {
      densidad: 30,
      densidadUnit: "kg/m³",
      supervivencia: 88,
      fcr: 1.2,
      tasaAlim: 2.0,
      comidasDia: 4,
      gpd: 2.8,
      precioAlimento: 1100,
      precioVenta: 4500,
      pesoInicial: 10,
      pesoCosecha: 350,
      volumenUnit: "m³",
    },
    fuente: "Sedgwick, S.D. (1995). Trout Farming Handbook. Fishing News Books. ISBN 978-0852382277.",
  },
  {
    id: "camaron",
    nombre: "Camarón",
    sci: "L. vannamei",
    emoji: "🦐",
    custom: false,
    params: {
      densidad: 80,
      densidadUnit: "ind/m²",
      supervivencia: 70,
      fcr: 1.5,
      tasaAlim: 4.0,
      comidasDia: 4,
      gpd: 0.15,
      precioAlimento: 1200,
      precioVenta: 8000,
      pesoInicial: 0.1,
      pesoCosecha: 12,
      volumenUnit: "m²",
    },
    fuente: "FAO (2018). Penaeus vannamei (Boone, 1931). Cultured Aquatic Species Information Programme. FAO Fisheries Division.",
  },
  {
    id: "guapote",
    nombre: "Guapote",
    sci: "Parachromis dovii",
    emoji: "🐡",
    custom: false,
    params: {
      densidad: 5,
      densidadUnit: "peces/m³",
      supervivencia: 85,
      fcr: 1.8,
      tasaAlim: 3.5,
      comidasDia: 2,
      gpd: 2.0,
      precioAlimento: 900,
      precioVenta: 3500,
      pesoInicial: 10,
      pesoCosecha: 400,
      volumenUnit: "m³",
    },
    fuente: "Günther, J. & Jiménez, R. (2004). Crecimiento del guapote lagunero (Parachromis dovii) en condiciones de cultivo. Revista de Biología Tropical, 52(3).",
  },
  {
    id: "langostino",
    nombre: "Langostino",
    sci: "M. rosenbergii",
    emoji: "🦞",
    custom: false,
    params: {
      densidad: 8,
      densidadUnit: "ind/m²",
      supervivencia: 65,
      fcr: 1.8,
      tasaAlim: 5.0,
      comidasDia: 2,
      gpd: 0.3,
      precioAlimento: 1400,
      precioVenta: 12000,
      pesoInicial: 0.5,
      pesoCosecha: 40,
      volumenUnit: "m²",
    },
    fuente: "New, M.B. & Valenti, W.C. (2000). Freshwater Prawn Culture: The Farming of Macrobrachium rosenbergii. Blackwell Science. ISBN 978-0632056026.",
  },
  {
    id: "pangasio",
    nombre: "Pangasio",
    sci: "P. hypophthalmus",
    emoji: "🐟",
    custom: false,
    params: {
      densidad: 40,
      densidadUnit: "peces/m³",
      supervivencia: 92,
      fcr: 1.3,
      tasaAlim: 3.5,
      comidasDia: 3,
      gpd: 5.0,
      precioAlimento: 780,
      precioVenta: 1800,
      pesoInicial: 5,
      pesoCosecha: 800,
      volumenUnit: "m³",
    },
    fuente: "Phan, L.T. et al. (2009). Current status of farming practices of striped catfish (Pangasianodon hypophthalmus) in the Mekong Delta. Aquaculture, 296(3-4), 227-236.",
  },
  {
    id: "carpa",
    nombre: "Carpa Herbívora",
    sci: "C. idella",
    emoji: "🐠",
    custom: false,
    params: {
      densidad: 2,
      densidadUnit: "peces/m³",
      supervivencia: 88,
      fcr: 3.5,
      tasaAlim: 6.0,
      comidasDia: 2,
      gpd: 8.0,
      precioAlimento: 200,
      precioVenta: 1500,
      pesoInicial: 20,
      pesoCosecha: 1500,
      volumenUnit: "m³",
    },
    fuente: "Pillay, T.V.R. & Kutty, M.N. (2005). Aquaculture: Principles and Practices. 2nd ed. Blackwell Publishing. ISBN 978-1405105323.",
  },
];

// Valores predeterminados de energía por especie
// Fuentes:
// - Boyd, C.E. & Tucker, C.S. (1998). Pond Aquaculture Water Quality Management. Springer.
// - Timmons, M.B. & Ebeling, J.M. (2010). Recirculating Aquaculture. 3rd ed. NRAC Publication.
// - Summerfelt, S.T. & Vinci, B.J. (2004). Energy use in RAS. Aquacultural Engineering, 31(3-4), 155–171.
// - FAO (1992). Aquaculture Sector Review: Energy Costs in Aquaculture. Fisheries Circular No. 854.
// - Boyd, C.E. (2015). Water Quality: An Introduction. Springer.
export const ENERGY_DEFAULTS: Record<string, {
  bombaHP: number;
  bombaCount: number;
  bombaHoursDay: number;
  aireadorHP: number;
  aireadorCount: number;
  aireadorHoursDay: number;
  precioKWh: number;
  motorBombaConsumo: number;
  motorBombaHoursDay: number;
  motorAireadorConsumo: number;
  motorAireadorHoursDay: number;
  precioCombustible: number;
  diasCiclo: number;
}> = {
  tilapia: {
    bombaHP: 1, bombaCount: 1, bombaHoursDay: 12,
    aireadorHP: 1, aireadorCount: 2, aireadorHoursDay: 8,
    precioKWh: 0.15,
    motorBombaConsumo: 1.5, motorBombaHoursDay: 8,
    motorAireadorConsumo: 2.5, motorAireadorHoursDay: 6,
    precioCombustible: 1.20,
    diasCiclo: 150,
  },
  trucha: {
    bombaHP: 2, bombaCount: 1, bombaHoursDay: 16,
    aireadorHP: 1.5, aireadorCount: 2, aireadorHoursDay: 10,
    precioKWh: 0.15,
    motorBombaConsumo: 2.0, motorBombaHoursDay: 10,
    motorAireadorConsumo: 3.0, motorAireadorHoursDay: 8,
    precioCombustible: 1.20,
    diasCiclo: 120,
  },
  camaron: {
    bombaHP: 1.5, bombaCount: 1, bombaHoursDay: 14,
    aireadorHP: 2, aireadorCount: 4, aireadorHoursDay: 12,
    precioKWh: 0.15,
    motorBombaConsumo: 2.0, motorBombaHoursDay: 10,
    motorAireadorConsumo: 3.5, motorAireadorHoursDay: 8,
    precioCombustible: 1.20,
    diasCiclo: 100,
  },
  guapote: {
    bombaHP: 1, bombaCount: 1, bombaHoursDay: 12,
    aireadorHP: 0.75, aireadorCount: 1, aireadorHoursDay: 6,
    precioKWh: 0.15,
    motorBombaConsumo: 1.2, motorBombaHoursDay: 8,
    motorAireadorConsumo: 1.8, motorAireadorHoursDay: 5,
    precioCombustible: 1.20,
    diasCiclo: 200,
  },
  langostino: {
    bombaHP: 1.5, bombaCount: 1, bombaHoursDay: 14,
    aireadorHP: 1.5, aireadorCount: 2, aireadorHoursDay: 10,
    precioKWh: 0.15,
    motorBombaConsumo: 1.8, motorBombaHoursDay: 10,
    motorAireadorConsumo: 2.5, motorAireadorHoursDay: 7,
    precioCombustible: 1.20,
    diasCiclo: 180,
  },
  pangasio: {
    bombaHP: 2, bombaCount: 2, bombaHoursDay: 16,
    aireadorHP: 1.5, aireadorCount: 3, aireadorHoursDay: 10,
    precioKWh: 0.15,
    motorBombaConsumo: 2.5, motorBombaHoursDay: 12,
    motorAireadorConsumo: 3.0, motorAireadorHoursDay: 8,
    precioCombustible: 1.20,
    diasCiclo: 160,
  },
  carpa: {
    bombaHP: 0.5, bombaCount: 1, bombaHoursDay: 8,
    aireadorHP: 0.5, aireadorCount: 1, aireadorHoursDay: 4,
    precioKWh: 0.15,
    motorBombaConsumo: 0.8, motorBombaHoursDay: 6,
    motorAireadorConsumo: 1.2, motorAireadorHoursDay: 3,
    precioCombustible: 1.20,
    diasCiclo: 200,
  },
};

export function getAllSpecies(customSpecies: Species[]): Species[] {
  return [...ESPECIES_DEFAULT, ...customSpecies];
}
