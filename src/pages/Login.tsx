import { useState } from "react";
import { useAuth } from "@/store/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister && !acepto) { setError("Debés aceptar los Términos y Condiciones"); return; }
    setError("");
    setLoading(true);

    const err = isRegister
      ? await register(email, password, nombre)
      : await login(email, password);

    if (err) { setError(err); setLoading(false); }
    else { navigate("/"); }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <div className="card" style={{ maxWidth: 400, width: "100%" }}>
        <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🐟</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 4 }}>
          {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
        </h3>
        <p style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", marginBottom: 20 }}>
          AcuiCal — Gestión Acuícola
        </p>

        {error && (
          <div style={{ background: "rgba(255,77,109,0.1)", border: "1px solid var(--danger)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--danger)", marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isRegister && (
            <label style={{ fontSize: 11, color: "var(--text2)", display: "flex", flexDirection: "column", gap: 4 }}>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" required />
            </label>
          )}
          <label style={{ fontSize: 11, color: "var(--text2)", display: "flex", flexDirection: "column", gap: 4 }}>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
          </label>
          <label style={{ fontSize: 11, color: "var(--text2)", display: "flex", flexDirection: "column", gap: 4 }}>
            Contraseña
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </label>
          {isRegister && (
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
              <span>Acepto los <Link to="/terminos" style={{ color: "var(--accent)" }} target="_blank">Términos y Condiciones</Link></span>
            </label>
          )}
          <button className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
            {loading ? "Cargando..." : isRegister ? "Crear Cuenta" : "Ingresar"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", marginTop: 16 }}>
          {isRegister ? "¿Ya tenés cuenta?" : "¿No tenés cuenta?"}{" "}
          <button onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
            {isRegister ? "Iniciar Sesión" : "Registrarse"}
          </button>
        </p>
      </div>
    </div>
  );
}
