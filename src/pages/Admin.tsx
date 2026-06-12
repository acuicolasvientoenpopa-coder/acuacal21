import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/store/auth";
import { toast } from "@/components/Toast";
import { generateBitacora, generateFincas, generateParams, generateFinanzas, generateEspecies, generateInventario, generateMicrobiologia, generateVeterinaria, generateAll, clearAll } from "@/utils/debugData";
import { API_URL, FRONTEND_URL } from "@/utils/config";
import { getFailedOps, retryFailedOp, retryAllFailed, clearFailedOps, getFailedCount, onQueueChange, type SyncOp } from "@/services/sync";

const ADMIN_PIN = "211203";

type UserInfo = { id: string; email: string; nombre: string; idioma: string; createdAt: string };
type Stats = { totalUsers: number; totalFincas: number; totalBitacoras: number; planCounts: Record<string, number> };
type Subscription = { id: string; plan: string; status: string; userId: string; currentPeriodEnd: string; onvoSubscriptionId: string };
type Tab = "overview" | "users" | "subscriptions" | "system" | "tools";

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getAllAcuicalData() {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("acuical_")) {
      try { out[k] = JSON.parse(localStorage.getItem(k) ?? ""); }
      catch { out[k] = localStorage.getItem(k); }
    }
  }
  return out;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "users", label: "Usuarios", icon: "group" },
  { id: "subscriptions", label: "Suscripciones", icon: "credit_card" },
  { id: "system", label: "Sistema", icon: "settings" },
  { id: "tools", label: "Herramientas", icon: "build" },
];

const icons: Record<string, string> = {
  dashboard: "\u2302", group: "\u263C", credit_card: "\u2666", settings: "\u2699", build: "\u2692",
};

const s_label = { fontSize: 11, color: "var(--text3)", textTransform: "uppercase" as const, letterSpacing: "0.5px" as const, fontWeight: 600 };
const s_btn = { padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.15s" };

function Badge({ children, variant }: { children: React.ReactNode; variant?: "success" | "danger" | "warning" | "info" }) {
  const bg = variant === "success" ? "rgba(0,200,150,0.12)" : variant === "danger" ? "rgba(255,77,109,0.12)" : variant === "warning" ? "rgba(240,165,0,0.12)" : "rgba(0,153,255,0.12)";
  const fg = variant === "success" ? "var(--accent)" : variant === "danger" ? "var(--danger)" : variant === "warning" ? "var(--accent3)" : "var(--accent2)";
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: bg, color: fg }}>{children}</span>;
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ padding: "16px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent ?? "var(--text)" }}>{value}</div>
    </div>
  );
}

function ServiceDot({ status }: { status: "checking" | "ok" | "error" }) {
  const size = 10;
  const bg = status === "ok" ? "var(--accent)" : status === "error" ? "var(--danger)" : "var(--text3)";
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: bg, boxShadow: status === "ok" ? "0 0 6px rgba(0,200,150,0.5)" : "none" }} />;
}

