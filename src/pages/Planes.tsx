import { useState } from "react";
import { useAuth } from "@/store/auth";
import { toast } from "@/components/Toast";
import { PLANES } from "@/core";
import { createApi } from "@/services/api";

const ROLES = [
  { id: "gestor", label: "Gestor de finca", desc: "Gestión completa de fincas y producción" },
  { id: "tecnico", label: "Técnico", desc: "Monitoreo, bitácora y parámetros WQ" },
  { id: "admin", label: "Admin", desc: "Acceso total incluyendo panel de administración" },
] as const;

const ROLES_BY_PLAN: Record<string, string[]> = {
  free: ["gestor"],
  pro: ["gestor", "tecnico"],
  enterprise: ["admin", "gestor", "tecnico"],
};

export default function Planes() {
  const { plan, rol, token } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const handleUpgrade = async (priceId: "pro_monthly" | "enterprise_monthly") => {
    if (!token) { toast("Debés iniciar sesión", "error"); return; }
    setLoading(priceId);
    try {
      const res = await createApi(token).post<{ url: string }>("/pagos/checkout", { priceId });
      window.location.href = res.url;
    } catch (err: any) {
      toast(err.message || "Error al iniciar pago", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleChangeRol = async (newRol: string) => {
    if (!token) return;
    setRoleLoading(true);
    try {
      await createApi(token).post("/pagos/rol", { rol: newRol });
      toast(`Rol cambiado a ${ROLES.find((r) => r.id === newRol)?.label}`, "success");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast(err.message || "Error al cambiar rol", "error");
    } finally {
      setRoleLoading(false);
    }
  };

  const paidPlan = plan !== "free";
  const availableRoles = ROLES_BY_PLAN[plan] || ["gestor"];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Planes y Precios</h2>
        <p className="page-subtitle">Plan actual: <strong>{plan}</strong></p>
      </div>

      {paidPlan && (
        <div className="card" style={{ marginBottom: 20, borderColor: "var(--accent2)" }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Rol de usuario</div>
          <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
            Elegí el rol que mejor se adapte a tu trabajo. Según tu plan {plan.toUpperCase()}, tenés disponibles:
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {ROLES.filter((r) => availableRoles.includes(r.id)).map((r) => {
              const isActive = r.id === rol;
              return (
                <button key={r.id}
                  onClick={() => !isActive && !roleLoading && handleChangeRol(r.id)}
                  disabled={isActive || roleLoading}
                  style={{
                    flex: "1 1 200px", padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                    border: isActive ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: isActive ? "rgba(0,200,150,0.06)" : "var(--surface)",
                    color: "var(--text)", textAlign: "left", transition: "all 0.15s", opacity: roleLoading ? 0.6 : 1,
                  }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? "var(--accent)" : "var(--text)" }}>
                    {isActive ? "✓ " : ""}{r.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{r.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {PLANES.map((p) => {
          const isCurrent = p.id === plan;
          return (
            <div key={p.id} className="card" style={{
              flex: "1 1 280px", maxWidth: 320, textAlign: "center",
              borderColor: isCurrent ? "var(--accent)" : "var(--border)",
              borderWidth: isCurrent ? 2 : 1,
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{p.label}</h3>
              <p style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>{p.desc}</p>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>{p.precio}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, textAlign: "left" }}>
                {p.features.map((f) => (
                  <li key={f} style={{ padding: "4px 0" }}>✓ {f}</li>
                ))}
              </ul>
              <div style={{ marginTop: 20 }}>
                {isCurrent ? (
                  <button className="btn-secondary btn-sm" disabled>
                    Plan actual
                  </button>
                ) : p.id === "free" ? (
                  <button className="btn-secondary btn-sm" disabled>
                    Gratuito
                  </button>
                ) : (
                  <button className="btn-primary" onClick={() => handleUpgrade(p.id === "pro" ? "pro_monthly" : "enterprise_monthly")} disabled={loading === p.id + "_monthly"}>
                    {loading === p.id + "_monthly" ? "Procesando..." : `Actualizar a ${p.label}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
