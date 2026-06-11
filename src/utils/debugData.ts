import { toast } from "@/components/Toast";

const FINCAS = [
  "Estanque A1", "Estanque A2", "Estanque B1", "Estanque B2",
  "Tilapia Norte", "Camaronera Sur", "Piscigranja Central",
];

const ESPECIES = ["Tilapia", "Trucha", "Camarón", "Guapote", "Pangasio", "Carpa"];

function rand(min: number, max: number, decimals = 0): number {
  const v = Math.random() * (max - min) + min;
  return decimals ? Number(v.toFixed(decimals)) : Math.round(v);
}

function randDate(daysBack: number): string {
  const d = new Date(Date.now() - Math.random() * daysBack * 86400000);
  return d.toLocaleDateString();
}

export function generateBitacora(count = 20) {
  const records: any[] = [];
  for (let i = 0; i < count; i++) {
    records.push({
      id: "r_" + Date.now() + "_" + i,
      fecha: randDate(90),
      estanque: FINCAS[rand(0, FINCAS.length - 1)],
      especie: ESPECIES[rand(0, ESPECIES.length - 1)],
      alimento: rand(10, 200, 1).toString(),
      mortalidades: rand(0, 15).toString(),
      pesoMuestreo: rand(50, 600, 1).toString(),
      oxigeno: rand(2, 12, 1).toString(),
      temperatura: rand(18, 34, 1).toString(),
      ph: rand(5.5, 9.5, 1).toString(),
      amonio: rand(0, 1.5, 2).toString(),
      nitrito: rand(0, 1.0, 2).toString(),
      salinidad: rand(0, 35, 1).toString(),
      biomasa: rand(50, 2000, 1).toString(),
      sgr: rand(1, 5, 2).toString(),
      fcrAcum: rand(0.8, 3.0, 2).toString(),
      observaciones: "",
    });
  }
  localStorage.setItem("aquacalc_bitacora", JSON.stringify(records));
  toast(`Bitácora: ${count} registros generados`, "info");
}

export function generateFincas(count = 6) {
  const fincas = [];
  for (let i = 0; i < count; i++) {
    fincas.push({
      id: "f_" + Date.now() + "_" + i,
      nombre: FINCAS[i % FINCAS.length],
      ubicacion: ["Norte", "Sur", "Centro", "Este", "Oeste"][rand(0, 4)],
      descripcion: "Generado automáticamente para pruebas",
    });
  }
  localStorage.setItem("aquacalc_fincas", JSON.stringify(fincas));
  toast(`Fincas: ${count} generadas`, "info");
}

export function generateParams() {
  const overrides: Record<string, any> = {};
  ESPECIES.forEach((esp) => {
    overrides[esp.toLowerCase()] = {
      pesoInicial: rand(10, 100),
      pesoCosecha: rand(300, 2000),
      supervivencia: rand(60, 95),
      fcr: rand(1.2, 2.8, 2),
      precioVenta: rand(2, 8, 2),
      gpd: rand(1, 5, 2),
      densidad: rand(10, 100),
      tasaAlim: rand(1.5, 6, 2),
    };
  });
  localStorage.setItem("aquacalc_params_overrides", JSON.stringify(overrides));
  toast("Parámetros generados para todas las especies", "info");
}

export function generateAll() {
  generateBitacora(25);
  generateFincas(6);
  generateParams();
  generateFinanzas();
  generateEspecies();
  generateInventario();
  generateMicrobiologia();
  generateVeterinaria();
  toast("Todos los datos de prueba generados", "success");
}

export function generateFinanzas() {
  const existing = JSON.parse(localStorage.getItem("aquacalc_fincas") || "[]");
  let fincas = existing;
  if (fincas.length === 0) {
    fincas = [];
    for (let i = 0; i < 6; i++) {
      fincas.push({
        id: "f_" + Date.now() + "_" + i,
        nombre: FINCAS[i % FINCAS.length],
        ubicacion: ["Norte", "Sur", "Centro", "Este", "Oeste"][rand(0, 4)],
        descripcion: "",
      });
    }
  }

  const records: any[] = fincas.map((f: any, i: number) => ({
    id: "fin_" + Date.now() + "_" + i,
    fincaId: f.id,
    fincaNombre: f.nombre,
    semilla: rand(50000, 500000),
    alimento: rand(200000, 1500000),
    medicacion: rand(0, 100000),
    electricidad: rand(30000, 200000),
    combustible: rand(0, 150000),
    manoObra: rand(100000, 500000),
    mantenimiento: rand(10000, 80000),
    transporte: rand(20000, 120000),
    otros: rand(0, 50000),
    biomasaCosechada: rand(500, 5000),
    precioVenta: rand(1800, 5500),
    diasCiclo: [120, 150, 180, 210, 240][rand(0, 4)],
  }));

  localStorage.setItem("aquacalc_finanzas", JSON.stringify(records));
  toast(`Finanzas: ${records.length} registros generados`, "info");
}

export function generateEspecies(count = 6) {
  const custom = ESPECIES.slice(0, count).map((nombre, i) => ({
    id: "sp_custom_" + Date.now() + "_" + i,
    nombre,
    params: {
      densidad: rand(10, 100),
      pesoInicial: rand(10, 100),
      pesoCosecha: rand(300, 2000),
      fcr: rand(1.2, 2.8, 2),
      tasaAlim: rand(1.5, 6, 2),
      comidasDia: rand(2, 4),
      precioAlimento: rand(300, 800),
      precioVenta: rand(2, 8, 2),
      supervivencia: rand(60, 95),
      gpd: rand(1, 5, 2),
    },
    createdAt: new Date().toISOString(),
  }));
  localStorage.setItem("aquacalc_custom_species", JSON.stringify(custom));
  toast(`Especies: ${count} generadas`, "info");
}

