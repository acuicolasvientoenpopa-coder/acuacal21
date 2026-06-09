export interface Currency {
  simbolo: string;
  nombre: string;
  locale: string;
}

export const MONEDAS: Record<string, Currency> = {
  USD: { simbolo: "$", nombre: "USD", locale: "en-US" },
  CRC: { simbolo: "₡", nombre: "CRC", locale: "es-CR" },
  MXN: { simbolo: "$", nombre: "MXN", locale: "es-MX" },
  COP: { simbolo: "$", nombre: "COP", locale: "es-CO" },
  PEN: { simbolo: "S/", nombre: "PEN", locale: "es-PE" },
  CLP: { simbolo: "$", nombre: "CLP", locale: "es-CL" },
  ARS: { simbolo: "$", nombre: "ARS", locale: "es-AR" },
  BRL: { simbolo: "R$", nombre: "BRL", locale: "pt-BR" },
  GTQ: { simbolo: "Q", nombre: "GTQ", locale: "es-GT" },
  HNL: { simbolo: "L", nombre: "HNL", locale: "es-HN" },
  NIO: { simbolo: "C$", nombre: "NIO", locale: "es-NI" },
  PYG: { simbolo: "₲", nombre: "PYG", locale: "es-PY" },
  BOB: { simbolo: "Bs", nombre: "BOB", locale: "es-BO" },
  UYU: { simbolo: "$U", nombre: "UYU", locale: "es-UY" },
  DOP: { simbolo: "$", nombre: "DOP", locale: "es-DO" },
  VES: { simbolo: "Bs.S", nombre: "VES", locale: "es-VE" },
};
