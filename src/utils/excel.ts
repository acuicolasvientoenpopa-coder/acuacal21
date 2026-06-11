import ExcelJS from "exceljs";

function downloadBlob(buf: ArrayBuffer, name: string): void {
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportZootecnicoExcel(records: ZooRow[]): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Zootécnico");
  ws.addRow(["Fecha", "Estanque", "O₂ (mg/L)", "Temperatura (°C)", "pH", "NH₃ (mg/L)", "NO₂ (mg/L)", "Salinidad"]);
  records.forEach((r) => {
    ws.addRow([
      r.fecha || "", r.estanque || "",
      r.oxigeno ? Number(r.oxigeno) : "",
      r.temperatura ? Number(r.temperatura) : "",
      r.ph ? Number(r.ph) : "",
      r.amonio ? Number(r.amonio) : "",
      r.nitrito ? Number(r.nitrito) : "",
      r.salinidad ? Number(r.salinidad) : "",
    ]);
  });
  ws.getColumn(1).width = 12; ws.getColumn(2).width = 18;
  ws.getColumn(3).width = 12; ws.getColumn(4).width = 16;
  ws.getColumn(5).width = 8;  ws.getColumn(6).width = 12;
  ws.getColumn(7).width = 12; ws.getColumn(8).width = 10;
  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(buf, "aquacalc_zootecnico.xlsx");
}

export interface ZooRow {
  fecha: string;
  estanque: string;
  oxigeno?: string;
  temperatura?: string;
  ph?: string;
  amonio?: string;
  nitrito?: string;
  salinidad?: string;
}

export interface FinExcelRow {
  fincaNombre: string;
  semilla: number;
  alimento: number;
  medicacion: number;
  electricidad: number;
  combustible: number;
  manoObra: number;
  mantenimiento: number;
  transporte: number;
  otros: number;
  biomasaCosechada: number;
  precioVenta: number;
  diasCiclo: number;
}

export async function exportFinanzasExcel(records: FinExcelRow[], monedaSimbolo: string, monedaCodigo: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Finanzas");
  ws.addRow([
    "Finca / Estanque",
    `Semilla (${monedaSimbolo} ${monedaCodigo})`,
    `Alimento (${monedaSimbolo} ${monedaCodigo})`,
    `Medicación (${monedaSimbolo} ${monedaCodigo})`,
    `Electricidad (${monedaSimbolo} ${monedaCodigo})`,
    `Combustible (${monedaSimbolo} ${monedaCodigo})`,
    `Mano de obra (${monedaSimbolo} ${monedaCodigo})`,
    `Mantenimiento (${monedaSimbolo} ${monedaCodigo})`,
    `Transporte (${monedaSimbolo} ${monedaCodigo})`,
    `Otros (${monedaSimbolo} ${monedaCodigo})`,
    `Total Gastos (${monedaSimbolo} ${monedaCodigo})`,
    `Biomasa (kg)`,
    `Costo/kg (${monedaSimbolo} ${monedaCodigo})`,
    `Precio venta/kg (${monedaSimbolo} ${monedaCodigo})`,
    `Ingreso Total (${monedaSimbolo} ${monedaCodigo})`,
    "Margen (%)",
    "Días ciclo",
  ]);

  for (const r of records) {
    const totalCostos =
      r.semilla + r.alimento + r.medicacion + r.electricidad + r.combustible +
      r.manoObra + r.mantenimiento + r.transporte + r.otros;
    const costoKg = r.biomasaCosechada > 0 ? totalCostos / r.biomasaCosechada : 0;
    const ingresoTotal = r.biomasaCosechada * r.precioVenta;
    const margen = ingresoTotal > 0 ? ((ingresoTotal - totalCostos) / ingresoTotal * 100) : 0;

    ws.addRow([
      r.fincaNombre, r.semilla ?? 0, r.alimento ?? 0, r.medicacion ?? 0,
      r.electricidad ?? 0, r.combustible ?? 0, r.manoObra ?? 0,
      r.mantenimiento ?? 0, r.transporte ?? 0, r.otros ?? 0,
      totalCostos, r.biomasaCosechada ?? 0, costoKg, r.precioVenta ?? 0,
      ingresoTotal, Math.round(margen * 100) / 100, r.diasCiclo ?? 0,
    ]);
  }

  const colWidths = [20, 16, 16, 14, 16, 14, 16, 16, 14, 12, 16, 12, 14, 18, 16, 12, 10];
  colWidths.forEach((w, i) => ws.getColumn(i + 1).width = w);

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(buf, "aquacalc_finanzas.xlsx");
}

