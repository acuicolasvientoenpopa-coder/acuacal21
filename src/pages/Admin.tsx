import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/store/auth";
import { toast } from "@/components/Toast";
import { generateBitacora, generateFincas, generateParams, generateFinanzas, generateAll, clearAll } from "@/utils/debugData";

const ADMIN_PIN = "211203";
const API = "https://acuacal21-production.up.railway.app/api";

type UserInfo = { id: string; email: string; nombre: string; idioma: string; createdAt: string };
type Stats = { totalUsers: number; totalFincas: number; totalBitacoras: number; planCounts: Record<string, number> };
type Subscription = { id: string; plan: string; status: string; userId: string; currentPeriodEnd: string; onvoSubscriptionId: string };

function getAllAquacalcData(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("aquacalc_")) {
      try { out[k] = JSON.parse(localStorage.getItem(k) ?? ""); }
      catch { out[k] = localStorage.getItem(k); }
    }
  }
  return out;
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ServiceCard({ name, url, status }: { name: string; url: string; status: "checking" | "ok" | "error" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13 }}>
      <span style={{ fontSize: 18 }}>{status === "checking" ? "⏳" : status === "ok" ? "✅" : "❌"}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 10, color: "var(--text3)", wordBreak: "break-all" }}>{url}</div>
      </div>
      <span style={{ fontSize: 11, color: status === "ok" ? "var(--accent)" : "var(--danger)" }}>
        {status === "checking" ? "..." : status === "ok" ? "Online" : "Offline"}
      </span>
    </div>
  );
}

