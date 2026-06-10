import { generateBitacora, generateFincas, generateParams, generateAll, clearAll } from "@/utils/debugData";
import { toast } from "@/components/Toast";
import { useState, useRef, useCallback, useEffect } from "react";

const MASTER_PIN = "211203";

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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

export default function MasterPage() {
  const [count, setCount] = useState(20);
  const [showKeys, setShowKeys] = useState(false);
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(localStorage.getItem("aquacalc_master_unlocked") === "1");
  const [lsKeys, setLsKeys] = useState<string[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [cachesInfo, setCachesInfo] = useState<{ name: string; urls: string[] }[]>([]);
  const [showCache, setShowCache] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshLsKeys = useCallback(() => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("aquacalc_")) keys.push(k);
    }
    setLsKeys(keys);
  }, []);

  useEffect(() => { if (unlocked) refreshLsKeys(); }, [unlocked, refreshLsKeys]);

  const handleUnlock = () => {
    if (pin === MASTER_PIN) {
      setUnlocked(true);
      localStorage.setItem("aquacalc_master_unlocked", "1");
      setPin("");
      toast("Master Panel desbloqueado", "success");
    } else {
      setPin("");
      toast("Código incorrecto", "error");
    }
  };

  const handleLock = () => {
    setUnlocked(false);
    localStorage.removeItem("aquacalc_master_unlocked");
  };

  // Export
  const handleExport = () => {
    const data = getAllAquacalcData();
    downloadJSON(data, `aquacalc_backup_${new Date().toISOString().slice(0, 10)}.json`);
    toast("Backup descargado", "success");
  };

  // Import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        let count = 0;
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith("aquacalc_")) {
            localStorage.setItem(k, JSON.stringify(v));
            count++;
          }
        }
        refreshLsKeys();
        toast(`Importados ${count} registros`, "success");
      } catch {
        toast("Error al leer el archivo", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // LS Editor
  const startEdit = (k: string) => {
    setEditingKey(k);
    const raw = localStorage.getItem(k);
    try { setEditValue(JSON.stringify(JSON.parse(raw ?? ""), null, 2)); }
    catch { setEditValue(raw ?? ""); }
  };

  const saveEdit = () => {
    if (!editingKey) return;
    try {
      JSON.parse(editValue);
      localStorage.setItem(editingKey, editValue);
      toast("Guardado", "success");
      setEditingKey(null);
      refreshLsKeys();
    } catch {
      toast("JSON inválido", "error");
    }
  };

  const deleteKey = (k: string) => {
    localStorage.removeItem(k);
    if (editingKey === k) setEditingKey(null);
    refreshLsKeys();
    toast(`Eliminado: ${k}`, "info");
  };

  // Cache Inspector
  const loadCaches = async () => {
    if (!("caches" in window)) { toast("Cache API no disponible", "error"); return; }
    const names = await caches.keys();
    const info = [];
    for (const name of names) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      info.push({ name, urls: requests.map((r) => r.url) });
    }
    setCachesInfo(info);
    setShowCache(true);
  };

  const clearCaches = async () => {
    if (!("caches" in window)) return;
    const names = await caches.keys();
    for (const name of names) await caches.delete(name);
    setCachesInfo([]);
    toast("Cachés limpiados", "success");
  };

  // Reset Tutorial
  const resetTutorial = () => {
    localStorage.removeItem("aquacalc_tutorial_done");
    toast("Tutorial reiniciado. Recargá la página.", "info");
  };

  // Download diagnostic
  const handleDiagnostic = () => {
    const data = {
      fecha: new Date().toISOString(),
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      language: navigator.language,
      localStorage: getAllAquacalcData(),
    };
    downloadJSON(data, `aquacalc_diagnostico_${new Date().toISOString().slice(0, 10)}.json`);
    toast("Diagnóstico descargado", "success");
  };

  if (!unlocked) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="card" style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Acceso Restringido</h3>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
            Ingresá el código de acceso para continuar
          </p>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Código"
            style={{ textAlign: "center", fontSize: 20, letterSpacing: 8, fontFamily: "monospace" }}
            autoFocus
          />
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
          <h2 className="page-title" style={{ color: "var(--accent3)" }}>⚙️ Master Panel</h2>
          <p className="page-subtitle">Herramientas de desarrollo — solo para administradores</p>
        </div>
        <button className="btn-danger btn-sm" onClick={handleLock}>🔒 Bloquear</button>
      </div>

      {/* Generador de datos */}
      <div className="card" style={{ borderColor: "var(--accent3)", marginBottom: 16 }}>
        <div className="card-title">🧪 Generar Datos de Prueba</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr 2fr" }}>
            <label>
              Registros de bitácora
              <input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min={1} max={500} />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <button className="btn-primary btn-sm" onClick={() => generateBitacora(count)}>Generar Bitácora</button>
              <button className="btn-primary btn-sm" onClick={() => generateFincas()}>Generar Fincas</button>
              <button className="btn-primary btn-sm" onClick={() => generateParams()}>Generar Parámetros</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => generateAll()}>⚡ Generar Todo</button>
            <button className="btn-danger" onClick={clearAll}>🗑️ Limpiar Todo</button>
          </div>
        </div>
      </div>

      {/* Export / Import */}
      <div className="card" style={{ borderColor: "var(--accent3)", marginBottom: 16 }}>
        <div className="card-title">📦 Exportar / Importar Datos</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-primary btn-sm" onClick={handleExport}>⬇️ Exportar todo (JSON)</button>
          <button className="btn-primary btn-sm" onClick={() => fileRef.current?.click()}>⬆️ Importar (JSON)</button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
          <button className="btn-primary btn-sm" onClick={handleDiagnostic}>📋 Descargar diagnóstico</button>
        </div>
      </div>

      {/* localStorage Editor */}
      <div className="card" style={{ borderColor: "var(--accent3)", marginBottom: 16 }}>
        <div className="card-title">💾 Editor de localStorage</div>
        <button className="btn btn-sm" onClick={() => { setShowKeys(!showKeys); if (!showKeys) refreshLsKeys(); }}>
          {showKeys ? "Ocultar" : "Mostrar"} claves ({lsKeys.length})
        </button>
        {showKeys && (
          <div style={{ marginTop: 12 }}>
            {lsKeys.length === 0 && <p style={{ fontSize: 12, color: "var(--text2)" }}>No hay claves aquacalc_</p>}
            {lsKeys.map((k) => (
              <div key={k} style={{ borderBottom: "1px solid var(--border)", padding: "8px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: 12, color: "var(--accent2)" }}>{k}</strong>
                    <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 8 }}>
                      {(localStorage.getItem(k)?.length ?? 0).toLocaleString()} bytes
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-sm" style={{ fontSize: 11 }} onClick={() => startEdit(k)}>
                      {editingKey === k ? "✕ Cerrar" : "✏️ Editar"}
                    </button>
                    <button className="btn-sm" style={{ fontSize: 11, color: "var(--danger)" }} onClick={() => deleteKey(k)}>🗑️</button>
                  </div>
                </div>
                {editingKey === k && (
                  <div style={{ marginTop: 8 }}>
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      style={{ width: "100%", minHeight: 120, fontSize: 11, fontFamily: "monospace" }}
                    />
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button className="btn-primary btn-sm" onClick={saveEdit}>💾 Guardar</button>
                      <button className="btn-sm" onClick={() => setEditingKey(null)}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PWA Cache */}
      <div className="card" style={{ borderColor: "var(--accent3)", marginBottom: 16 }}>
        <div className="card-title">📦 PWA Cache Inspector</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-primary btn-sm" onClick={loadCaches}>🔍 Inspeccionar cachés</button>
          <button className="btn-danger btn-sm" onClick={clearCaches}>🗑️ Limpiar todas</button>
        </div>
        {showCache && (
          <div style={{ marginTop: 12, fontSize: 12, fontFamily: "monospace" }}>
            {cachesInfo.length === 0 && <p style={{ color: "var(--text2)" }}>No hay cachés registrados.</p>}
            {cachesInfo.map((c) => (
              <div key={c.name} style={{ marginBottom: 10 }}>
                <strong style={{ color: "var(--accent)" }}>{c.name}</strong>
                <span style={{ color: "var(--text3)", marginLeft: 8 }}>({c.urls.length} entradas)</span>
                <div style={{ maxHeight: 120, overflowY: "auto", marginTop: 4, background: "var(--surface2)", padding: 6, borderRadius: 6 }}>
                  {c.urls.map((u, i) => <div key={i} style={{ fontSize: 10, color: "var(--text2)", wordBreak: "break-all" }}>{u}</div>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Utilidades */}
      <div className="card" style={{ borderColor: "var(--accent3)", marginBottom: 16 }}>
        <div className="card-title">🔧 Utilidades</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-primary btn-sm" onClick={resetTutorial}>🔄 Reiniciar Tutorial</button>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 20 }}>
        Esta página no aparece en la navegación. Accedé tocando el logo 5 veces.
      </p>
    </div>
  );
}
