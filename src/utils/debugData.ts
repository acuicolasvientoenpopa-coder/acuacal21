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
  toast("Todos los datos de prueba generados", "success");
}

export function clearAll() {
  localStorage.removeItem("aquacalc_bitacora");
  localStorage.removeItem("aquacalc_fincas");
  localStorage.removeItem("aquacalc_params_overrides");
  localStorage.removeItem("aquacalc_custom_species");
  localStorage.removeItem("aquacalc_profile");
  toast("Todos los datos de prueba eliminados", "success");
}