export function generateInventario() {
  const productos = [
    { nombre: "Alimento Tilapia 40%", categoria: "alimento", precioUnitario: 450, stockMinimo: 5 },
    { nombre: "Alimento Trucha 42%", categoria: "alimento", precioUnitario: 520, stockMinimo: 5 },
    { nombre: "Oxígeno medicinal", categoria: "medicamento", precioUnitario: 1200, stockMinimo: 2 },
    { nombre: "Red de pesca 2m", categoria: "equipo", precioUnitario: 8500, stockMinimo: 1 },
    { nombre: "Probiotico líquido", categoria: "insumo", precioUnitario: 3200, stockMinimo: 3 },
    { nombre: "Cal hidratada", categoria: "insumo", precioUnitario: 1800, stockMinimo: 10 },
  ];
  const prods = productos.map((p, i) => ({
    id: "prod_" + Date.now() + "_" + i,
    ...p,
    stockActual: rand(1, 50),
    createdAt: new Date().toISOString(),
  }));
  localStorage.setItem("aquacalc_inventario_productos", JSON.stringify(prods));

  const movs = prods.map((p, i) => ({
    id: "mov_" + Date.now() + "_" + i,
    productoId: p.id,
    tipo: i % 2 === 0 ? "entrada" : "salida",
    cantidad: rand(1, 20),
    fecha: randDate(30),
    descripcion: "Movimiento generado",
  }));
  localStorage.setItem("aquacalc_inventario_movimientos", JSON.stringify(movs));
  toast(`Inventario: ${prods.length} productos + ${movs.length} movimientos`, "info");
}

export function generateMicrobiologia() {
  const cultivos = [];
  for (let i = 0; i < 6; i++) {
    cultivos.push({
      id: "cult_" + Date.now() + "_" + i,
      fecha: randDate(30),
      estanqueNombre: FINCAS[rand(0, FINCAS.length - 1)],
      especie: ESPECIES[rand(0, ESPECIES.length - 1)],
      tipoMuestra: ["agua", "sedimento", "branquias", "hígado"][rand(0, 3)],
      organo: ["agua", "fondo", "branquias", "hígado"][rand(0, 3)],
      resultado: ["positivo", "negativo", "sospechoso"][rand(0, 2)],
      agente: ["Aeromonas", "Pseudomonas", "Streptococcus", "Ninguno"][rand(0, 3)],
      carga: ["baja", "media", "alta"][rand(0, 2)],
    });
  }
  localStorage.setItem("aquacalc_cultivos", JSON.stringify(cultivos));

  const meds = [];
  for (let i = 0; i < 4; i++) {
    const inicio = new Date(Date.now() - rand(5, 60) * 86400000);
    const fin = new Date(inicio.getTime() + rand(5, 15) * 86400000);
    meds.push({
      id: "med_" + Date.now() + "_" + i,
      fechaInicio: inicio.toLocaleDateString(),
      fechaFin: fin.toLocaleDateString(),
      estanqueNombre: FINCAS[rand(0, FINCAS.length - 1)],
      producto: ["Oxitetraciclina", "Formol", "Sal", "Permanganato"][rand(0, 3)],
      dosis: rand(1, 20, 1) + " mg/L",
      via: ["oral", "baño", "inyección"][rand(0, 2)],
      duracion: rand(5, 15) + " días",
      retiroDias: rand(10, 30),
      estado: "completado",
    });
  }
  localStorage.setItem("aquacalc_medicacion", JSON.stringify(meds));
  toast(`Microbiología: ${cultivos.length} cultivos + ${meds.length} medicaciones`, "info");
}

export function generateVeterinaria(count = 4) {
  const reports = [];
  for (let i = 0; i < count; i++) {
    reports.push({
      id: "vet_" + Date.now() + "_" + i,
      fecha: randDate(60),
      estanqueNombre: FINCAS[rand(0, FINCAS.length - 1)],
      diagnosticos: [
        { diagnosis: "Hipoxia", weight: rand(1, 5) },
        { diagnosis: "Branquitis", weight: rand(1, 4) },
      ],
      puntaje: rand(2, 8),
      riesgo: ["bajo", "moderado", "alto"][rand(0, 2)],
      resumen: "Reporte generado automáticamente para pruebas",
      acciones: ["Aumentar oxigenación", "Reducir alimentación", "Monitorear diario"],
      lang: "es",
    });
  }
  localStorage.setItem("aquacalc_vet_reports", JSON.stringify(reports));
  toast(`Veterinaria: ${count} reportes generados`, "info");
}

export function clearAll() {
  localStorage.removeItem("aquacalc_bitacora");
  localStorage.removeItem("aquacalc_fincas");
  localStorage.removeItem("aquacalc_params_overrides");
  localStorage.removeItem("aquacalc_custom_species");
  localStorage.removeItem("aquacalc_profile");
  localStorage.removeItem("aquacalc_finanzas");
  localStorage.removeItem("aquacalc_inventario_productos");
  localStorage.removeItem("aquacalc_inventario_movimientos");
  localStorage.removeItem("aquacalc_cultivos");
  localStorage.removeItem("aquacalc_medicacion");
  localStorage.removeItem("aquacalc_vet_reports");
  toast("Todos los datos de prueba eliminados", "success");
}
