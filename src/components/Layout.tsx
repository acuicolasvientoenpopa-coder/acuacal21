import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "@/store/language";
import type { Idioma } from "@/core";
import { useState, useEffect, useRef } from "react";
import ProfileModal, { useProfile } from "./Profile";
import Tutorial from "./Tutorial";

const links = [
  { to: "/", key: "calc", emoji: "🧮" },
  { to: "/bitacora", key: "bitacora", emoji: "📋" },
  { to: "/zootecnico", key: "zootecnico", emoji: "🔬" },
  { to: "/parametros", key: "params", emoji: "⚙️" },
  { to: "/especies", key: "especies", emoji: "🐠" },
  { to: "/formulas", key: "formulas", emoji: "📐" },
  { to: "/fincas", key: "fincas", emoji: "🏠" },
  { to: "/vet", key: "vet", emoji: "🏥" },
] as const;

const IDIOMA_OPTS: { value: Idioma; label: string }[] = [
  { value: "es", label: "ES" },
  { value: "en", label: "EN" },
  { value: "pt", label: "PT" },
];

export default function Layout() {
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const [online, setOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, saveProfile } = useProfile();
  const logoClickCount = useRef(0);

  const handleLogoClick = () => {
    logoClickCount.current++;
    if (logoClickCount.current >= 5) {
      logoClickCount.current = 0;
      navigate("/master");
    }
  };

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
        <div className="app-logo" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
          <span className="app-logo-icon">🐟</span>
          <div>
            <h1>AquaCalc</h1>
            <span className="app-logo-sub">{t("calculadoraSub").toUpperCase()}</span>
          </div>
        </div>
        <div className="header-right">
          <button className="help-btn" onClick={() => setHelpOpen(true)} title={t("help")}>?</button>
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
              <span className="sidebar-link-label">{t(l.key)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-lang">
            {IDIOMA_OPTS.map((o) => (
              <button
                key={o.value}
                className={`lang-btn${lang === o.value ? " active" : ""}`}
                onClick={() => setLang(o.value)}
              >
                {o.label}
              </button>
            ))}
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