export default function Admin() {
  const { token } = useAuth();
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [count, setCount] = useState(20);
  const fileRef = useRef<HTMLInputElement>(null);

  const [services, setServices] = useState<Record<string, "checking" | "ok" | "error">>({
    railway: "checking", supabase: "checking", frontend: "checking", resend: "checking",
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadError, setLoadError] = useState("");

  const api = useCallback(async (path: string) => {
    const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }, [token]);

  useEffect(() => {
    if (!unlocked) return;
    setLoadError("");

    Promise.all([
      fetch(`${API}/health`, { signal: AbortSignal.timeout(5000) }).then((r) => r.ok).catch(() => false),
      fetch("https://smvjffbeshxcfltjoolm.supabase.co", { method: "HEAD", signal: AbortSignal.timeout(5000) }).then(() => true).catch(() => false),
      fetch("https://acuacla2112.netlify.app", { signal: AbortSignal.timeout(5000) }).then((r) => r.ok).catch(() => false),
      fetch("https://status.resend.com", { signal: AbortSignal.timeout(5000) }).then((r) => r.ok).catch(() => false),
    ]).then(([r, s, f, re]) => {
      setServices({ railway: r ? "ok" : "error", supabase: s ? "ok" : "error", frontend: f ? "ok" : "error", resend: re ? "ok" : "error" });
    });

    api("/admin/stats").then(setStats).catch((e) => setLoadError(e.message));
    api("/admin/users").then(setUsers).catch((e) => setLoadError(e.message));
    api("/admin/subscriptions").then(setSubscriptions).catch(() => {});
  }, [unlocked, api]);

  const handleUnlock = () => {
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      localStorage.setItem("aquacalc_admin_unlocked", "1");
      setPin("");
      toast("Admin desbloqueado", "success");
    } else {
      setPin("");
      toast("Código incorrecto", "error");
    }
  };

  const handleLock = () => { setUnlocked(false); localStorage.removeItem("aquacalc_admin_unlocked"); };

  const handleExport = () => { downloadJSON(getAllAquacalcData(), `aquacalc_backup_${new Date().toISOString().slice(0, 10)}.json`); toast("Backup descargado", "success"); };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        let c = 0;
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith("aquacalc_")) { localStorage.setItem(k, JSON.stringify(v)); c++; }
        }
        toast(`Importados ${c} registros`, "success");
      } catch { toast("Error al leer archivo", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const forceSWUpdate = async () => {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) await reg.update();
      toast("Verificación SW iniciada", "info");
    }
  };

  const clearAllData = () => {
    if (confirm("¿Eliminar TODOS los datos locales?")) { clearAll(); toast("Datos eliminados", "success"); }
  };

  const lsSize = (() => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("aquacalc_")) total += (localStorage.getItem(k)?.length ?? 0);
    }
    return (total / 1024).toFixed(1);
  })();

  if (!unlocked) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="card" style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Admin Panel</h3>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>Ingresá el código de acceso</p>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Código" autoFocus
            style={{ textAlign: "center", fontSize: 20, letterSpacing: 8, fontFamily: "monospace" }} />
          <button className="btn-primary" onClick={handleUnlock} disabled={!pin} style={{ marginTop: 16, width: "100%" }}>Ingresar</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title" style={{ color: "var(--accent3)" }}>⚙️ Admin Panel</h2>
          <p className="page-subtitle">Dashboard de operaciones — solo para el desarrollador</p>
        </div>
        <button className="btn-danger btn-sm" onClick={handleLock}>🔒 Bloquear</button>
      </div>

      {loadError && (
        <div style={{ background: "rgba(255,77,109,0.1)", border: "1px solid var(--danger)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--danger)", marginBottom: 16 }}>{loadError}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Servicios */}
        <div className="card" style={{ borderColor: "var(--accent2)" }}>
          <div className="card-title" style={{ fontSize: 15 }}>☁️ Servicios</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <ServiceCard name="Railway (Backend API)" url={`${API}/health`} status={services.railway} />
            <ServiceCard name="Supabase (Base de datos)" url="https://smvjffbeshxcfltjoolm.supabase.co" status={services.supabase} />
            <ServiceCard name="Netlify (Frontend)" url="https://acuacla2112.netlify.app" status={services.frontend} />
            <ServiceCard name="Resend (Email)" url="https://resend.com" status={services.resend} />
          </div>
          <button className="btn-sm" style={{ marginTop: 8, fontSize: 11 }} onClick={() => setServices({ railway: "checking", supabase: "checking", frontend: "checking", resend: "checking" })}>🔄 Re-verificar</button>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="card" style={{ borderColor: "var(--accent)" }}>
            <div className="card-title" style={{ fontSize: 15 }}>📊 Base de Datos</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
              {[
                { label: "Usuarios", value: stats.totalUsers },
                { label: "Fincas", value: stats.totalFincas },
                { label: "Registros de bitácora", value: stats.totalBitacoras },
              ].map((s) => (
                <div key={s.label} style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(0,200,150,0.06)", textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Distribución de planes:</div>
              <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                {Object.entries(stats.planCounts).map(([plan, count]) => (
                  <span key={plan} className="badge" style={{ background: plan === "free" ? "var(--surface3)" : plan === "pro" ? "rgba(0,153,255,0.2)" : "rgba(240,165,0,0.2)", color: plan === "free" ? "var(--text2)" : plan === "pro" ? "var(--accent2)" : "var(--accent3)" }}>
                    {plan.toUpperCase()}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Usuarios */}
        <div className="card" style={{ borderColor: "var(--accent2)" }}>
          <div className="card-title" style={{ fontSize: 15 }}>👥 Usuarios ({users.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 400, overflowY: "auto", fontSize: 12 }}>
            {users.length === 0 ? <div style={{ color: "var(--text3)", padding: 8 }}>Cargando...</div> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "var(--text2)", fontSize: 10, textAlign: "left" }}>
                    <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Email</th>
                    <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Nombre</th>
                    <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Plan</th>
                    <th style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "6px 8px" }}>{u.email}</td>
                      <td style={{ padding: "6px 8px" }}>{u.nombre || "—"}</td>
                      <td style={{ padding: "6px 8px" }}><span className="badge" style={{ fontSize: 10 }}>{/* plan from metadata not available via User table */}—</span></td>
                      <td style={{ padding: "6px 8px", color: "var(--text3)", fontSize: 10 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Suscripciones */}
        <div className="card" style={{ borderColor: "var(--accent3)" }}>
          <div className="card-title" style={{ fontSize: 15 }}>💳 Suscripciones ({subscriptions.length})</div>
          {subscriptions.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text3)", padding: 8 }}>Sin suscripciones registradas</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              {subscriptions.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: "rgba(0,0,0,0.05)" }}>
                  <span className="badge" style={{ background: s.status === "active" ? "rgba(0,200,150,0.15)" : "rgba(255,77,109,0.15)", color: s.status === "active" ? "var(--accent)" : "var(--danger)", fontSize: 10 }}>{s.status}</span>
                  <span style={{ fontWeight: 600 }}>{s.plan}</span>
                  <span style={{ color: "var(--text3)", fontSize: 10 }}>{(s as any).User?.email || s.userId?.slice(0, 8)}</span>
                  {s.currentPeriodEnd && <span style={{ color: "var(--text3)", fontSize: 10, marginLeft: "auto" }}>Renueva: {new Date(s.currentPeriodEnd).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Herramientas Locales */}
        <div className="card" style={{ borderColor: "var(--accent3)" }}>
          <div className="card-title" style={{ fontSize: 15 }}>🛠️ Herramientas de Desarrollo</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>localStorage usado: <strong>{lsSize} KB</strong></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn-primary btn-sm" onClick={() => { generateBitacora(count); toast("Bitácora generada", "success"); }}>Generar Bitácora</button>
              <button className="btn-primary btn-sm" onClick={() => { generateFincas(); toast("Fincas generadas", "success"); }}>Generar Fincas</button>
              <button className="btn-primary btn-sm" onClick={() => { generateParams(); toast("Parámetros generados", "success"); }}>Generar Parámetros</button>
              <button className="btn-primary btn-sm" onClick={() => { generateFinanzas(); toast("Finanzas generadas", "success"); }}>Generar Finanzas</button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn-primary btn-sm" onClick={() => { generateAll(); toast("Datos completos generados", "success"); }}>⚡ Generar Todo</button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>Registros: <input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min={1} max={500} style={{ width: 70 }} /></label>
              <button className="btn-primary btn-sm" onClick={handleExport}>⬇️ Exportar localStorage</button>
              <button className="btn-primary btn-sm" onClick={() => fileRef.current?.click()}>⬆️ Importar</button>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn-primary btn-sm" onClick={forceSWUpdate}>🔄 Forzar SW update</button>
              <button className="btn-danger btn-sm" onClick={clearAllData}>🗑️ Eliminar datos locales</button>
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 20 }}>
        Solo accesible con código de administrador desde /admin
      </p>
    </div>
  );
}
