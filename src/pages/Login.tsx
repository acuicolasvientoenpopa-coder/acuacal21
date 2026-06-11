import { useState } from "react";
import { useAuth } from "@/store/auth";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "@/store/language";
import type { Idioma } from "@/core";

export default function Login() {
  const { login, register, resetPassword } = useAuth();
  const { lang, setLang, t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("productor");
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailSent(false);

    if (mode === "forgot") {
      setLoading(true);
      const err = await resetPassword(email);
      if (err) { setError(err); setLoading(false); }
      else { setEmailSent(true); setLoading(false); }
      return;
    }

    if (mode === "register" && !acepto) { setError(t("mustAcceptTerms")); return; }
    setLoading(true);

    const err = mode === "register"
      ? await register(email, password, nombre, rol)
      : await login(email, password);

    if (err) { setError(err); setLoading(false); }
    else { navigate("/"); }
  };

  const titleKey = mode === "forgot" ? "forgotTitle" : mode === "register" ? "registerTitle" : "loginTitle";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <div className="card" style={{ maxWidth: 400, width: "100%" }}>
        <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🐟</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 4 }}>
          {t(titleKey)}
        </h3>
        <p style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", marginBottom: 20 }}>
          {t("loginSubtitle")}
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
          {(["es", "en", "pt"] as Idioma[]).map((id) => (
            <button key={id} onClick={() => setLang(id)}
              style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, border: lang === id ? "2px solid var(--accent)" : "1px solid var(--border)", background: lang === id ? "var(--accent)" : "transparent", color: lang === id ? "#fff" : "var(--text)", cursor: "pointer", fontWeight: lang === id ? 700 : 400 }}>
              {id === "es" ? "🇪🇸 ES" : id === "en" ? "🇺🇸 EN" : "🇧🇷 PT"}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: "rgba(255,77,109,0.1)", border: "1px solid var(--danger)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--danger)", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {emailSent ? (
          <div style={{ background: "rgba(46,213,115,0.1)", border: "1px solid var(--success)", borderRadius: 8, padding: "12px", fontSize: 13, color: "var(--success)", marginBottom: 16, textAlign: "center" }}>
            {t("checkEmail")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <label style={{ fontSize: 11, color: "var(--text2)", display: "flex", flexDirection: "column", gap: 4 }}>
                {t("name")}
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("namePlaceholder")} required />
              </label>
            )}
            {mode === "register" && (
              <label style={{ fontSize: 11, color: "var(--text2)", display: "flex", flexDirection: "column", gap: 4 }}>
                {t("rolLabel")}
                <select value={rol} onChange={(e) => setRol(e.target.value)} style={{ width: "100%" }}>
                  <option value="productor">{t("rolProductor")}</option>
                  <option value="tecnico">{t("rolTecnico")}</option>
                </select>
              </label>
            )}
            <label style={{ fontSize: 11, color: "var(--text2)", display: "flex", flexDirection: "column", gap: 4 }}>
              {t("emailLabel")}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} required />
            </label>
            {mode !== "forgot" && (
              <label style={{ fontSize: 11, color: "var(--text2)", display: "flex", flexDirection: "column", gap: 4 }}>
                {t("passwordLabel")}
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("passwordPlaceholder")} required minLength={6} />
              </label>
            )}
            {mode === "register" && (
              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
                <span>{t("acceptTerms")} <Link to="/terminos" style={{ color: "var(--accent)" }} target="_blank">{t("termsAndConditions")}</Link></span>
              </label>
            )}
            <button className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
              {loading ? t("loadingText") : mode === "forgot" ? t("sendLink") : mode === "register" ? t("registerButton") : t("loginButton")}
            </button>
          </form>
        )}

        <p style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", marginTop: 16 }}>
          {mode === "forgot" ? (
            <button onClick={() => { setMode("login"); setError(""); setEmailSent(false); }}
              style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
              {t("backToLogin")}
            </button>
          ) : (
            <>
              {mode === "login" ? t("noAccount") : t("hasAccount")}{" "}
              <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setEmailSent(false); }}
                style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                {mode === "login" ? t("registerLink") : t("loginLink")}
              </button>
              {mode === "login" && (
                <>
                  {" · "}
                  <button onClick={() => { setMode("forgot"); setError(""); setEmailSent(false); }}
                    style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontWeight: 400, fontSize: 12, textDecoration: "underline" }}>
                    {t("forgotPassword")}
                  </button>
                </>
              )}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
