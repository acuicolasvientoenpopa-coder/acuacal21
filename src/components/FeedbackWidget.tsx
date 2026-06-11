import { useState } from "react";
import { toast } from "@/components/Toast";

const API = "https://acuacal21-production.up.railway.app/api";
const LS_KEY = "aquacalc_feedback_pending";

type Feedback = { name: string; email: string; message: string; rating: number; page: string };

function loadPending(): Feedback[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}

function savePending(list: Feedback[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

async function send(fb: Feedback): Promise<boolean> {
  try {
    const res = await fetch(`${API}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fb),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!message.trim()) return;
    const fb: Feedback = { name: name.trim(), email: email.trim(), message: message.trim(), rating, page: window.location.pathname };
    setSending(true);
    const ok = await send(fb);
    if (ok) {
      toast("¡Gracias por tu feedback!", "success");
    } else {
      const pending = loadPending();
      pending.push(fb);
      savePending(pending);
      toast("Feedback guardado. Se enviará cuando tengas conexión.", "info");
    }
    setSending(false);
    setOpen(false);
    setName(""); setEmail(""); setMessage(""); setRating(0);
  };

  return (
    <>
      <button className="feedback-fab" onClick={() => setOpen(true)} title="Enviar feedback">
        💬
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-title">💬 Enviar feedback</div>
            <div className="form-grid" style={{ gap: 10 }}>
              <label>Nombre (opcional)<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" /></label>
              <label>Email (opcional)<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" type="email" /></label>
              <label style={{ gridColumn: "1 / -1" }}>
                Mensaje <span style={{ color: "var(--danger)" }}>*</span>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="¿Qué te gustaría mejorar?" rows={4} />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Valoración
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} onClick={() => setRating(n === rating ? 0 : n)}
                      style={{ fontSize: 24, cursor: "pointer", opacity: n <= rating ? 1 : 0.3 }}>
                      ★
                    </span>
                  ))}
                </div>
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={submit} disabled={!message.trim() || sending}>
                {sending ? "Enviando..." : "Enviar feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
