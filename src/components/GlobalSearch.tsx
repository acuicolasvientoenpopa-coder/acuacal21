import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

interface Result {
  label: string;
  detail: string;
  emoji: string;
  to: string;
  badge: string;
}

function searchAll(q: string): Result[] {
  if (q.length < 2) return [];
  const lq = q.toLowerCase();
  const results: Result[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("aquacalc_")) continue;
    const data = localStorage.getItem(key);
    if (!data) continue;
    let arr: any[];
    try { arr = JSON.parse(data); if (!Array.isArray(arr)) continue; } catch { continue; }

    for (const item of arr) {
      try {
        const rawFields = [item.estanque, item.estanqueNombre, item.fincaNombre, item.nombre, item.producto, item.agente, item.especie, item.pondName]
        const fields = rawFields.filter((s: unknown): s is string => typeof s === "string" && s.length > 0).map((s: string) => s.toLowerCase());

        if (!fields.some((f: string) => f.includes(lq))) continue;

        let emoji = "📄", badge = key.replace("aquacalc_", "");
        if (key.includes("bitacora")) emoji = "📋";
        else if (key.includes("fincas")) emoji = "🏠";
        else if (key.includes("cultivos")) emoji = "🧫";
        else if (key.includes("medicacion")) emoji = "💊";
        else if (key.includes("finanzas")) emoji = "💰";
        else if (key.includes("species")) emoji = "🐠";
        else if (key.includes("vet")) emoji = "🏥";

        let to = "/";
        if (key.includes("bitacora")) to = "/bitacora";
        else if (key.includes("fincas")) to = "/fincas";
        else if (key.includes("cultivos") || key.includes("medicacion")) to = "/micro";
        else if (key.includes("finanzas")) to = "/finanzas";
        else if (key.includes("species")) to = "/especies";
        else if (key.includes("vet")) to = "/vet";

        const label = item.nombre || item.estanque || item.estanqueNombre || item.fincaNombre || item.producto || item.agente || item.especie || item.pondName || "—";
        const detail = item.fecha || item.ubicacion || item.carga || item.dosis || "";

        results.push({ label, detail, emoji, to, badge });
        if (results.length >= 20) return results;
      } catch { continue; }
    }
  }
  return results;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleChange = (v: string) => {
    setQuery(v);
    setResults(searchAll(v));
    setOpen(v.length >= 2);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length > 0) {
      navigate(results[0].to);
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="global-search-wrap" ref={ref}>
      <span className="global-search-icon">🔍</span>
      <input
        className="global-search-input"
        type="text"
        placeholder={"Buscar..."}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
      />
      {open && results.length > 0 && (
        <div className="global-search-results">
          {results.map((r, i) => (
            <Link key={i} to={r.to} className="gsr-item" onClick={() => { setOpen(false); setQuery(""); }}>
              <span className="gsr-item-emoji">{r.emoji}</span>
              <span className="gsr-item-text">
                <div className="gsr-item-label">{r.label}</div>
                {r.detail && <div className="gsr-item-detail">{r.detail}</div>}
              </span>
              <span className="gsr-item-badge">{r.badge}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}