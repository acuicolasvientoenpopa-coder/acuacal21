import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "@/store/language";
import { useCurrency } from "@/store/currency";
import { useTheme } from "@/store/theme";
import { useAuth } from "@/store/auth";
import type { Idioma } from "@/core";
import { MONEDAS } from "@/core";
import { useState, useEffect, useRef } from "react";
import ProfileModal, { useProfile } from "./Profile";
import Tutorial from "./Tutorial";
import GlobalSearch from "./GlobalSearch";
import { NAV_LINKS } from "@/data/navLinks";

const links = NAV_LINKS;

const IDIOMA_OPTS: { value: Idioma; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

export default function Layout() {
  const { t, lang, setLang } = useTranslation();
  const { code, setCode } = useCurrency();
  const { theme, toggle: toggleTheme } = useTheme();
  const [currSearch, setCurrSearch] = useState("");
  const [currOpen, setCurrOpen] = useState(false);
  const currRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (currRef.current && !currRef.current.contains(e.target as Node)) setCurrOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const [online, setOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { profile, saveProfile } = useProfile();

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    const handleInstall = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("beforeinstallprompt", handleInstall);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("beforeinstallprompt", handleInstall);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    (deferredPrompt as any).prompt();
    (deferredPrompt as any).userChoice.then(() => setDeferredPrompt(null));
  };

  return (
    <div className="layout">
      {!online && <div className="offline-bar">{t("offline")}</div>}
      <header className="app-header">
        <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Menu">☰</button>
        <div className="app-logo">
          <span className="app-logo-icon">🐟</span>
          <div>
            <h1>AquaCalc</h1>
            <span className="app-logo-sub">{t("calculadoraSub").toUpperCase()}</span>
          </div>
        </div>
        <div className="header-right">
          <GlobalSearch />
          <button className="theme-toggle" onClick={toggleTheme}>{theme === "dark" ? "☀️" : "🌙"}</button>
          <button className="help-btn" onClick={() => setHelpOpen(true)} title={t("help")}>?</button>
          {user && (
            <span style={{ fontSize: 12, color: "var(--text2)", marginRight: 4 }}>
              {user.email?.split("@")[0]}
            </span>
          )}
          <button className="theme-toggle" style={{ border: "none", fontSize: 11 }} onClick={logout} title="Cerrar sesión">🚪</button>
          <button className="profile-btn" onClick={() => setProfileOpen(true)}>
            {profile.nombre ? profile.nombre.charAt(0).toUpperCase() : "👤"}
          </button>
          {deferredPrompt && <button className="install-btn" onClick={handleInstallClick}>{t("install")}</button>}
        </div>
      </header>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">🐟</span>
          <span className="sidebar-title">AquaCalc</span>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-link-icon">{l.emoji}</span>
              <span className="sidebar-link-label">{t(l.key as any)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-lang-group">
            <span className="sidebar-footer-label">{t("idioma")}</span>
            <select className="sidebar-lang-select" value={lang} onChange={(e) => setLang(e.target.value as Idioma)}>
              {IDIOMA_OPTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="sidebar-curr-group" ref={currRef}>
            <span className="sidebar-footer-label">{t("moneda")}</span>
            <button className="sidebar-curr-toggle" onClick={() => { setCurrOpen(!currOpen); setCurrSearch(""); }}>
              {MONEDAS[code]?.simbolo} {code}
            </button>
            {currOpen && (
              <div className="sidebar-curr-dropdown">
                <input
                  type="text"
                  className="currency-search"
                  placeholder={t("buscarMoneda")}
                  value={currSearch}
                  onChange={(e) => setCurrSearch(e.target.value)}
                  autoFocus
                />
                <div className="currency-options">
                  {Object.entries(MONEDAS).filter(([k, v]) =>
                    !currSearch || k.toLowerCase().includes(currSearch.toLowerCase()) ||
                    v.nombre.toLowerCase().includes(currSearch.toLowerCase()) ||
                    v.simbolo.toLowerCase().includes(currSearch.toLowerCase())
                  ).map(([k, v]) => (
                    <button
                      key={k}
                      className={`currency-opt${code === k ? " active" : ""}`}
                      onClick={() => { setCode(k); setCurrOpen(false); }}
                    >
                      {v.simbolo} {k} — {v.nombre}
                    </button>
                  ))}
          </div>
          <div style={{ marginTop: 8, textAlign: "center" }}>
            <a href="/terminos" style={{ fontSize: 11, color: "var(--text3)", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">📜 {t("terminos") || "Términos y Condiciones"}</a>
          </div>
        </div>
            )}
          </div>
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} profile={profile} onSave={saveProfile} />
      {helpOpen && <Tutorial lang={lang} onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
