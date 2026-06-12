import { useState } from "react";
import { useAuth } from "@/store/auth";
import { toast } from "@/components/Toast";
import { PLANES } from "@/core";
import { api } from "@/services/api";

export default function Planes() {
  const { plan, token } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (priceId: "pro_monthly" | "enterprise_monthly") => {
    if (!token) { toast("Debés iniciar sesión", "error"); return; }
    setLoading(priceId);
    try {
      const res = await api(token).post("/pagos/checkout", { priceId });
      window.location.href = res.url;
    } catch (err: any) {
      toast(err.message || "Error al iniciar pago", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Planes y Precios</h2>
        <p className="page-subtitle">Plan actual: <strong>{plan}</strong></p>
      </div>

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
                  <li key={f} style={{ padding: "4px 0" }}>✅ {f}</li>
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
