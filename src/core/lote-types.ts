export interface Lote {
  id: string;
  nombre: string;
  fechaSiembra: string;
  fechaCosecha?: string;
  cantidadInicial: number;
  pesoInicial?: number;
  especieId: string;
  estanqueId: string;
  fincaId: string;
  userId: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  Especie?: { id: string; nombre: string; nombreCientifico?: string };
  trazabilidad?: {
    bitacoras: any[];
    finanzas: any[];
    veterinarias: any[];
    movimientos: any[];
  };
}
