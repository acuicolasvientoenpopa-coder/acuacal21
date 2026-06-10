import { useState } from "react";
import { useTranslation } from "@/store/language";
import { useCurrency } from "@/store/currency";
import { useInventario } from "@/store/inventario";
import { toast } from "@/components/Toast";
import { PRODUCTO_DEFAULT, CATEGORIAS } from "@/core/inventario-types";
import type { Producto, MovimientoInventario } from "@/core/inventario-types";

export default function Inventario() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { productos, movimientos, alertas, valorTotalInventario, saveProducto, deleteProducto, saveMovimiento } = useInventario();

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

  const saveProd = () => {
    if (!pf.nombre.trim()) { toast("El nombre es obligatorio", "error"); return; }
    saveProducto(editProd ? { ...pf, updatedAt: new Date().toISOString() } : { ...pf, id: `inv_prod_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setShowProdForm(false);
    toast(editProd ? "Producto actualizado" : "Producto creado", "success");
  };

  const saveMov = () => {
    if (!mf.productoId || mf.cantidad <= 0) { toast("Seleccioná producto e ingresá cantidad", "error"); return; }
    const prod = productos.find((p) => p.id === mf.productoId);
    if (!prod) return;
    saveMovimiento({ ...mf, id: `inv_mov_${Date.now()}`, costoTotal: mf.cantidad * prod.precioUnitario, createdAt: new Date().toISOString() });
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
          <div className="result-card highlight">
            <div className="result-value">{fmt(valorTotalInventario)}</div>
            <div className="result-label">{t("invValorTotal")}</div>
          </div>
          <div className="result-card">
            <div className="result-value">{productos.length}</div>
            <div className="result-label">{t("invProductos")}</div>
          </div>
          <div className="result-card" style={{ borderColor: alertas.length > 0 ? "var(--danger)" : undefined }}>
            <div className="result-value" style={{ color: alertas.length > 0 ? "var(--danger)" : undefined }}>{alertas.length}</div>
            <div className="result-label">{t("invAlertas")}</div>
          </div>
        </div>
      </div>

      <div className="mini-tabs" style={{ marginBottom: 16 }}>
        <button className={"mini-tab" + (tab === "productos" ? " active" : "")} onClick={() => setTab("productos")}>
          📦 {t("invProductos")} ({productos.length})
        </button>
        <button className={"mini-tab" + (tab === "movimientos" ? " active" : "")} onClick={() => setTab("movimientos")}>
          🔄 {t("invMovimientos")} ({movimientos.length})
        </button>
        <button className={"mini-tab" + (tab === "alertas" ? " active" : "")} onClick={() => setTab("alertas")}>
          ⚠️ {t("invAlertas")} ({alertas.length})
        </button>
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
                      <div>
                        <strong>{p.nombre}</strong>
                        <span className="vet-tag" style={{ fontSize: 11, marginLeft: 8, background: "var(--surface2)" }}>{p.categoria}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-sm" onClick={() => openEditProd(p)}>✏️</button>
                        <button className="btn-sm" style={{ color: "var(--danger)" }} onClick={() => { deleteProducto(p.id); toast("Producto eliminado", "info"); }}>🗑️</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4, display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>{t("invUnidad")}: {p.unidad}</span>
                      <span>{t("invPresentacion")}: {p.presentacion || "—"}</span>
                      <span>{t("invPrecioUnitario")}: {fmt(p.precioUnitario)}</span>
                      <span style={{ color: bajo ? "var(--danger)" : undefined, fontWeight: bajo ? 700 : undefined }}>
                        {t("invStockActual")}: {p.stockActual} {p.unidad}
                      </span>
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
                        <span style={{ fontWeight: 600 }}>{prod?.nombre || m.productoId}</span>
                        <span className={"vet-tag " + (m.tipo === "entrada" ? "riesgo-verde" : "riesgo-rojo")} style={{ fontSize: 11, marginLeft: 8 }}>
                          {m.tipo === "entrada" ? "📥 " + t("invEntrada") : "📤 " + t("invSalida")}
                        </span>
                      </div>
                      <span style={{ color: "var(--text2)", fontSize: 12 }}>{m.fecha}</span>
                    </div>
                    <div style={{ color: "var(--text2)", fontSize: 12, marginTop: 2 }}>
                      {m.cantidad} {prod?.unidad || "u"} × {fmt(prod?.precioUnitario || 0)} = {fmt(m.costoTotal)}
                      {m.referencia && <span style={{ marginLeft: 12 }}>📎 {m.referencia}</span>}
                    </div>
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
            <div className="card">
              <div className="empty-state"><div className="empty-icon">✅</div><p>{t("invAlertasVacias")}</p></div>
            </div>
          ) : (
            <div className="card">
              {alertas.map((p) => (
                <div key={p.id} style={{ borderBottom: "1px solid var(--border)", padding: "12px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "var(--danger)" }}>⚠️ {p.nombre}</strong>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      {t("invStockActual")}: <strong>{p.stockActual}</strong> {p.unidad} &middot; {t("invStockMinimo")}: {p.stockMinimo} {p.unidad}
                    </div>
                  </div>
                  <button className="btn-sm" onClick={() => { setTab("movimientos"); setMf({ ...mf, productoId: p.id }); setShowMovForm(true); }}>
                    ➕ {t("invEntrada")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showProdForm && (
        <div className="modal-overlay" onClick={() => setShowProdForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editProd ? "✏️ " + t("invEditarProducto") : "📦 " + t("invNuevoProducto")}</h3>
              <button className="modal-close" onClick={() => setShowProdForm(false)}>✕</button>
            </div>
            <div className="form-grid">
              <label>{t("invNombre")}<input value={pf.nombre} onChange={(e) => setPf({ ...pf, nombre: e.target.value })} /></label>
              <label>{t("invCategoria")}
                <select value={pf.categoria} onChange={(e) => setPf({ ...pf, categoria: e.target.value as any })}>
                  {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
              <label>{t("invUnidad")}<input value={pf.unidad} onChange={(e) => setPf({ ...pf, unidad: e.target.value })} /></label>
              <label>{t("invPresentacion")}<input value={pf.presentacion} onChange={(e) => setPf({ ...pf, presentacion: e.target.value })} /></label>
              <label>{t("invPrecioUnitario")}<input type="number" value={pf.precioUnitario || ""} onChange={(e) => setPf({ ...pf, precioUnitario: Number(e.target.value) })} /></label>
              <label>{t("invStockActual")}<input type="number" value={pf.stockActual || ""} onChange={(e) => setPf({ ...pf, stockActual: Number(e.target.value) })} /></label>
              <label>{t("invStockMinimo")}<input type="number" value={pf.stockMinimo || ""} onChange={(e) => setPf({ ...pf, stockMinimo: Number(e.target.value) })} /></label>
              <label>{t("invProveedor")}<input value={pf.proveedor} onChange={(e) => setPf({ ...pf, proveedor: e.target.value })} /></label>
              <label style={{ gridColumn: "1 / -1" }}>{t("invNotas")}<textarea value={pf.notas} onChange={(e) => setPf({ ...pf, notas: e.target.value })} rows={2} /></label>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={saveProd}>{t("save")}</button>
              <button className="btn-secondary" onClick={() => setShowProdForm(false)}>{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {showMovForm && (
        <div className="modal-overlay" onClick={() => setShowMovForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔄 {t("invNuevoMovimiento")}</h3>
              <button className="modal-close" onClick={() => setShowMovForm(false)}>✕</button>
            </div>
            <div className="form-grid">
              <label>{t("invProducto")}
                <select value={mf.productoId} onChange={(e) => setMf({ ...mf, productoId: e.target.value })}>
                  <option value="">{t("seleccionar")}</option>
                  {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stockActual} {p.unidad})</option>)}
                </select>
              </label>
              <label>{t("invTipo")}
                <select value={mf.tipo} onChange={(e) => setMf({ ...mf, tipo: e.target.value as "entrada" | "salida" })}>
                  <option value="entrada">📥 {t("invEntrada")}</option>
                  <option value="salida">📤 {t("invSalida")}</option>
                </select>
              </label>
              <label>{t("invCantidad")}<input type="number" value={mf.cantidad || ""} onChange={(e) => setMf({ ...mf, cantidad: Number(e.target.value) })} /></label>
              <label>{t("invFecha")}<input type="date" value={mf.fecha} onChange={(e) => setMf({ ...mf, fecha: e.target.value })} /></label>
              <label>{t("invReferencia")}<input value={mf.referencia} onChange={(e) => setMf({ ...mf, referencia: e.target.value })} placeholder="Ej: Compra #123" /></label>
              <label>{t("invResponsable")}<input value={mf.responsable} onChange={(e) => setMf({ ...mf, responsable: e.target.value })} /></label>
              <label style={{ gridColumn: "1 / -1" }}>{t("invNotas")}<textarea value={mf.notas} onChange={(e) => setMf({ ...mf, notas: e.target.value })} rows={2} /></label>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={saveMov}>{t("save")}</button>
              <button className="btn-secondary" onClick={() => setShowMovForm(false)}>{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
