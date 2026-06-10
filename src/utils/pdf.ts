import jsPDF from "jspdf";
import * as XLSX from "xlsx";

type RecordRow = {
  fecha: string;
  estanque: string;
  especie: string;
  alimento: string;
  mortalidades: string;
  pesoMuestreo: string;
  oxigeno: string;
  temperatura: string;
  ph: string;
  amonio: string;
  nitrito: string;
  salinidad: string;
  biomasa: string;
  sgr: string;
  fcrAcum: string;
  observaciones: string;
};

function wqColor(v: string, min: number, max: number): number[] | null {
  const n = Number(v);
  if (isNaN(n) || n === 0) return null;
  return n >= min && n <= max ? [0, 180, 120] : [220, 60, 50];
}

function wqBg(v: string, min: number, max: number): number[] | null {
  const n = Number(v);
  if (isNaN(n) || n === 0) return null;
  return n >= min && n <= max ? [220, 250, 240] : [255, 230, 230];
}

export function exportBitacoraPDF(records: RecordRow[], _t: (k: string) => string): void {
  const tr = (k: string) => _t(k) || k;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 12;
  const pageW = doc.internal.pageSize.getWidth();
  const usableW = pageW - margin * 2;
  const colW = usableW / 15;
  let y = 22;
  let pageNum = 1;

  const drawPageHeader = () => {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("AquaCalc - " + tr("bitacoraTitle"), margin, y);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(tr("exportDate") + ": " + new Date().toLocaleDateString() + "  |  " + tr("entradas") + ": " + records.length, margin, y + 4);
    y += 10;
  };

  const wqPairs: { key: keyof RecordRow; min: number; max: number }[] = [
    { key: "oxigeno", min: 2, max: 20 },
    { key: "temperatura", min: 5, max: 35 },
    { key: "ph", min: 6, max: 9 },
    { key: "amonio", min: 0, max: 0.5 },
    { key: "nitrito", min: 0, max: 0.3 },
    { key: "salinidad", min: 0, max: 35 },
  ];

  const headers = [
    { key: "fecha", label: tr("fecha") },
    { key: "estanque", label: tr("estanque") },
    { key: "especie", label: tr("especie") },
    { key: "alimento", label: tr("alimento") },
    { key: "mortalidades", label: tr("mortalidades") },
    { key: "pesoMuestreo", label: "P. Muestreo" },
    { key: "oxigeno", label: "O₂" },
    { key: "temperatura", label: "T°" },
    { key: "ph", label: "pH" },
    { key: "amonio", label: "NH₃" },
    { key: "nitrito", label: "NO₂" },
    { key: "salinidad", label: "Sal." },
    { key: "biomasa", label: "Bio." },
    { key: "sgr", label: "SGR" },
    { key: "fcrAcum", label: "FCR" },
  ];

  drawPageHeader();
  let x = margin;

  const drawTableHeaders = () => {
    doc.setFillColor(10, 22, 40);
    doc.rect(margin, y - 2, usableW, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    x = margin;
    headers.forEach((h) => {
      doc.text(h.label, x + 0.5, y + 2);
      x += colW;
    });
    y += 6;
  };

  drawTableHeaders();

  doc.setFontSize(6);
  records.forEach((r, i) => {
    if (y > 185) {
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("... " + tr("entradas") + ": " + records.length, margin, y + 3);
      doc.addPage();
      pageNum++;
      y = 20;
      drawPageHeader();
      drawTableHeaders();
    }

    if (i % 2 === 0) doc.setFillColor(248, 249, 252);
    else doc.setFillColor(255, 255, 255);
    doc.rect(margin, y - 2, usableW, 5, "F");

    x = margin;
    headers.forEach((h) => {
      const val = r[h.key as keyof RecordRow] || "—";
      const wq = wqPairs.find((w) => w.key === h.key);
      if (wq) {
        const fg = wqColor(val, wq.min, wq.max);
        const bg = wqBg(val, wq.min, wq.max);
        if (bg) {
          doc.setFillColor(bg[0], bg[1], bg[2]);
          doc.rect(x, y - 2, colW, 5, "F");
        }
        if (fg) {
          doc.setTextColor(fg[0], fg[1], fg[2]);
        } else {
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.text(String(val), x + 0.5, y + 1);
      x += colW;
    });
    y += 5;
  });

  doc.save("aquacalc_bitacora.pdf");
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

export function exportZootecnicoPDF(records: ZooRow[], filtro: string, paramLabel: string): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 12;
  const pageW = doc.internal.pageSize.getWidth();
  const usableW = pageW - margin * 2;
  const colW = usableW / 8;
  let y = 22;
  let pageNum = 1;

  const drawPageHeader = () => {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("AquaCalc - " + "Zootécnico", margin, y);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    let extra = " | " + "Parámetro: " + paramLabel;
    if (filtro) extra += " | " + "Estanque: " + filtro;
    doc.text("Exportado: " + new Date().toLocaleDateString() + extra, margin, y + 4);
    y += 10;
  };

  const wqPairs: { key: keyof ZooRow; min: number; max: number }[] = [
    { key: "oxigeno", min: 2, max: 20 },
    { key: "temperatura", min: 5, max: 35 },
    { key: "ph", min: 6, max: 9 },
    { key: "amonio", min: 0, max: 0.5 },
    { key: "nitrito", min: 0, max: 0.3 },
    { key: "salinidad", min: 0, max: 35 },
  ];

  const headers: { key: keyof ZooRow; label: string }[] = [
    { key: "fecha", label: "Fecha" },
    { key: "estanque", label: "Estanque" },
    { key: "oxigeno", label: "O₂" },
    { key: "temperatura", label: "T°" },
    { key: "ph", label: "pH" },
    { key: "amonio", label: "NH₃" },
    { key: "nitrito", label: "NO₂" },
    { key: "salinidad", label: "Sal." },
  ];

  drawPageHeader();

  const drawTableHeaders = () => {
    doc.setFillColor(10, 22, 40);
    doc.rect(margin, y - 2, usableW, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    let x = margin;
    headers.forEach((h) => {
      doc.text(h.label, x + 0.5, y + 2);
      x += colW;
    });
    y += 6;
  };

  drawTableHeaders();

  doc.setFontSize(6);
  records.forEach((r, i) => {
    if (y > 185) {
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("... continuaci\u00f3n", margin, y + 3);
      doc.addPage();
      pageNum++;
      y = 20;
      drawPageHeader();
      drawTableHeaders();
    }

    if (i % 2 === 0) doc.setFillColor(248, 249, 252);
    else doc.setFillColor(255, 255, 255);
    doc.rect(margin, y - 2, usableW, 5, "F");

    let x = margin;
    headers.forEach((h) => {
      const val = r[h.key] || "—";
      const wq = wqPairs.find((w) => w.key === h.key);
      if (wq) {
        const n = Number(val);
        if (!isNaN(n) && n > 0) {
          const ok = n >= wq.min && n <= wq.max;
          const bg = ok ? [220, 250, 240] as const : [255, 230, 230] as const;
          doc.setFillColor(bg[0], bg[1], bg[2]);
          doc.rect(x, y - 2, colW, 5, "F");
          const fg = ok ? [0, 180, 120] as const : [220, 60, 50] as const;
          doc.setTextColor(fg[0], fg[1], fg[2]);
        } else {
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.text(String(val), x + 0.5, y + 1);
      x += colW;
    });
    y += 5;
  });

  doc.save("aquacalc_zootecnico.pdf");
}

export function exportZootecnicoExcel(records: ZooRow[]): void {
  const wsData: (string | number)[][] = [
    ["Fecha", "Estanque", "O₂ (mg/L)", "Temperatura (°C)", "pH", "NH₃ (mg/L)", "NO₂ (mg/L)", "Salinidad"],
  ];
  records.forEach((r) => {
    wsData.push([
      r.fecha || "",
      r.estanque || "",
      r.oxigeno ? Number(r.oxigeno) : "",
      r.temperatura ? Number(r.temperatura) : "",
      r.ph ? Number(r.ph) : "",
      r.amonio ? Number(r.amonio) : "",
      r.nitrito ? Number(r.nitrito) : "",
      r.salinidad ? Number(r.salinidad) : "",
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [
    { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Zootécnico");
  XLSX.writeFile(wb, "aquacalc_zootecnico.xlsx");
}

export interface VetPDFData {
  pondName: string;
  fecha: string;
  symptons: { alimentacion: string[]; comportamiento: string[]; sintomas: string[]; agua: string[] };
  diagnosticos: { diagnosis: string; weight: number }[];
  riesgo: { puntaje: number; riesgo: string };
  resumen: string;
  acciones: string[];
  imagenes: string[];
  lang: string;
}

export function exportVetPDF(data: VetPDFData, _t: (k: string) => string): void {
  const tr = (k: string) => _t(k) || k;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as any;
  const margin = 16;
  const pageW = doc.internal.pageSize.getWidth();
  const usableW = pageW - margin * 2;
  let y = margin;

  const riesgoColor = (r: string): number[] => {
    if (r === "rojo") return [200, 50, 40];
    if (r === "amarillo") return [210, 160, 30];
    return [40, 170, 100];
  };

  const riesgoLabel = (r: string): string => {
    if (r === "rojo") return tr("vetAlto");
    if (r === "amarillo") return tr("vetModerado");
    return tr("vetBajo");
  };

  doc.setFillColor(10, 22, 40);
  doc.rect(0, 0, pageW, 50, "F");
  doc.setTextColor(0, 200, 150);
  doc.setFontSize(22);
  doc.text(tr("vetTitle"), margin, 22);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.text(tr("vetSub"), margin, 32);
  doc.text(data.fecha, margin, 42);

  y = 62;
  doc.setTextColor(0, 200, 150);
  doc.setFontSize(11);
  doc.text(tr("vetEstanque") + ":", margin, y);
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.text(data.pondName, margin + 50, y);

  y += 10;
  const riskColor = riesgoColor(data.riesgo.riesgo);
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.roundedRect(margin, y, usableW, 18, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(riesgoLabel(data.riesgo.riesgo), margin + 8, y + 12);
  doc.setFontSize(10);
  doc.text(tr("vetScore") + ": " + data.riesgo.puntaje, pageW - margin - 40, y + 12);

  y += 28;

  const sectionTitle = (title: string) => {
    doc.setFillColor(10, 22, 40);
    doc.rect(margin, y, usableW, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(title, margin + 4, y + 5.5);
    y += 12;
  };

  if (data.diagnosticos.length > 0) {
    sectionTitle(tr("vetDiagnosticos"));
    data.diagnosticos.forEach((d) => {
      const wColor = d.weight >= 4 ? [200, 50, 40] : d.weight >= 2 ? [210, 160, 30] : [40, 170, 100];
      doc.setFillColor(wColor[0], wColor[1], wColor[2]);
      doc.roundedRect(margin, y, 10, 6, 2, 2, "F");
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.text(d.diagnosis, margin + 16, y + 4.5);
      doc.setTextColor(100, 100, 100);
      doc.text("+" + d.weight, pageW - margin - 20, y + 4.5);
      y += 8;
      if (y > 270) { doc.addPage(); y = margin; }
    });
    y += 4;
  }

  sectionTitle(tr("vetResumen"));
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(data.resumen, usableW);
  doc.text(lines, margin, y);
  y += lines.length * 5 + 8;

  sectionTitle(tr("vetAcciones"));
  data.acciones.forEach((a) => {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.text("— " + a, margin + 4, y);
    y += 6;
    if (y > 270) { doc.addPage(); y = margin; }
  });

  if (data.imagenes && data.imagenes.length > 0) {
    if (y > 230) { doc.addPage(); y = margin; }
    sectionTitle(tr("vetFotos"));
    const imgW = 60;
    const imgH = 50;
    const gap = 8;
    let x = margin;
    data.imagenes.forEach((img, i) => {
      if (x + imgW > pageW - margin) {
        x = margin;
        y += imgH + gap;
      }
      if (y + imgH > 280) { doc.addPage(); y = margin; x = margin; }
      try {
        doc.addImage(img, "JPEG", x, y, imgW, imgH);
      } catch {
        try {
          doc.addImage(img, "PNG", x, y, imgW, imgH);
        } catch {
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(tr("vetFotoError") + " " + (i + 1), x, y + imgH / 2);
        }
      }
      x += imgW + gap;
    });
  }

  doc.save("reporte_veterinario.pdf");
}
