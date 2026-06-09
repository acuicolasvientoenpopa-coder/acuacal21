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
  },
];

export function getAllSpecies(customSpecies: Species[]): Species[] {
  return [...ESPECIES_DEFAULT, ...customSpecies];
}
