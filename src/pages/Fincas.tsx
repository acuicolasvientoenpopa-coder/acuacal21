import { useState, useEffect } from "react";
import { useTranslation } from "@/store/language";

const KEY = "aquacalc_fincas";

type Finca = { id: string; nombre: string; ubicacion: string; descripcion: string };

function load(): Finca[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export default function Fincas() {
  const { t } = useTranslation();
  const [list, setList] = useState<Finca[]>(load);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Finca | null>(null);
  const [form, setForm] = useState({ nombre: "", ubicacion: "", descripcion: "" });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(list)); }, [list]);

  useEffect(() => {
    const h = (e: StorageEvent) => { if (e.key === KEY) setList(load()); };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  const openNew = () => { setEdit(null); setForm({ nombre: "", ubicacion: "", descripcion: "" }); setShow(true); };
  const openEdit = (f: Finca) => { setEdit(f); setForm({ nombre: f.nombre, ubicacion: f.ubicacion, descripcion: f.descripcion }); setShow(true); };

  const save = () => {
    if (!form.nombre.trim()) return;
    const f: Finca = edit
      ? { ...edit, nombre: form.nombre.trim(), ubicacion: form.ubicacion.trim(), descripcion: form.descripcion.trim() }
      : { id: `f_${Date.now()}`, nombre: form.nombre.trim(), ubicacion: form.ubicacion.trim(), descripcion: form.descripcion.trim() };
    setList(edit ? list.map((x) => (x.id === edit.id ? f : x)) : [...list, f]);
    setShow(false);
  };

  const remove = (id: string) => setList(list.filter((x) => x.id !== id));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("fincasTitle")}</h2>
          <p className="page-subtitle">{t("fincasSub")}</p>
        </div>
        <button className="btn-primary" onClick={openNew}>＋ {t("nuevaFinca")}</button>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <p>{t("sinFincas")}</p>
        </div>
      ) : (
        <div className="species-list">
          {list.map((f) => (
            <div key={f.id} className="card">
              <div className="card-title">🏠 {f.nombre}</div>
              {f.ubicacion && <div className="log-field" style={{ marginBottom: 8 }}><div className="log-field-label">{t("ubicacion")}</div><div className="log-field-value">{f.ubicacion}</div></div>}
              {f.descripcion && <div className="log-field"><div className="log-field-label">{t("descripcionFinca")}</div><div className="log-field-value">{f.descripcion}</div></div>}
              <div className="card-actions">
                <button className="btn-secondary" onClick={() => openEdit(f)}>{t("editar")}</button>
                <button className="btn-danger" onClick={() => remove(f.id)}>{t("eliminar")}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">📝 {edit ? t("editar") : t("nuevaFinca")}</div>
            <div className="form-grid">
              <label>{t("nombreDeFinca")}<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
              <label>{t("ubicacion")}<input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} placeholder="Ej: Guanacaste" /></label>
              <label style={{ gridColumn: "1 / -1" }}>{t("descripcionFinca")}<textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></label>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShow(false)}>{t("cancelar")}</button>
              <button className="btn-primary" onClick={save}>{t("guardar")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
