import jsPDF from "jspdf";

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
