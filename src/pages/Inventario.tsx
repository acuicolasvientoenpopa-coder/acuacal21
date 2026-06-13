import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/store/auth";
import { useTranslation } from "@/store/language";
import { useCurrency } from "@/store/currency";
import { useInventario } from "@/store/inventario";
import { toast } from "@/components/Toast";
import { PRODUCTO_DEFAULT, CATEGORIAS } from "@/core/inventario-types";
import type { Producto, MovimientoInventario } from "@/core/inventario-types";
import { createApi } from "@/services/api";
import { useLookups } from "@/store/lookups";

function apiToProducto(r: any): Producto {
  return {
    id: r.id, nombre: r.nombre, categoria: r.categoria || "alimento",
    unidad: "", presentacion: "", precioUnitario: r.precio || 0,
    stockActual: r.cantidad || 0, stockMinimo: r.minimo || 0,
    fincaId: r.fincaId || "", proveedor: "", notas: "",
    createdAt: r.createdAt || "", updatedAt: r.updatedAt || "",
  };
}

function productoToApi(p: Producto) {
  return { nombre: p.nombre, categoria: p.categoria, cantidad: p.stockActual, minimo: p.stockMinimo, precio: p.precioUnitario, fincaId: p.fincaId };
}

export default function Inventario() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { fmt } = useCurrency();
  const { fincas } = useLookups();
  const { productos, movimientos, alertas, valorTotalInventario, saveProducto, deleteProducto, saveMovimiento, reload } = useInventario();

  const client = useMemo(() => token ? createApi(token) : null, [token]);

  useEffect(() => {
    if (!client) return;
    Promise.all([
      client.get<any[]>("/inventario/productos").catch(() => null),
      client.get<any[]>("/inventario/movimientos").catch(() => null),
    ]).then(([prods, movs]) => {
      if (prods && prods.length > 0) {
        prods.forEach((p: any) => saveProducto(apiToProducto(p)));
      }
      if (movs && movs.length > 0) {
        movs.forEach((m: any) => {
          saveMovimiento({
            id: m.id, productoId: m.productoId || "", tipo: m.tipo || "entrada",
            cantidad: m.cantidad || 0, costoTotal: 0, referencia: "",
            fincaId: "", fecha: m.fecha?.slice(0, 10) || "",
            responsable: "", notas: "", createdAt: m.createdAt || "",
          });
        });
      }
      reload();
    });
  }, [client, saveProducto, saveMovimiento, reload]);

  const [tab, setTab] = useState<"productos" | "movimientos" | "alertas">("productos");
  const [showProdForm, setShowProdForm] = useState(false);
  const [editProd, setEditProd] = useState<Producto | null>(null);
  const [pf, setPf] = useState<Producto>(PRODUCTO_DEFAULT());
  const [showMovForm, setShowMovForm] = useState(false);
  const [mf, setMf] = useState<MovimientoInventario>({
    id: "", productoId: "", tipo: "entrada", cantidad: 0, costoTotal: 0,
    referencia: "", fincaId: "", fecha: new Date().toISOString().slice(0, 10),
    responsable: "", notas: "", createdAt: "",
  });

  const openNewProd = () => { setEditProd(null); setPf(PRODUCTO_DEFAULT()); setShowProdForm(true); };
  const openEditProd = (p: Producto) => { setEditProd(p); setPf({ ...p }); setShowProdForm(true); };

  const saveProd = async () => {
    if (!pf.nombre.trim()) { toast("El nombre es obligatorio", "error"); return; }
    if (!pf.fincaId) { toast("Seleccioná una finca", "error"); return; }
    const now = new Date().toISOString();
    const prod = editProd
      ? { ...pf, id: pf.id, updatedAt: now }
      : { ...pf, id: `inv_prod_${Date.now()}`, createdAt: now, updatedAt: now };
    saveProducto(prod);
    try {
      if (editProd) {
        const result = await client?.mutate("PUT", `/inventario/productos/${prod.id}`, productoToApi(prod));
        if (result?.ok) { /* already saved locally */ }
      } else {
        const created = await client?.post<any>("/inventario/productos", productoToApi(prod));
        if (created?.id) {
          deleteProducto(prod.id);
          saveProducto(apiToProducto(created));
        }
      }
    } catch (e: any) { console.error("[Inventario] Error:", e?.message || e); }
    setShowProdForm(false);
    toast(editProd ? "Producto actualizado" : "Producto creado", "success");
  };

  const delProd = async (id: string) => {
    deleteProducto(id);
    try { await client?.del(`/inventario/productos/${id}`); } catch (e: any) { console.error("[Inventario] Error:", e?.message || e); }
    toast("Producto eliminado", "info");
  };

  const saveMov = async () => {
    if (!mf.productoId || mf.cantidad <= 0) { toast("Seleccioná producto e ingresá cantidad", "error"); return; }
    const prod = productos.find((p) => p.id === mf.productoId);
    if (!prod) return;
    const mov = { ...mf, id: `inv_mov_${Date.now()}`, costoTotal: mf.cantidad * prod.precioUnitario, createdAt: new Date().toISOString() };
    saveMovimiento(mov);
    try {
      await client?.post("/inventario/movimientos", { tipo: mov.tipo, cantidad: mov.cantidad, productoId: mov.productoId, fecha: mov.fecha });
    } catch (e: any) { console.error("[Inventario] Error:", e?.message || e); }
    setShowMovForm(false);
    toast("Movimiento registrado", "success");
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("inventarioTitle")}</h2>
          <p className="page-subtitle">{t("inventarioSub")}</p>
        </div>
      </div>

      <div className="card" style={{ borderColor: "var(--accent)", marginBottom: 16 }}>
        <div className="results-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          <div className="result-card highlight"><div className="result-value">{fmt(valorTotalInventario)}</div><div className="result-label">{t("invValorTotal")}</div></div>
          <div className="result-card"><div className="result-value">{productos.length}</div><div className="result-label">{t("invProductos")}</div></div>
          <div className="result-card" style={{ borderColor: alertas.length > 0 ? "var(--danger)" : undefined }}>
            <div className="result-value" style={{ color: alertas.length > 0 ? "var(--danger)" : undefined }}>{alertas.length}</div>
            <div className="result-label">{t("invAlertas")}</div>
          </div>
        </div>
      </div>

      <div className="mini-tabs" style={{ marginBottom: 16 }}>
        <button className={"mini-tab" + (tab === "productos" ? " active" : "")} onClick={() => setTab("productos")}>📦 {t("invProductos")} ({productos.length})</button>
        <button className={"mini-tab" + (tab === "movimientos" ? " active" : "")} onClick={() => setTab("movimientos")}>🔄 {t("invMovimientos")} ({movimientos.length})</button>
        <button className={"mini-tab" + (tab === "alertas" ? " active" : "")} onClick={() => setTab("alertas")}>⚠️ {t("invAlertas")} ({alertas.length})</button>
      </div>

      {tab === "productos" && (
        <div>
          <button className="btn-primary btn-sm" style={{ marginBottom: 12 }} onClick={openNewProd}>＋ {t("invNuevoProducto")}</button>
          {productos.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📦</div><p>{t("invSinProductos")}</p></div>
          ) : (
            <div className="card">
              {productos.map((p) => {
                const bajo = p.stockMinimo > 0 && p.stockActual <= p.stockMinimo;
                return (
                  <div key={p.id} style={{ borderBottom: "1px solid var(--border)", padding: "12px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div><strong>{p.nombre}</strong><span className="vet-tag" style={{ fontSize: 11, marginLeft: 8, background: "var(--surface2)" }}>{p.categoria}</span></div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-sm" onClick={() => openEditProd(p)}>✏️</button>
                        <button className="btn-sm" style={{ color: "var(--danger)" }} onClick={() => delProd(p.id)}>🗑️</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4, display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>{t("invUnidad")}: {p.unidad || "—"}</span>
                      <span>{t("invPresentacion")}: {p.presentacion || "—"}</span>
                      <span>{t("invPrecioUnitario")}: {fmt(p.precioUnitario)}</span>
                      <span style={{ color: bajo ? "var(--danger)" : undefined, fontWeight: bajo ? 700 : undefined }}>{t("invStockActual")}: {p.stockActual} {p.unidad}</span>
                      {p.stockMinimo > 0 && <span>{t("invStockMinimo")}: {p.stockMinimo}</span>}
                    </div>
                    {p.proveedor && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{t("invProveedor")}: {p.proveedor}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "movimientos" && (
        <div>
          <button className="btn-primary btn-sm" style={{ marginBottom: 12 }} onClick={() => setShowMovForm(true)}>＋ {t("invNuevoMovimiento")}</button>
          {movimientos.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🔄</div><p>{t("invSinMovimientos")}</p></div>
          ) : (
            <div className="card">
              {[...movimientos].reverse().slice(0, 50).map((m) => {
                const prod = productos.find((p) => p.id === m.productoId);
                return (
                  <div key={m.id} style={{ borderBottom: "1px solid var(--border)", padding: "10px 0", fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <strong>{prod?.nombre || m.productoId}</strong>
                        <span className={`badge ${m.tipo === "entrada" ? "badge-green" : "badge-red"}`} style={{ marginLeft: 8, fontSize: 10 }}>{m.tipo === "entrada" ? "Entrada" : "Salida"}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, color: m.tipo === "entrada" ? "var(--accent)" : "var(--danger)" }}>
                          {m.tipo === "entrada" ? "+" : "-"}{m.cantidad}
                        </span>
                        <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text3)" }}>{m.fecha}</span>
                      </div>
                    </div>
                    {m.responsable && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>👤 {m.responsable}</div>}
                    {m.notas && <div style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic", marginTop: 2 }}>{m.notas}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "alertas" && (
        <div>
          {alertas.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✅</div><p>Sin alertas de stock</p></div>
          ) : (
            <div className="card">
              {alertas.map((p) => (
                <div key={p.id} style={{ borderBottom: "1px solid var(--border)", padding: "10px 0", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{p.nombre}</strong>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>{t("invStockActual")}: {p.stockActual} / {p.stockMinimo}</div>
                  </div>
                  <button className="btn-sm" onClick={() => { setPf({ ...p }); setShowProdForm(true); setEditProd(p); }}>✏️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showProdForm && (
        <div className="modal-overlay" onClick={() => setShowProdForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">📦 {editProd ? "Editar" : "Nuevo"} Producto</div>
            <div className="form-grid">
              <label>{t("invNombre")}<input value={pf.nombre} onChange={(e) => setPf({ ...pf, nombre: e.target.value })} placeholder="Ej: Alimento Tilapia 40%" /></label>
              <label>{t("invCategoria")}<select value={pf.categoria} onChange={(e) => setPf({ ...pf, categoria: e.target.value as any })}>{CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
              <label>Finca<select value={pf.fincaId} onChange={(e) => setPf({ ...pf, fincaId: e.target.value })}><option value="">Seleccionar</option>{fincas.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
              <label>{t("invUnidad")}<input value={pf.unidad} onChange={(e) => setPf({ ...pf, unidad: e.target.value })} placeholder="Ej: kg" /></label>
              <label>{t("invPresentacion")}<input value={pf.presentacion} onChange={(e) => setPf({ ...pf, presentacion: e.target.value })} placeholder="Ej: saco 40kg" /></label>
              <label>{t("invPrecioUnitario")}<input type="number" value={pf.precioUnitario || ""} onChange={(e) => setPf({ ...pf, precioUnitario: Number(e.target.value) })} placeholder="0" /></label>
              <label>{t("invStockActual")}<input type="number" value={pf.stockActual || ""} onChange={(e) => setPf({ ...pf, stockActual: Number(e.target.value) })} placeholder="0" /></label>
              <label>{t("invStockMinimo")}<input type="number" value={pf.stockMinimo || ""} onChange={(e) => setPf({ ...pf, stockMinimo: Number(e.target.value) })} placeholder="0" /></label>
              <label>{t("invProveedor")}<input value={pf.proveedor} onChange={(e) => setPf({ ...pf, proveedor: e.target.value })} placeholder="Ej: Acuícola S.A." /></label>
              <label style={{ gridColumn: "1 / -1" }}>{t("invNotas")}<textarea value={pf.notas} onChange={(e) => setPf({ ...pf, notas: e.target.value })} /></label>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowProdForm(false)}>{t("cancelar")}</button>
              <button className="btn-primary" onClick={saveProd}>💾 {t("guardar")}</button>
            </div>
          </div>
        </div>
      )}

      {showMovForm && (
        <div className="modal-overlay" onClick={() => setShowMovForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">🔄 {t("invNuevoMovimiento")}</div>
            <div className="form-grid">
              <label>{t("invProducto")}<select value={mf.productoId} onChange={(e) => setMf({ ...mf, productoId: e.target.value })}><option value="">Seleccionar</option>{productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
              <label>{t("invTipo")}<select value={mf.tipo} onChange={(e) => setMf({ ...mf, tipo: e.target.value as any })}><option value="entrada">Entrada</option><option value="salida">Salida</option></select></label>
              <label>{t("invCantidad")}<input type="number" value={mf.cantidad || ""} onChange={(e) => setMf({ ...mf, cantidad: Number(e.target.value) })} placeholder="0" /></label>
              <label>Fecha<input type="date" value={mf.fecha} onChange={(e) => setMf({ ...mf, fecha: e.target.value })} /></label>
              <label>{t("invResponsable")}<input value={mf.responsable} onChange={(e) => setMf({ ...mf, responsable: e.target.value })} /></label>
              <label>{t("invReferencia")}<input value={mf.referencia} onChange={(e) => setMf({ ...mf, referencia: e.target.value })} placeholder="Factura #" /></label>
              <label>Finca <input value={mf.fincaId} onChange={(e) => setMf({ ...mf, fincaId: e.target.value })} /></label>
              <label style={{ gridColumn: "1 / -1" }}>{t("invNotas")}<textarea value={mf.notas} onChange={(e) => setMf({ ...mf, notas: e.target.value })} /></label>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowMovForm(false)}>{t("cancelar")}</button>
              <button className="btn-primary" onClick={saveMov}>💾 {t("guardar")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
