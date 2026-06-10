export type CategoriaProducto = "alimento" | "medicamento" | "insumo" | "equipo";

export interface Producto {
  id: string;
  nombre: string;
  categoria: CategoriaProducto;
  unidad: string;
  presentacion: string;
  precioUnitario: number;
  stockActual: number;
  stockMinimo: number;
  proveedor: string;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

export interface MovimientoInventario {
  id: string;
  productoId: string;
  tipo: "entrada" | "salida";
  cantidad: number;
  costoTotal: number;
  referencia: string;
  fincaId: string;
  fecha: string;
  responsable: string;
  notas: string;
  createdAt: string;
}

export const PRODUCTO_DEFAULT = (): Producto => ({
  id: "",
  nombre: "",
  categoria: "alimento",
  unidad: "kg",
  presentacion: "",
  precioUnitario: 0,
  stockActual: 0,
  stockMinimo: 0,
  proveedor: "",
  notas: "",
  createdAt: "",
  updatedAt: "",
});

export const CATEGORIAS: { value: CategoriaProducto; label: string }[] = [
  { value: "alimento", label: "Alimento" },
  { value: "medicamento", label: "Medicamento" },
  { value: "insumo", label: "Insumo" },
  { value: "equipo", label: "Equipo" },
];
