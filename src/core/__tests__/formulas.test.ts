import { describe, it, expect } from "vitest";
import { calcular, calcRacion, calcVolumenRectangular, calcVolumenCircular, calcVolumenTrapezoidal, calcVolumenTanqueCilindrico, calcVolumen } from "../formulas";

describe("calcular", () => {
  const base = {
    volumen: 1000,
    densidad: 30,
    pesoInicial: 10,
    pesoCosecha: 500,
    supervivencia: 85,
    fcr: 1.6,
    precioAlimento: 1.2,
    precioVenta: 3.5,
    gpd: 2.5,
  };

  it("calcula totalAnimales correctamente", () => {
    const r = calcular(base);
    expect(r.totalAnimales).toBe(30000);
  });

  it("calcula biomasaInicial correctamente", () => {
    const r = calcular(base);
    expect(r.biomasaInicial).toBe(300);
  });

  it("calcula supervivientes correctamente", () => {
    const r = calcular(base);
    expect(r.supervivientes).toBe(25500);
  });

  it("calcula biomasaCosecha correctamente", () => {
    const r = calcular(base);
    expect(r.biomasaCosecha).toBe(12750);
  });

  it("calcula gananciaPeso correctamente", () => {
    const r = calcular(base);
    expect(r.gananciaPeso).toBe(12450);
  });

  it("calcula alimentoTotal correctamente", () => {
    const r = calcular(base);
    expect(r.alimentoTotal).toBe(19920);
  });

  it("calcula costoAlimento correctamente", () => {
    const r = calcular(base);
    expect(r.costoAlimento).toBe(23904);
  });

  it("calcula ingreso correctamente", () => {
    const r = calcular(base);
    expect(r.ingreso).toBe(44625);
  });

  it("calcula utilidad correctamente", () => {
    const r = calcular(base);
    expect(r.utilidad).toBe(20721);
  });

  it("calcula dias correctamente", () => {
    const r = calcular(base);
    expect(r.dias).toBe(196);
  });

  it("calcula costoKg correctamente", () => {
    const r = calcular(base);
    expect(r.costoKg).toBeCloseTo(1.8748, 4);
  });

  it("alimentoTotal es 0 si gananciaPeso <= 0", () => {
    const r = calcular({ ...base, pesoCosecha: 5 });
    expect(r.alimentoTotal).toBe(0);
  });

  it("costoKg es 0 si biomasaCosecha es 0", () => {
    const r = calcular({ ...base, densidad: 0 });
    expect(r.costoKg).toBe(0);
  });

  it("dias es 0 si GPD es 0", () => {
    const r = calcular({ ...base, gpd: 0 });
    expect(r.dias).toBe(0);
  });
});

describe("calcular — energía (estimación eléctrica)", () => {
  it("calcula costo de bombeo y aireación eléctrica", () => {
    const r = calcular({
      volumen: 1000, densidad: 30, pesoInicial: 10, pesoCosecha: 500,
      supervivencia: 85, fcr: 1.6, precioAlimento: 1.2, precioVenta: 3.5, gpd: 2.5,
      bombaHP: 2, bombaCount: 2, bombaHoursDay: 12,
      aireadorHP: 1, aireadorCount: 4, aireadorHoursDay: 8, precioKWh: 0.15,
    });
    expect(r.costoBombeoElect).toBeCloseTo(1052.7552, 4);
    expect(r.costoAireacionElect).toBeCloseTo(701.8368, 4);
    expect(r.costoElectTotal).toBeCloseTo(1754.592, 4);
  });

  it("recibo real sobreescribe estimación eléctrica", () => {
    const r = calcular({
      volumen: 1000, densidad: 30, pesoInicial: 10, pesoCosecha: 500,
      supervivencia: 85, fcr: 1.6, precioAlimento: 1.2, precioVenta: 3.5, gpd: 2.5,
      gastoPeriodoElect: 5000, diasPeriodoElect: 30,
      bombaHP: 999, // should be ignored
    });
    expect(r.costoElectTotal).toBeCloseTo(32666.67, 2);
    expect(r.costoBombeoElect).toBe(0);
    expect(r.costoAireacionElect).toBe(0);
  });

  it("costoEnergiaTotal es undefined sin datos de energía", () => {
    const r = calcular({
      volumen: 1000, densidad: 30, pesoInicial: 10, pesoCosecha: 500,
      supervivencia: 85, fcr: 1.6, precioAlimento: 1.2, precioVenta: 3.5, gpd: 2.5,
    });
    expect(r.costoEnergiaTotal).toBeUndefined();
  });

  it("usa diasCiclo si se proporciona en lugar de dias calculados", () => {
    const r = calcular({
      volumen: 1000, densidad: 30, pesoInicial: 10, pesoCosecha: 500,
      supervivencia: 85, fcr: 1.6, precioAlimento: 1.2, precioVenta: 3.5, gpd: 2.5,
      bombaHP: 2, bombaCount: 2, bombaHoursDay: 12, precioKWh: 0.15,
      diasCiclo: 150,
    });
    expect(r.dias).toBe(196);
    expect(r.costoBombeoElect).toBeCloseTo(805.68, 4);
  });
});

