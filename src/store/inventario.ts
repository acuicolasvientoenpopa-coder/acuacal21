import { useState, useCallback } from "react";
import type { Producto, MovimientoInventario } from "@/core/inventario-types";

const PROD_KEY = "acuical_inventario_productos";
const MOV_KEY = "acuical_inventario_movimientos";

function loadProd(): Producto[] {
  try { return JSON.parse(localStorage.getItem(PROD_KEY) || "[]"); } catch { return []; }
}

function loadMov(): MovimientoInventario[] {
  try { return JSON.parse(localStorage.getItem(MOV_KEY) || "[]"); } catch { return []; }
}

export function useInventario() {
  const [productos, setProductos] = useState<Producto[]>(loadProd);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(loadMov);

  const reload = useCallback(() => {
    setProductos(loadProd());
    setMovimientos(loadMov());
  }, []);

  const saveProducto = useCallback((p: Producto) => {
    const next = productos.some((x) => x.id === p.id)
      ? productos.map((x) => (x.id === p.id ? p : x))
      : [...productos, { ...p, id: p.id || `inv_prod_${Date.now()}`, createdAt: p.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }];
    setProductos(next);
    localStorage.setItem(PROD_KEY, JSON.stringify(next));
  }, [productos]);

  const deleteProducto = useCallback((id: string) => {
    const next = productos.filter((p) => p.id !== id);
    setProductos(next);
    localStorage.setItem(PROD_KEY, JSON.stringify(next));
  }, [productos]);

  const saveMovimiento = useCallback((m: MovimientoInventario) => {
    const entry = { ...m, id: m.id || `inv_mov_${Date.now()}`, createdAt: m.createdAt || new Date().toISOString() };
    const nextMov = [...movimientos, entry];
    setMovimientos(nextMov);
    localStorage.setItem(MOV_KEY, JSON.stringify(nextMov));

    const prodIdx = productos.findIndex((p) => p.id === m.productoId);
    if (prodIdx >= 0) {
      const diff = m.tipo === "entrada" ? m.cantidad : -m.cantidad;
      const nextProd = [...productos];
      nextProd[prodIdx] = { ...nextProd[prodIdx], stockActual: Math.max(0, nextProd[prodIdx].stockActual + diff), updatedAt: new Date().toISOString() };
      setProductos(nextProd);
      localStorage.setItem(PROD_KEY, JSON.stringify(nextProd));
    }
  }, [movimientos, productos]);

  const alertas = productos.filter((p) => p.stockMinimo > 0 && p.stockActual <= p.stockMinimo);

  const valorTotalInventario = productos.reduce((s, p) => s + p.stockActual * p.precioUnitario, 0);

  return { productos, movimientos, alertas, valorTotalInventario, saveProducto, deleteProducto, saveMovimiento, reload };
}
