import { useTranslation } from "@/store/language";
import { useNavigate } from "react-router-dom";

interface ModInfo {
  id: string;
  emoji: string;
  label: string;
  status: "ok" | "partial" | "pending";
  route?: string;
  desc?: string;
}

const CORE_MODS: ModInfo[] = [
  { id: "formulas", emoji: "📐", label: "Fórmulas", status: "ok", desc: "calcular(), calcRacion(), 11 refs" },
  { id: "species", emoji: "🐟", label: "Especies", status: "ok", desc: "7 especies + ENERGY_DEFAULTS" },
  { id: "currencies", emoji: "💱", label: "Monedas", status: "ok", desc: "16 monedas con locale" },
  { id: "i18n", emoji: "🔤", label: "i18n", status: "ok", desc: "~430 claves × 3 idiomas" },
  { id: "validators", emoji: "✅", label: "Validadores", status: "ok", desc: "WQ, formularios, email" },
  { id: "observations", emoji: "👀", label: "Observaciones", status: "ok", desc: "10 observaciones" },
];

const STORE_MODS: ModInfo[] = [
  { id: "language", emoji: "🌐", label: "LanguageProvider", status: "ok" },
  { id: "currency", emoji: "💰", label: "CurrencyProvider", status: "ok" },
  { id: "theme", emoji: "🎨", label: "ThemeProvider", status: "ok" },
  { id: "lookups", emoji: "📋", label: "useLookups()", status: "ok" },
  { id: "inventario", emoji: "📦", label: "useInventario()", status: "ok" },
  { id: "saveIndicator", emoji: "💾", label: "useSaveIndicator()", status: "ok" },
];

const PAGE_MODS: ModInfo[] = [
  { id: "dashboard", emoji: "🏠", label: "Dashboard", status: "ok", route: "/" },
  { id: "calc", emoji: "🧮", label: "Calculadora", status: "ok", route: "/calc" },
  { id: "bitacora", emoji: "📋", label: "Bitácora", status: "ok", route: "/bitacora" },
  { id: "zootecnico", emoji: "🔬", label: "Zootécnico", status: "ok", route: "/zootecnico" },
  { id: "especies", emoji: "🐠", label: "Especies", status: "ok", route: "/especies" },
  { id: "fincas", emoji: "🏠", label: "Fincas", status: "ok", route: "/fincas" },
  { id: "parametros", emoji: "⚙️", label: "Parámetros", status: "ok", route: "/parametros" },
  { id: "formulas", emoji: "📐", label: "Ref. Técnicas", status: "ok", route: "/formulas" },
  { id: "micro", emoji: "🧫", label: "Microbiología", status: "ok", route: "/micro" },
  { id: "finanzas", emoji: "💰", label: "Finanzas", status: "ok", route: "/finanzas" },
  { id: "vet", emoji: "🏥", label: "Veterinaria", status: "ok", route: "/vet" },
  { id: "inventario", emoji: "📦", label: "Inventario", status: "ok", route: "/inventario" },
  { id: "master", emoji: "⚡", label: "Admin Panel", status: "ok", route: "/admin" },
];

const PENDING_MODS: ModInfo[] = [
  { id: "backend", emoji: "🗄️", label: "Backend API", status: "pending", desc: "Node.js + Express + REST" },
  { id: "database", emoji: "🐘", label: "Base de datos", status: "pending", desc: "PostgreSQL + Prisma" },
  { id: "auth", emoji: "🔐", label: "Autenticación", status: "pending", desc: "JWT + registro + login" },
  { id: "multiuser", emoji: "👥", label: "Multi-usuario", status: "pending", desc: "Roles + permisos" },
  { id: "subscription", emoji: "💳", label: "Suscripciones", status: "pending", desc: "Stripe + planes" },
  { id: "sync", emoji: "🔄", label: "Sync offline", status: "pending", desc: "localStorage → nube" },
  { id: "tests", emoji: "🧪", label: "Tests", status: "pending", desc: "Unitarios + e2e" },
  { id: "ci", emoji: "📦", label: "CI/CD", status: "pending", desc: "GitHub Actions" },
];