describe("calcular — energía (combustible)", () => {
  it("calcula costo de combustible", () => {
    const r = calcular({
      volumen: 1000, densidad: 30, pesoInicial: 10, pesoCosecha: 500,
      supervivencia: 85, fcr: 1.6, precioAlimento: 1.2, precioVenta: 3.5, gpd: 2.5,
      motorBombaConsumo: 5, motorBombaHoursDay: 6,
      motorAireadorConsumo: 3, motorAireadorHoursDay: 8, precioCombustible: 1.1,
    });
    expect(r.costoBombeoComb).toBeCloseTo(6468, 0);
    expect(r.costoAireacionComb).toBeCloseTo(5174.40, 2);
    expect(r.costoCombTotal).toBeCloseTo(11642.40, 2);
  });

  it("recibo real sobreescribe estimación de combustible", () => {
    const r = calcular({
      volumen: 1000, densidad: 30, pesoInicial: 10, pesoCosecha: 500,
      supervivencia: 85, fcr: 1.6, precioAlimento: 1.2, precioVenta: 3.5, gpd: 2.5,
      gastoPeriodoComb: 3000, diasPeriodoComb: 30,
      motorBombaConsumo: 999,
    });
    expect(r.costoCombTotal).toBeCloseTo(19600, 2);
  });
});

describe("calcular — costoTotalFinal", () => {
  it("suma alimento + energía cuando hay datos de energía", () => {
    const r = calcular({
      volumen: 1000, densidad: 30, pesoInicial: 10, pesoCosecha: 500,
      supervivencia: 85, fcr: 1.6, precioAlimento: 1.2, precioVenta: 3.5, gpd: 2.5,
      bombaHP: 2, bombaCount: 2, bombaHoursDay: 12, precioKWh: 0.15,
    });
    expect(r.costoTotalFinal).toBeCloseTo(23904 + 1052.7552, 2);
  });

  it("costoEnergiaPorKg se calcula correctamente", () => {
    const r = calcular({
      volumen: 1000, densidad: 30, pesoInicial: 10, pesoCosecha: 500,
      supervivencia: 85, fcr: 1.6, precioAlimento: 1.2, precioVenta: 3.5, gpd: 2.5,
      bombaHP: 2, bombaCount: 2, bombaHoursDay: 12, precioKWh: 0.15,
    });
    expect(r.costoEnergiaPorKg).toBeCloseTo(1052.7552 / 12750, 6);
  });
});

describe("calcVolumenRectangular", () => {
  it("10×5×1.5 = 75 m³", () => {
    const r = calcVolumenRectangular(10, 5, 1.5);
    expect(r.volumenM3).toBe(75);
    expect(r.litros).toBe(75000);
  });

  it("0 dimensiones dan 0", () => {
    const r = calcVolumenRectangular(0, 5, 1.5);
    expect(r.volumenM3).toBe(0);
  });
});

describe("calcVolumenCircular", () => {
  it("d=10, prof=1.5 ≈ 117.81 m³", () => {
    const r = calcVolumenCircular(10, 1.5);
    expect(r.volumenM3).toBeCloseTo(117.8097, 4);
    expect(r.litros).toBeCloseTo(117809.7, 1);
  });
});

describe("calcVolumenTrapezoidal", () => {
  it("10×5 sup, 8×4 inf, 1.5 prof", () => {
    const r = calcVolumenTrapezoidal(10, 5, 8, 4, 1.5);
    expect(r.volumenM3).toBe(61);
  });
});

describe("calcVolumenTanqueCilindrico", () => {
  it("d=2, h=3 ≈ 9.42 m³", () => {
    const r = calcVolumenTanqueCilindrico(2, 3);
    expect(r.volumenM3).toBeCloseTo(9.4248, 4);
  });
});

describe("calcVolumen", () => {
  it("delega a rectangular correctamente", () => {
    const r = calcVolumen({ forma: "rectangular", largo: 10, ancho: 5, profundidad: 1.5 });
    expect(r.volumenM3).toBe(75);
  });

  it("delega a circular correctamente", () => {
    const r = calcVolumen({ forma: "circular", diametro: 10, profundidad: 1.5 });
    expect(r.volumenM3).toBeCloseTo(117.8097, 4);
  });

  it("manual da 0", () => {
    const r = calcVolumen({ forma: "manual" });
    expect(r.volumenM3).toBe(0);
  });
});

describe("calcRacion", () => {
  it("calcula ración diaria y por comida", () => {
    const r = calcRacion({ biomasaActual: 5000, tasaAlimentacion: 3, comidasPorDia: 4 });
    expect(r.racionDiaria).toBe(150);
    expect(r.racionComida).toBe(37.5);
  });

  it("tasa de 0% da ración 0", () => {
    const r = calcRacion({ biomasaActual: 5000, tasaAlimentacion: 0, comidasPorDia: 4 });
    expect(r.racionDiaria).toBe(0);
    expect(r.racionComida).toBe(0);
  });

  it("comidasPorDia = 0 no divide (NaN protection)", () => {
    const r = calcRacion({ biomasaActual: 5000, tasaAlimentacion: 3, comidasPorDia: 0 });
    expect(r.racionDiaria).toBe(150);
    expect(r.racionComida).toBe(Infinity);
  });
});
