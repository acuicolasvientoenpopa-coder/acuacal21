import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/store/auth";
import { toast } from "@/components/Toast";
import { generateBitacora, generateFincas, generateParams, generateFinanzas, generateAll, clearAll } from "@/utils/debugData";
import type { Plan, Rol } from "@/core";

const ADMIN_PIN = "211203";

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

export default function Admin() {
  const { plan, rol } = useAuth();
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(localStorage.getItem("aquacalc_admin_unlocked") === "1");
  const [count, setCount] = useState(20);
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedPlan, setSelectedPlan] = useState<Plan>(() => (localStorage.getItem("aquacalc_plan_override") as Plan) || plan);
  const [selectedRol, setSelectedRol] = useState<Rol>(() => (localStorage.getItem("aquacalc_rol_override") as Rol) || rol);

  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "error">("checking");

  useEffect(() => {
    if (unlocked) {
      fetch("https://acuacal21-production.up.railway.app/api/health", { signal: AbortSignal.timeout(5000) })
        .then((r) => r.json().then(() => setApiStatus("ok")).catch(() => setApiStatus("error")))
        .catch(() => setApiStatus("error"));
    }
  }, [unlocked]);

  const handleUnlock = () => {
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      localStorage.setItem("aquacalc_admin_unlocked", "1");
      setPin("");
      toast("Admin Panel desbloqueado", "success");
    } else {
      setPin("");
      toast("Código incorrecto", "error");
    }
  };

  const handleLock = () => {
    setUnlocked(false);
    localStorage.removeItem("aquacalc_admin_unlocked");
  };

  const applyPlanOverride = () => {
    localStorage.setItem("aquacalc_plan_override", selectedPlan);
    localStorage.setItem("aquacalc_rol_override", selectedRol);
    toast("Plan/Rol override guardado. Recargá la página.", "success");
  };

  const clearOverrides = () => {
    localStorage.removeItem("aquacalc_plan_override");
    localStorage.removeItem("aquacalc_rol_override");
    setSelectedPlan("free");
    setSelectedRol("productor");
    toast("Overrides eliminados. Recargá la página.", "info");
  };

  const handleExport = () => {
    const data = getAllAquacalcData();
    downloadJSON(data, `aquacalc_backup_${new Date().toISOString().slice(0, 10)}.json`);
    toast("Backup descargado", "success");
  };

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
      } catch { toast("Error al leer el archivo", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const forceSWUpdate = async () => {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) { await reg.update(); }
      toast("Verificación de SW iniciada", "info");
    }
  };

  const clearAllData = () => {
    if (confirm("¿Estás seguro? Esto eliminará TODOS los datos locales.")) {
      clearAll();
      toast("Datos eliminados", "success");
    }
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
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
            Ingresá el código de acceso
          </p>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Código" autoFocus
            style={{ textAlign: "center", fontSize: 20, letterSpacing: 8, fontFamily: "monospace" }} />
          <button className="btn-primary" onClick={handleUnlock} disabled={!pin} style={{ marginTop: 16, width: "100%" }}>
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title" style={{ color: "var(--accent3)" }}>⚙️ Admin Panel</h2>
          <p className="page-subtitle">Plan actual: <strong>{plan}</strong> · Rol: <strong>{rol}</strong></p>
        </div>
        <button className="btn-danger btn-sm" onClick={handleLock}>🔒 Bloquear</button>
      </div>

      <div className="card" style={{ borderColor: "var(--accent3)", marginBottom: 16 }}>
        <div className="card-title">🎯 Override de Plan y Rol</div>
        <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>Simular otro plan/rol para testing. Requiere recargar.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ fontSize: 12 }}>
            Plan
            <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value as Plan)} className="sidebar-lang-select" style={{ marginLeft: 8 }}>
              <option value="free">Free</option>
              <option value="pro">Pro ($10/mes)</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>
          <label style={{ fontSize: 12 }}>
            Rol
            <select value={selectedRol} onChange={(e) => setSelectedRol(e.target.value as Rol)} className="sidebar-lang-select" style={{ marginLeft: 8 }}>
              <option value="productor">Productor</option>
              <option value="tecnico">Técnico</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button className="btn-primary btn-sm" onClick={applyPlanOverride}>Aplicar override</button>
          <button className="btn-secondary btn-sm" onClick={clearOverrides}>Quitar override</button>
        </div>
      </div>

      <div className="card" style={{ borderColor: "var(--accent3)", marginBottom: 16 }}>
        <div className="card-title">🧪 Generar Datos de Prueba</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              Registros:
              <input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min={1} max={500} style={{ width: 80 }} />
            </label>
            <button className="btn-primary btn-sm" onClick={() => { generateBitacora(count); toast("Bitácora generada", "success"); }}>Bitácora</button>
            <button className="btn-primary btn-sm" onClick={() => { generateFincas(); toast("Fincas generadas", "success"); }}>Fincas</button>
            <button className="btn-primary btn-sm" onClick={() => { generateParams(); toast("Parámetros generados", "success"); }}>Parámetros</button>
            <button className="btn-primary btn-sm" onClick={() => { generateFinanzas(); toast("Finanzas generadas", "success"); }}>Finanzas</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => { generateAll(); toast("Datos completos generados", "success"); }}>⚡ Generar Todo</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderColor: "var(--accent3)", marginBottom: 16 }}>
        <div className="card-title">🖥️ Estado del Sistema</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
          <div>API Backend: <strong style={{ color: apiStatus === "ok" ? "var(--success)" : "var(--danger)" }}>{apiStatus === "checking" ? "Verificando..." : apiStatus === "ok" ? "✅ Online" : "❌ Offline"}</strong></div>
          <div>localStorage usado: <strong>{lsSize} KB</strong></div>
          <div>Plan activo: <strong>{plan}</strong></div>
          <div>Rol activo: <strong>{rol}</strong></div>
          <button className="btn-primary btn-sm" style={{ width: "fit-content" }} onClick={forceSWUpdate}>🔄 Forzar verificación SW</button>
        </div>
      </div>

      <div className="card" style={{ borderColor: "var(--accent3)", marginBottom: 16 }}>
        <div className="card-title">📦 Exportar / Importar Datos</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-primary btn-sm" onClick={handleExport}>⬇️ Exportar todo (JSON)</button>
          <button className="btn-primary btn-sm" onClick={() => fileRef.current?.click()}>⬆️ Importar (JSON)</button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
        </div>
      </div>

      <div className="card" style={{ borderColor: "var(--danger)", marginBottom: 16 }}>
        <div className="card-title" style={{ color: "var(--danger)" }}>⚠️ Peligro</div>
        <button className="btn-danger" onClick={clearAllData}>🗑️ Eliminar todos los datos locales</button>
      </div>

      <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 20 }}>
        Esta página solo es accesible con código de administrador.
      </p>
    </div>
  );
}
