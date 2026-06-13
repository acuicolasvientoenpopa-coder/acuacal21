import { useState, useEffect } from "react";
import { getQueueLength } from "@/services/sync";

export default function SyncBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function check() {
      const n = await getQueueLength();
      setCount(n);
    }
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span
      title={`${count} operación(es) pendiente(s) de sincronizar`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 10, fontWeight: 700, color: "var(--accent3)",
        padding: "2px 8px", borderRadius: 10,
        background: "rgba(240,165,0,0.15)",
        cursor: "pointer",
      }}
    >
      🔄 {count}
    </span>
  );
}