export default function Admin() {
  const { token } = useAuth();
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem("acuical_admin_unlocked") === "1");
  const [tab, setTab] = useState<Tab>("overview");
  const [count, setCount] = useState(20);
  const fileRef = useRef<HTMLInputElement>(null);
  const [netLog, setNetLog] = useState<{ time: string; status: string }[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [services, setServices] = useState<Record<string, "checking" | "ok" | "error">>({
    railway: "checking", supabase: "checking", frontend: "checking", resend: "checking",
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadError, setLoadError] = useState("");
  const [failedOps, setFailedOps] = useState<SyncOp[]>([]);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    const on = () => { setOnline(true); setNetLog(prev => [{ time: new Date().toLocaleTimeString(), status: "online" }, ...prev].slice(0, 50)); };
    const off = () => { setOnline(false); setNetLog(prev => [{ time: new Date().toLocaleTimeString(), status: "offline" }, ...prev].slice(0, 50)); };
    setNetLog([{ time: new Date().toLocaleTimeString(), status: navigator.onLine ? "online" : "offline" }]);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    getFailedOps().then(setFailedOps);
    getFailedCount().then(setFailedCount);
    const unsub = onQueueChange(async () => {
      setFailedOps(await getFailedOps());
      setFailedCount(await getFailedCount());
    });
    return unsub;
  }, []);

  const api = useCallback(async (path: string) => {
    const r = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }, [token]);

  useEffect(() => {
    if (!unlocked) return;
    setLoadError("");
    Promise.all([
      fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) }).then((r) => r.ok).catch(() => false),
      fetch("https://smvjffbeshxcfltjoolm.supabase.co", { method: "HEAD", signal: AbortSignal.timeout(5000) }).then(() => true).catch(() => false),
      fetch(FRONTEND_URL, { signal: AbortSignal.timeout(5000) }).then((r) => r.ok).catch(() => false),
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
      localStorage.setItem("acuical_admin_unlocked", "1");
      setPin("");
      toast("Admin desbloqueado", "success");
    } else {
      setPin("");
      toast("Código incorrecto", "error");
    }
  };

  const handleLock = () => { setUnlocked(false); localStorage.removeItem("acuical_admin_unlocked"); };
  const handleExport = () => { downloadJSON(getAllAcuicalData(), `acuical_backup_${new Date().toISOString().slice(0, 10)}.json`); toast("Backup descargado", "success"); };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        let c = 0;
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith("acuical_")) { localStorage.setItem(k, JSON.stringify(v)); c++; }
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
      if (k?.startsWith("acuical_")) total += (localStorage.getItem(k)?.length ?? 0);
    }
    return (total / 1024).toFixed(1);
  })();

  if (!unlocked) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="card" style={{ maxWidth: 360, width: "100%", textAlign: "center", padding: "32px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.7 }}>{String.fromCharCode(0x1F512)}</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Admin Panel</h3>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>Ingresá el código de acceso para continuar</p>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Código de acceso" autoFocus
            style={{ textAlign: "center", fontSize: 20, letterSpacing: 8, fontFamily: "monospace" }} />
          <button className="btn-primary" onClick={handleUnlock} disabled={!pin} style={{ marginTop: 16, width: "100%" }}>Ingresar</button>
        </div>
      </div>
    );
  }

  const tabContent = () => {
    switch (tab) {
      case "overview":
        return (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
              {stats ? (
                <>
                  <StatCard label="Usuarios registrados" value={stats.totalUsers} accent="var(--accent)" />
                  <StatCard label="Fincas" value={stats.totalFincas} accent="var(--accent2)" />
                  <StatCard label="Registros de bitácora" value={stats.totalBitacoras} accent="var(--accent3)" />
                  <StatCard label="Estado de red" value={online ? "Online" : "Offline"} accent={online ? "var(--accent)" : "var(--danger)"} />
                </>
              ) : (
                <div style={{ padding: 16, color: "var(--text3)", fontSize: 13 }}>Cargando estadísticas...</div>
              )}
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Servicios</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { name: "Railway (Backend API)", url: `${API_URL}/health`, key: "railway" as const },
                  { name: "Supabase (Base de datos)", url: "https://smvjffbeshxcfltjoolm.supabase.co", key: "supabase" as const },
                  { name: "Cloudflare Pages", url: FRONTEND_URL, key: "frontend" as const },
                  { name: "Resend (Email)", url: "https://resend.com", key: "resend" as const },
                ].map((svc) => (
                  <div key={svc.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}>
                    <ServiceDot status={services[svc.key]} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{svc.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)", wordBreak: "break-all" }}>{svc.url}</div>
                    </div>
                    <span style={{ fontSize: 11, color: services[svc.key] === "ok" ? "var(--accent)" : services[svc.key] === "error" ? "var(--danger)" : "var(--text3)" }}>
                      {services[svc.key] === "checking" ? "..." : services[svc.key] === "ok" ? "Operativo" : "Caído"}
                    </span>
                  </div>
                ))}
              </div>
              <button style={{ ...s_btn, background: "var(--surface2)", color: "var(--text2)", marginTop: 12 }}
                onClick={() => setServices({ railway: "checking", supabase: "checking", frontend: "checking", resend: "checking" })}>
                Re-verificar servicios
              </button>
            </div>

            {stats?.planCounts && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Distribución de planes</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {Object.entries(stats.planCounts).map(([plan, cnt]) => (
                    <div key={plan} style={{ padding: "12px 20px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>{plan}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: plan === "free" ? "var(--text2)" : plan === "pro" ? "var(--accent2)" : "var(--accent3)" }}>{cnt}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loadError && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", fontSize: 12, color: "var(--danger)" }}>
                {loadError}
              </div>
            )}
          </>
        );

      case "users":
        return (
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Usuarios ({users.length})</div>
            {users.length === 0 ? (
              <div style={{ color: "var(--text3)", padding: 12, fontSize: 13 }}>Cargando...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "var(--text2)", fontSize: 11, textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "8px 10px", fontWeight: 600 }}>Email</th>
                      <th style={{ padding: "8px 10px", fontWeight: 600 }}>Nombre</th>
                      <th style={{ padding: "8px 10px", fontWeight: 600 }}>Idioma</th>
                      <th style={{ padding: "8px 10px", fontWeight: 600 }}>Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 10px", color: "var(--accent2)" }}>{u.email}</td>
                        <td style={{ padding: "10px 10px" }}>{u.nombre || String.fromCharCode(0x2014)}</td>
                        <td style={{ padding: "10px 10px" }}><Badge variant="info">{u.idioma || "—"}</Badge></td>
                        <td style={{ padding: "10px 10px", color: "var(--text3)", fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case "subscriptions":
        return (
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Suscripciones ({subscriptions.length})</div>
            {subscriptions.length === 0 ? (
              <div style={{ color: "var(--text3)", padding: 12, fontSize: 13 }}>Sin suscripciones registradas</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {subscriptions.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <Badge variant={s.status === "active" ? "success" : "danger"}>{s.status}</Badge>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{s.plan}</span>
                    <span style={{ color: "var(--text3)", fontSize: 12 }}>{(s as any).User?.email || s.userId?.slice(0, 10)}</span>
                    {s.currentPeriodEnd && (
                      <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text2)" }}>
                        Renueva: {new Date(s.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "system":
        return (
          <>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                Red
                <ServiceDot status={online ? "ok" : "error"} />
                <span style={{ fontSize: 12, color: online ? "var(--accent)" : "var(--danger)", fontWeight: 500 }}>{online ? "Online" : "Offline"}</span>
              </div>
              <div style={{ maxHeight: 160, overflowY: "auto", fontSize: 12, fontFamily: "monospace" }}>
                {netLog.length === 0 ? (
                  <span style={{ color: "var(--text3)" }}>Sin eventos</span>
                ) : (
                  netLog.map((e) => (
                    <div key={e.time + e.status} style={{ padding: "3px 0", display: "flex", gap: 10, borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--text3)", minWidth: 70 }}>{e.time}</span>
                      <span style={{ color: e.status === "online" ? "var(--accent)" : "var(--danger)" }}>{e.status}</span>
                    </div>
                  ))
                )}
              </div>
              <button style={{ ...s_btn, background: "var(--surface2)", color: "var(--text2)", marginTop: 8, fontSize: 11 }}
                onClick={() => setNetLog([])}>Limpiar historial</button>
            </div>

            <div className="card" style={{ borderColor: failedCount > 0 ? "var(--danger)" : "var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Cola de sincronización</span>
                {failedCount > 0 && <Badge variant="danger">{failedCount} fallidos</Badge>}
              </div>
              {failedOps.length === 0 ? (
                <div style={{ color: "var(--text3)", padding: 8, fontSize: 13 }}>Sin operaciones fallidas</div>
              ) : (
                <>
                  <div style={{ maxHeight: 240, overflowY: "auto", fontSize: 12, fontFamily: "monospace" }}>
                    {failedOps.map((op) => (
                      <div key={op.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                        <Badge variant="danger">{op.method}</Badge>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{op.path}</span>
                        <span style={{ color: "var(--danger)", fontSize: 10, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{op.lastError}</span>
                        <span style={{ color: "var(--text3)", fontSize: 10, minWidth: 30 }}>{op.retries}r</span>
                        <button style={{ ...s_btn, background: "var(--surface2)", color: "var(--text)", padding: "4px 10px", fontSize: 11 }}
                          onClick={async () => { await retryFailedOp(op.id); toast("Reintentando...", "info"); }}>Reintentar</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button style={{ ...s_btn, background: "rgba(255,77,109,0.12)", color: "var(--danger)" }}
                      onClick={async () => { await retryAllFailed(); toast("Reintentando todos...", "info"); }}>Reintentar todos</button>
                    <button style={{ ...s_btn, background: "var(--surface2)", color: "var(--text2)" }}
                      onClick={async () => { await clearFailedOps(); toast("Fallos limpiados", "success"); }}>Limpiar fallos</button>
                  </div>
                </>
              )}
            </div>
          </>
        );

      case "tools":
        return (
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Herramientas de desarrollo</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ ...s_label, marginBottom: 8 }}>Datos de prueba</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["Bitácora", "Fincas", "Parámetros", "Finanzas", "Especies", "Inventario", "Microbiología", "Veterinaria"] as const).map((name) => (
                  <button key={name} style={{ ...s_btn, background: "var(--surface2)", color: "var(--text)" }}
                    onClick={() => {
                      const fns: Record<string, (n?: number) => void> = {
                        "Bitácora": (n) => generateBitacora(n ?? 20),
                        "Fincas": () => generateFincas(),
                        "Parámetros": () => generateParams(),
                        "Finanzas": () => generateFinanzas(),
                        "Especies": () => generateEspecies(),
                        "Inventario": () => generateInventario(),
                        "Microbiología": () => generateMicrobiologia(),
                        "Veterinaria": () => generateVeterinaria(),
                      };
                      fns[name](count);
                      toast(`${name} generado`, "success");
                    }}>{name}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  Registros: <input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min={1} max={500} style={{ width: 64 }} />
                </label>
                <button style={{ ...s_btn, background: "rgba(0,200,150,0.12)", color: "var(--accent)" }}
                  onClick={() => { generateAll(); toast("Datos completos generados", "success"); }}>Generar todo</button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ ...s_label, marginBottom: 8 }}>Almacenamiento local</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>localStorage usado: <strong style={{ color: "var(--text)" }}>{lsSize} KB</strong></div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button style={{ ...s_btn, background: "var(--surface2)", color: "var(--text)" }} onClick={handleExport}>Exportar JSON</button>
                <button style={{ ...s_btn, background: "var(--surface2)", color: "var(--text)" }} onClick={() => fileRef.current?.click()}>Importar JSON</button>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
                <button style={{ ...s_btn, background: "rgba(0,153,255,0.12)", color: "var(--accent2)" }} onClick={forceSWUpdate}>Forzar SW update</button>
                <button style={{ ...s_btn, background: "rgba(255,77,109,0.12)", color: "var(--danger)" }} onClick={clearAllData}>Eliminar datos locales</button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title" style={{ color: "var(--accent3)" }}>Admin Panel</h2>
          <p className="page-subtitle">Panel de control del sistema</p>
        </div>
        <button className="btn-danger btn-sm" onClick={handleLock}>Bloquear</button>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 16px", fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              cursor: "pointer", border: "none", borderBottom: tab === t.id ? "2px solid var(--accent3)" : "2px solid transparent",
              background: "transparent", color: tab === t.id ? "var(--accent3)" : "var(--text2)",
              transition: "all 0.15s", marginBottom: -1,
            }}>
            {icons[t.icon]} {t.label}
          </button>
        ))}
      </div>

      {tabContent()}

      <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 24 }}>
        Solo accesible con código de administrador desde /admin
      </p>
    </div>
  );
}
