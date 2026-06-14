import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/store/auth";
import { createApi } from "@/services/api";
import type { Lote } from "@/core";

const STORAGE_KEY = "acuical_lotes";

function loadLocal(): Lote[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export function useLotes() {
  const { token } = useAuth();
  const [lotes, setLotes] = useState<Lote[]>(loadLocal);

  const client = useMemo(() => token ? createApi(token) : null, [token]);

  const reload = useCallback(() => {
    if (!client) return;
    client.get<any[]>("/lotes").then((data: any[]) => {
      setLotes(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }).catch(() => setLotes(loadLocal()));
  }, [client]);

  useEffect(() => { reload(); }, [reload]);

  const lotesActivos = lotes.filter((l) => l.activo);
  const lotesCerrados = lotes.filter((l) => !l.activo);

  return { lotes, lotesActivos, lotesCerrados, reload };
}