export async function exportAllExcel(): Promise<void> {
  const wb = new ExcelJS.Workbook();

  try {
    const bitacora = JSON.parse(localStorage.getItem("aquacalc_bitacora") || "[]");
    if (Array.isArray(bitacora) && bitacora.length > 0) {
      const ws = wb.addWorksheet("Bitácora");
      ws.addRow(["Fecha", "Estanque", "Especie", "Alimento", "Mortalidades", "Peso", "O₂", "Temp", "pH", "NH₃", "NO₂", "Salinidad", "Biomasa", "SGR", "FCR"]);
      for (const r of bitacora) {
        ws.addRow([r.fecha, r.estanque, r.especie, r.alimento, r.mortalidades, r.pesoMuestreo, r.oxigeno, r.temperatura, r.ph, r.amonio, r.nitrito, r.salinidad, r.biomasa, r.sgr, r.fcrAcum]);
      }
      const cw = [12, 14, 12, 10, 12, 10, 8, 8, 6, 8, 8, 10, 10, 8, 8];
      cw.forEach((w, i) => ws.getColumn(i + 1).width = w);
    }
  } catch { /* skip */ }

  try {
    const cultivos = JSON.parse(localStorage.getItem("aquacalc_cultivos") || "[]");
    if (Array.isArray(cultivos) && cultivos.length > 0) {
      const ws = wb.addWorksheet("Cultivos");
      ws.addRow(["Fecha", "Estanque", "Especie", "Tipo Muestra", "Órgano", "Resultado", "Agente", "Carga"]);
      for (const r of cultivos) {
        ws.addRow([r.fecha, r.estanqueNombre, r.especie, r.tipoMuestra, r.organo, r.resultado, r.agente, r.carga]);
      }
    }
  } catch { /* skip */ }

  try {
    const meds = JSON.parse(localStorage.getItem("aquacalc_medicacion") || "[]");
    if (Array.isArray(meds) && meds.length > 0) {
      const ws = wb.addWorksheet("Medicación");
      ws.addRow(["Inicio", "Fin", "Estanque", "Producto", "Dosis", "Vía", "Duración", "Retiro", "Estado"]);
      for (const r of meds) {
        ws.addRow([r.fechaInicio, r.fechaFin, r.estanqueNombre, r.producto, r.dosis, r.via, r.duracion, r.retiroDias, r.estado]);
      }
    }
  } catch { /* skip */ }

  try {
    const fin = JSON.parse(localStorage.getItem("aquacalc_finanzas") || "[]");
    if (Array.isArray(fin) && fin.length > 0) {
      const ws = wb.addWorksheet("Finanzas");
      ws.addRow(["Finca", "Semilla", "Alimento", "Medicación", "Electricidad", "Combustible", "MO", "Manten.", "Transp.", "Otros", "Total", "Biomasa", "Costo/kg", "Precio/kg", "Ingreso", "Margen%"]);
      for (const r of fin) {
        const total = (r.semilla || 0) + (r.alimento || 0) + (r.medicacion || 0) + (r.electricidad || 0) + (r.combustible || 0) + (r.manoObra || 0) + (r.mantenimiento || 0) + (r.transporte || 0) + (r.otros || 0);
        const ingreso = (r.biomasaCosechada || 0) * (r.precioVenta || 0);
        const costoKg = r.biomasaCosechada > 0 ? total / r.biomasaCosechada : 0;
        const margen = ingreso > 0 ? ((ingreso - total) / ingreso * 100) : 0;
        ws.addRow([r.fincaNombre, r.semilla || 0, r.alimento || 0, r.medicacion || 0, r.electricidad || 0, r.combustible || 0, r.manoObra || 0, r.mantenimiento || 0, r.transporte || 0, r.otros || 0, total, r.biomasaCosechada || 0, costoKg, r.precioVenta || 0, ingreso, Math.round(margen * 100) / 100]);
      }
    }
  } catch { /* skip */ }

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(buf, "aquacalc_exportacion_completa.xlsx");
}
