import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/store/auth";
import { useTranslation } from "@/store/language";
import { useNavigate } from "react-router-dom";
import { excedeLimiteFincas, excedeLimiteEstanques } from "@/core";
import { createApi } from "@/services/api";

const LS_KEY = "acuical_fincas";

type Finca = { id: string; nombre: string; ubicacion: string; descripcion: string; estanques: string[] };

type FincaUser = { id: string; userId: string; rol: string; email: string; nombre: string };

function migrar(f: any): Finca {
  return Array.isArray(f.estanques) ? f : { ...f, estanques: f.nombre ? [f.nombre] : [] };
}

function loadLocal(): Finca[] {
  try { return (JSON.parse(localStorage.getItem(LS_KEY) || "[]")).map(migrar); } catch { return []; }
}

function saveLocal(fs: Finca[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(fs));
}

export default function Fincas() {
  const { t } = useTranslation();
  const { token, user, plan } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Finca[]>(loadLocal);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Finca | null>(null);
  const [form, setForm] = useState({ nombre: "", ubicacion: "", descripcion: "" });
  const [editEst, setEditEst] = useState<{ fincaId: string; index: number; value: string } | null>(null);
  const [newEst, setNewEst] = useState<{ fincaId: string; value: string } | null>(null);
  const [showCreateMode, setShowCreateMode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<Record<string, FincaUser[]>>({});
  const [invite, setInvite] = useState<{ fincaId: string; email: string; rol: string } | null>(null);
  const [inviting, setInviting] = useState(false);

  const client = useMemo(() => token ? createApi(token) : null, [token]);

  useEffect(() => {
    if (!client) return;
    client.get<any[]>("/fincas").then((data) => {
      const mapped = data.map((f: any) => ({
        id: f.id,
        nombre: f.nombre,
        ubicacion: f.ubicacion ?? "",
        descripcion: "",
        estanques: (f.Estanque ?? []).map((e: any) => e.nombre),
      }));
      setList(mapped);
      saveLocal(mapped);
      mapped.forEach((f) => fetchUsers(f.id));
    }).catch(() => setList(loadLocal()));
  }, [client]);

  const fetchUsers = async (fincaId: string) => {
    if (!client) return;
    try {
      const data = await client.get<any[]>(`/fincas/${fincaId}/users`);
      setUsers((prev) => ({ ...prev, [fincaId]: data }));
    } catch {}
  };

  useEffect(() => { saveLocal(list); }, [list]);

  const openNew = () => { setEdit(null); setForm({ nombre: "", ubicacion: "", descripcion: "" }); setShow(true); setError(""); };
  const openEdit = (f: Finca) => { setEdit(f); setForm({ nombre: f.nombre, ubicacion: f.ubicacion, descripcion: f.descripcion }); setShow(true); setError(""); };

  const saveFinca = async () => {
    if (!form.nombre.trim()) return;
    if (!edit && excedeLimiteFincas(plan, list.length)) { setError(t("limiteFincas")); return; }
    const payload = { nombre: form.nombre.trim(), ubicacion: form.ubicacion.trim() };
    setSaving(true);
    try {
      if (edit) {
        const result = await client?.mutate("PUT", `/fincas/${edit.id}`, payload);
        if (result?.ok) {
          setList(list.map((x) => x.id === edit.id ? { ...edit, nombre: form.nombre.trim(), ubicacion: form.ubicacion.trim() } : x));
        } else {
          setList(list.map((x) => (x.id === edit.id ? { ...edit, nombre: form.nombre.trim(), ubicacion: form.ubicacion.trim(), descripcion: form.descripcion.trim() } : x)));
        }
      } else {
        const created = await client?.post<any>("/fincas", payload);
        const newF: Finca = {
          id: created.id, nombre: created.nombre, ubicacion: created.ubicacion ?? "",
          descripcion: "", estanques: [created.nombre],
        };
        await client?.post(`/fincas/${created.id}/estanques`, { nombre: created.nombre });
        setList([...list, newF]);
        fetchUsers(newF.id);
      }
    } catch {
      if (edit) {
        setList(list.map((x) => (x.id === edit.id ? { ...edit, nombre: form.nombre.trim(), ubicacion: form.ubicacion.trim(), descripcion: form.descripcion.trim() } : x)));
      } else {
        const f: Finca = { id: `f_${Date.now()}`, nombre: form.nombre.trim(), ubicacion: form.ubicacion.trim(), descripcion: form.descripcion.trim(), estanques: [form.nombre.trim()] };
        setList([...list, f]);
      }
    } finally { setSaving(false); }
    setShow(false);
  };

  const remove = async (id: string) => {
    try { await client?.del(`/fincas/${id}`); } catch { /* ignore */ }
    setList(list.filter((x) => x.id !== id));
  };

  const addEstanque = async (fincaId: string) => {
    const v = newEst?.fincaId === fincaId ? newEst.value.trim() : "";
    if (!v) return;
    const finca = list.find((f) => f.id === fincaId);
    if (finca && excedeLimiteEstanques(plan, finca.estanques.length)) { setError(t("limiteEstanques")); setNewEst(null); return; }
    try { await client?.post(`/fincas/${fincaId}/estanques`, { nombre: v }); } catch { /* ignore */ }
    setList(list.map((f) => f.id === fincaId ? { ...f, estanques: [...f.estanques, v] } : f));
    setNewEst(null);
  };

  const renameEstanque = async (fincaId: string, index: number) => {
    const v = editEst?.fincaId === fincaId ? editEst.value.trim() : "";
    if (!v) return;
    setList(list.map((f) => f.id === fincaId ? { ...f, estanques: f.estanques.map((e, i) => i === index ? v : e) } : f));
    setEditEst(null);
  };

  const removeEstanque = (fincaId: string, index: number) => {
    setList(list.map((f) => f.id === fincaId ? { ...f, estanques: f.estanques.filter((_, i) => i !== index) } : f));
  };

  const sendInvite = async (fincaId: string) => {
    if (!invite || !invite.email.trim()) return;
    setInviting(true);
    try {
      await client?.post(`/fincas/${fincaId}/users`, { email: invite.email.trim(), rol: invite.rol });
      setInvite(null);
      fetchUsers(fincaId);
    } catch (err: any) {
      setError(err.message || "Error al invitar");
    } finally { setInviting(false); }
  };

  const removeUser = async (fincaId: string, userId: string) => {
    try {
      await client?.del(`/fincas/${fincaId}/users/${userId}`);
      fetchUsers(fincaId);
    } catch (err: any) {
      setError(err.message || "Error al eliminar usuario");
    }
  };

  const isAdmin = (fincaId: string) => {
    const fu = users[fincaId] || [];
    return fu.some((u) => u.userId === user?.id && u.rol === "admin");
  };


  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("fincasTitle")}</h2>
          <p className="page-subtitle">{t("fincasSub")}</p>
        </div>
        <button className="btn-primary" onClick={openNew}>＋ {t("nuevaFinca")}</button>
      </div>

      {error && (
        <div style={{ background: "rgba(255,77,109,0.1)", border: "1px solid var(--danger)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--danger)", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <p>{t("sinFincas")}</p>
        </div>
      ) : (
        <div className="species-list">
          {list.map((f) => (
            <div key={f.id} className="card">
              <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>🏠 {f.nombre}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn-sm" onClick={() => openEdit(f)}>✏️</button>
                  <button className="btn-sm" style={{ color: "var(--danger)" }} onClick={() => remove(f.id)}>🗑️</button>
                </div>
              </div>
              {f.ubicacion && <div className="log-field" style={{ marginBottom: 6 }}><div className="log-field-label">{t("ubicacion")}</div><div className="log-field-value">{f.ubicacion}</div></div>}
              {f.descripcion && <div className="log-field" style={{ marginBottom: 8 }}><div className="log-field-label">{t("descripcionFinca")}</div><div className="log-field-value">{f.descripcion}</div></div>}

              <div style={{ marginTop: 8 }}>
                <div className="card-subtitle" style={{ fontSize: 13, marginBottom: 6 }}>🌊 {t("estanques")}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {f.estanques.map((e, i) => (
                    <div key={f.id + '-' + e + '-' + i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      {editEst?.fincaId === f.id && editEst.index === i ? (
                        <>
                          <input value={editEst.value} onChange={(e2) => setEditEst({ ...editEst, value: e2.target.value })}
                            onKeyDown={(e2) => { if (e2.key === "Enter") renameEstanque(f.id, i); }}
                            autoFocus style={{ flex: 1, fontSize: 13 }} />
                          <button className="btn-sm" onClick={() => renameEstanque(f.id, i)}>💾</button>
                          <button className="btn-sm" onClick={() => setEditEst(null)}>✕</button>
                        </>
                      ) : (
                        <>
                          <span>🌊 {e}</span>
                          <button className="btn-sm" style={{ fontSize: 11 }} onClick={() => setEditEst({ fincaId: f.id, index: i, value: e })}>✏️</button>
                          <button className="btn-sm" style={{ fontSize: 11, color: "var(--danger)" }} onClick={() => removeEstanque(f.id, i)}>🗑️</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {newEst?.fincaId === f.id ? (
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <input value={newEst.value} onChange={(e) => setNewEst({ ...newEst, value: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") addEstanque(f.id); }}
                      placeholder="Nombre del estanque" autoFocus style={{ flex: 1, fontSize: 13 }} />
                    <button className="btn-sm" onClick={() => addEstanque(f.id)}>➕</button>
                    <button className="btn-sm" onClick={() => setNewEst(null)}>✕</button>
                  </div>
                ) : showCreateMode === f.id ? (
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button className="btn-sm" style={{ fontSize: 12 }} onClick={() => { setShowCreateMode(null); setNewEst({ fincaId: f.id, value: "" }); }}>
                      📝 {t("gpsManual") || "Manual"}
                    </button>
                    <button className="btn-sm" style={{ fontSize: 12 }} onClick={() => navigate(`/geo?fincaId=${f.id}&returnTo=/fincas`)}>
                      🗺️ {t("gpsDesdeFinca") || "GPS"}
                    </button>
                    <button className="btn-sm" onClick={() => setShowCreateMode(null)}>✕</button>
                  </div>
                ) : (
                  <button className="btn-sm" style={{ marginTop: 6, fontSize: 12 }} onClick={() => setShowCreateMode(f.id)}>
                    ➕ {t("nuevoEstanque")}
                  </button>
                )}
              </div>

              <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                <div className="card-subtitle" style={{ fontSize: 13, marginBottom: 6 }}>👥 Usuarios</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                  {(users[f.id] || []).map((u) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{u.email || u.nombre || u.userId.slice(0, 8)}</span>
                      <span className={`badge ${u.rol === "admin" ? "badge-green" : "badge-blue"}`} style={{ fontSize: 10 }}>{u.rol}</span>
                      {isAdmin(f.id) && u.userId !== user?.id && (
                        <button className="btn-sm" style={{ fontSize: 11, color: "var(--danger)", marginLeft: "auto" }} onClick={() => removeUser(f.id, u.userId)}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {users[f.id]?.length === 0 && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Cargando...</span>}
                {isAdmin(f.id) && (
                  <div style={{ marginTop: 6 }}>
                    {invite?.fincaId === f.id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                          placeholder="email@ejemplo.com" style={{ flex: 1, fontSize: 12 }} />
                        <select value={invite.rol} onChange={(e) => setInvite({ ...invite, rol: e.target.value })} style={{ fontSize: 12 }}>
                          <option value="productor">Productor</option>
                          <option value="tecnico">Técnico</option>
                        </select>
                        <button className="btn-sm" onClick={() => sendInvite(f.id)} disabled={inviting}>➕</button>
                        <button className="btn-sm" onClick={() => setInvite(null)}>✕</button>
                      </div>
                    ) : (
                      <button className="btn-sm" style={{ fontSize: 12 }} onClick={() => setInvite({ fincaId: f.id, email: "", rol: "productor" })}>
                        ➕ Invitar usuario
                      </button>
                    )}
                  </div>
                )}
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
              <button className="btn-primary" onClick={saveFinca} disabled={saving}>{saving ? t("saving") : t("guardar")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
