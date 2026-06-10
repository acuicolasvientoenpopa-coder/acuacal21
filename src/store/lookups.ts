import { useState, useEffect, useCallback } from "react";
import { ESPECIES_DEFAULT, getAllSpecies, type Species } from "@/core/species-defaults";

export interface LookupItem { id: string; label: string; raw?: Species | any; }

interface FincaRaw { id: string; nombre: string; estanques?: string[]; [key: string]: any; }

function migrarFinca(f: any): FincaRaw {
  return Array.isArray(f.estanques) ? f : { ...f, estanques: f.nombre ? [f.nombre] : [] };
}

function extraerEstanques(fincas: FincaRaw[]): LookupItem[] {
  const est: LookupItem[] = [];
  for (const f of fincas) {
    for (const e of (f.estanques || [])) {
      est.push({ id: `${f.id}||${e}`, label: `${f.nombre} → ${e}`, raw: { fincaId: f.id, fincaNombre: f.nombre, estanqueNombre: e } });
    }
  }
  return est;
}

export function useLookups() {
  const [species, setSpecies] = useState<LookupItem[]>(() => {
    try {
      const custom = JSON.parse(localStorage.getItem("aquacalc_custom_species") || "[]");
      return getAllSpecies(custom).map((s) => ({ id: s.id, label: s.nombre, raw: s }));
    } catch { return ESPECIES_DEFAULT.map((s) => ({ id: s.id, label: s.nombre, raw: s })); }
  });
  const [fincas, setFincas] = useState<LookupItem[]>(() => {
    try { return (JSON.parse(localStorage.getItem("aquacalc_fincas") || "[]")).map((f: any) => { const fm = migrarFinca(f); return { id: fm.id, label: fm.nombre, raw: fm }; }); } catch { return []; }
  });
  const [estanques, setEstanques] = useState<LookupItem[]>(() => {
    try { const fs = (JSON.parse(localStorage.getItem("aquacalc_fincas") || "[]")).map(migrarFinca); return extraerEstanques(fs); } catch { return []; }
  });

  const reload = useCallback(() => {
    try {
      const custom = JSON.parse(localStorage.getItem("aquacalc_custom_species") || "[]");
      setSpecies(getAllSpecies(custom).map((s) => ({ id: s.id, label: s.nombre, raw: s })));
    } catch { setSpecies(ESPECIES_DEFAULT.map((s) => ({ id: s.id, label: s.nombre, raw: s }))); }
    try {
      const fs = (JSON.parse(localStorage.getItem("aquacalc_fincas") || "[]")).map(migrarFinca);
      setFincas(fs.map((f: any) => ({ id: f.id, label: f.nombre, raw: f })));
      setEstanques(extraerEstanques(fs));
    } catch { setFincas([]); setEstanques([]); }
  }, []);

  useEffect(() => {
    const h = () => reload();
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, [reload]);

  return { species, fincas, estanques, reload };
}