function ModCard({ m, onClick }: { m: ModInfo; onClick?: () => void }) {
  const color = m.status === "ok" ? "var(--accent)" : m.status === "partial" ? "var(--accent3)" : "var(--danger)";
  const bg = m.status === "ok" ? "rgba(0,200,150,0.06)" : m.status === "partial" ? "rgba(255,180,0,0.08)" : "rgba(220,60,50,0.06)";
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
        borderRadius: 10, border: `1px solid ${color}40`, background: bg,
        cursor: onClick ? "pointer" : undefined, transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLDivElement).style.borderColor = color; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${color}40`; }}
      title={m.desc}
    >
      <span style={{ fontSize: 20 }}>{m.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</div>
        {m.desc && <div style={{ fontSize: 11, color: "var(--text3)" }}>{m.desc}</div>}
      </div>
      <span style={{ fontSize: 16 }}>{m.status === "ok" ? "✅" : m.status === "partial" ? "🔶" : "❌"}</span>
    </div>
  );
}

export default function Mapa() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">🗺️ {t("mapaTitle")}</h2>
          <p className="page-subtitle">{t("mapaSub")}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", fontSize: 13 }}>
        <span>✅ {t("mapaCompleto")}</span>
        <span style={{ color: "var(--accent3)" }}>🔶 {t("mapaParcial")}</span>
        <span style={{ color: "var(--danger)" }}>❌ {t("mapaPendiente")}</span>
      </div>

      {/* Capa 1: Core */}
      <div className="mapa-layer">
        <div className="mapa-layer-title" style={{ color: "var(--accent)" }}>
          🧠 {t("mapaCore")}
          <span className="mapa-layer-badge">TypeScript puro, sin React</span>
        </div>
        <div className="mapa-layer-desc">{t("mapaCoreDesc")}</div>
        <div className="mapa-grid">
          {CORE_MODS.map((m) => <ModCard key={m.id} m={m} />)}
        </div>
      </div>

      {/* Flecha conectora */}
      <div className="mapa-arrow">⬇️ <span>{t("mapaImporta")}</span></div>

      {/* Capa 2: Store */}
      <div className="mapa-layer">
        <div className="mapa-layer-title" style={{ color: "var(--accent2)" }}>
          🗄️ {t("mapaStore")}
          <span className="mapa-layer-badge">React Context</span>
        </div>
        <div className="mapa-layer-desc">{t("mapaStoreDesc")}</div>
        <div className="mapa-grid">
          {STORE_MODS.map((m) => <ModCard key={m.id} m={m} />)}
        </div>
      </div>

      {/* Flecha conectora */}
      <div className="mapa-arrow">⬇️ <span>{t("mapaUsa")}</span></div>

      {/* Capa 3: Páginas */}
      <div className="mapa-layer">
        <div className="mapa-layer-title" style={{ color: "var(--accent3)" }}>
          📄 {t("mapaPages")}
          <span className="mapa-layer-badge">13 páginas</span>
        </div>
        <div className="mapa-layer-desc">{t("mapaPagesDesc")}</div>
        <div className="mapa-grid">
          {PAGE_MODS.map((m) => <ModCard key={m.id} m={m} onClick={() => m.route && navigate(m.route)} />)}
        </div>
      </div>

      {/* Infraestructura pendiente */}
      <div className="mapa-layer" style={{ borderColor: "var(--danger)", marginTop: 28 }}>
        <div className="mapa-layer-title" style={{ color: "var(--danger)" }}>
          🏗️ {t("mapaInfra")}
          <span className="mapa-layer-badge">{t("mapaPendiente")}</span>
        </div>
        <div className="mapa-layer-desc">{t("mapaInfraDesc")}</div>
        <div className="mapa-grid">
          {PENDING_MODS.map((m) => <ModCard key={m.id} m={m} />)}
        </div>
      </div>

      <div style={{ marginTop: 28, fontSize: 12, color: "var(--text3)", textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        {t("mapaFooter")}
      </div>
    </div>
  );
}
