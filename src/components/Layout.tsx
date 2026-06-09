import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "@/store/language";
import type { Idioma } from "@/core";
import { useState, useEffect } from "react";
import ProfileModal, { useProfile } from "./Profile";

const links = [
  { to: "/", key: "calc", emoji: "🧮" },
  { to: "/bitacora", key: "bitacora", emoji: "📋" },
  { to: "/zootecnico", key: "zootecnico", emoji: "🔬" },
  { to: "/parametros", key: "params", emoji: "⚙️" },
  { to: "/especies", key: "especies", emoji: "🐠" },
  { to: "/formulas", key: "formulas", emoji: "📐" },
  { to: "/fincas", key: "fincas", emoji: "🏠" },
] as const;

const IDIOMA_OPTS: { value: Idioma; label: string }[] = [
  { value: "es", label: "ES" },
  { value: "en", label: "EN" },
  { value: "pt", label: "PT" },
];

export default function Layout() {
  const { t, lang, setLang } = useTranslation();
  const [online, setOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
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
    <div>
      {!online && <div className="offline-bar">{t("offline")}</div>}
      <header className="app-header">
        <div className="app-logo">
          <span className="app-logo-icon">🐟</span>
          <div>
            <h1>AquaCalc</h1>
            <span className="app-logo-sub">{t("calculadoraSub").toUpperCase()}</span>
          </div>
        </div>
        <div className="header-right">
          <button className="profile-btn" onClick={() => setProfileOpen(true)}>
            {profile.nombre ? profile.nombre.charAt(0).toUpperCase() : "👤"}
          </button>
          {deferredPrompt && <button className="install-btn" onClick={handleInstallClick}>{t("install")}</button>}
          <div className="lang-switch">
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
      </header>
      <nav className="app-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            {l.emoji} {t(l.key)}
          </NavLink>
        ))}
      </nav>
      <main className="app-content">
        <Outlet />
      </main>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} profile={profile} onSave={saveProfile} />
    </div>
  );
}
