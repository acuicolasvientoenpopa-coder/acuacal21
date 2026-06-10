export interface SymptomEntry {
  id: string;
  label: string;
  diagnosis: string;
  weight: number;
  fuente: string;
}

export const ALIMENTACION_RULES: SymptomEntry[] = [
  { id: "no_comen", label: "No están comiendo", diagnosis: "Anorexia", weight: 2, fuente: "Noga, E.J. (2010). Fish Disease: Diagnosis and Treatment. 2nd ed. Wiley-Blackwell. ISBN 978-0813806976." },
  { id: "comen_poco", label: "Comen menos de lo normal", diagnosis: "Hiporexia", weight: 1, fuente: "Roberts, R.J. (2012). Fish Pathology. 4th ed. Wiley-Blackwell. ISBN 978-1444332821." },
  { id: "vomitan", label: "Regurgitan el alimento", diagnosis: "Trastorno digestivo", weight: 3, fuente: "Stoskopf, M.K. (1993). Fish Medicine. W.B. Saunders. ISBN 978-0721645201." },
  { id: "competencia", label: "Competencia agresiva por comida", diagnosis: "Estrés social por hacinamiento", weight: 1, fuente: "Wedemeyer, G.A. (1996). Physiology of Fish in Intensive Culture Systems. Chapman & Hall. ISBN 978-0412081616." },
];

export const COMPORTAMIENTO_RULES: SymptomEntry[] = [
  { id: "superficie", label: "Nadan en superficie", diagnosis: "Hipoxia sospechada", weight: 3, fuente: "Boyd, C.E. & Tucker, C.S. (1998). Pond Aquaculture Water Quality Management. Springer. ISBN 978-0412071815." },
  { id: "letargia", label: "Letárgicos / poco movimiento", diagnosis: "Cuadro infeccioso o estrés metabólico", weight: 2, fuente: "Roberts, R.J. (2012). Fish Pathology. 4th ed. Wiley-Blackwell. ISBN 978-1444332821." },
  { id: "giran", label: "Nadan en círculos", diagnosis: "Posible patología neurológica", weight: 4, fuente: "Noga, E.J. (2010). Fish Disease: Diagnosis and Treatment. 2nd ed. Wiley-Blackwell. ISBN 978-0813806976." },
  { id: "saltan", label: "Saltan fuera del agua", diagnosis: "Irritación branquial o parasitosis", weight: 3, fuente: "Yanong, R.P.E. (2003). Use of Antibiotics in Ornamental Fish Aquaculture. UF/IFAS Circular 128." },
  { id: "aislados", label: "Se aíslan del grupo", diagnosis: "Comportamiento anormal por enfermedad", weight: 2, fuente: "Stoskopf, M.K. (1993). Fish Medicine. W.B. Saunders. ISBN 978-0721645201." },
];

export const SINTOMAS_RULES: SymptomEntry[] = [
  { id: "necrosis_aletas", label: "Aletas con tejido muerto", diagnosis: "Necrosis en aletas", weight: 4, fuente: "Roberts, R.J. (2012). Fish Pathology. 4th ed. Wiley-Blackwell. ISBN 978-1444332821." },
  { id: "manchas_blancas", label: "Manchas blancas", diagnosis: "Posible parasitosis (Ich)", weight: 3, fuente: "Noga, E.J. (2010). Fish Disease: Diagnosis and Treatment. 2nd ed. Wiley-Blackwell. ISBN 978-0813806976." },
  { id: "ojo_salton", label: "Ojos saltones o hundidos", diagnosis: "Exoftalmia / caquexia", weight: 3, fuente: "Stoskopf, M.K. (1993). Fish Medicine. W.B. Saunders. ISBN 978-0721645201." },
  { id: "branquias_palidas", label: "Branquias pálidas", diagnosis: "Anemia o mala oxigenación", weight: 3, fuente: "Boyd, C.E. & Tucker, C.S. (1998). Pond Aquaculture Water Quality Management. Springer. ISBN 978-0412071815." },
  { id: "lesiones_piel", label: "Lesiones en piel / escamas", diagnosis: "Dermatitis bacteriana o fúngica", weight: 2, fuente: "Roberts, R.J. (2012). Fish Pathology. 4th ed. Wiley-Blackwell. ISBN 978-1444332821." },
  { id: "hinchazon", label: "Hinchazón abdominal", diagnosis: "Ascitis / hidropesía", weight: 4, fuente: "Noga, E.J. (2010). Fish Disease: Diagnosis and Treatment. 2nd ed. Wiley-Blackwell. ISBN 978-0813806976." },
  { id: "hemorragias", label: "Hemorragias internas o externas", diagnosis: "Septicemia hemorrágica", weight: 4, fuente: "Roberts, R.J. (2012). Fish Pathology. 4th ed. Wiley-Blackwell. ISBN 978-1444332821." },
  { id: "heces_anormales", label: "Heces anormales (filamentosas)", diagnosis: "Posible parasitosis intestinal", weight: 2, fuente: "Stoskopf, M.K. (1993). Fish Medicine. W.B. Saunders. ISBN 978-0721645201." },
];

export const AGUA_RULES: SymptomEntry[] = [
  { id: "turbia", label: "Agua turbia", diagnosis: "Mala calidad de agua", weight: 2, fuente: "Boyd, C.E. (2015). Water Quality: An Introduction. Springer. ISBN 978-3319174457." },
  { id: "espuma", label: "Espuma superficial excesiva", diagnosis: "Exceso de materia orgánica", weight: 2, fuente: "Timmons, M.B. & Ebeling, J.M. (2010). Recirculating Aquaculture. 3rd ed. NRAC Publication." },
  { id: "olor", label: "Mal olor", diagnosis: "Putrefacción / anaerobiosis", weight: 3, fuente: "Hargreaves, J.A. & Tucker, C.S. (2004). Managing Ammonia in Fish Ponds. SRAC Publication No. 4603." },
  { id: "color_verde", label: "Color verdoso intenso", diagnosis: "Bloom de algas potencialmente tóxico", weight: 3, fuente: "Boyd, C.E. (2015). Water Quality: An Introduction. Springer. ISBN 978-3319174457." },
  { id: "mortalidad", label: "Mortalidad repentina", diagnosis: "Evento crítico de toxicidad o infección", weight: 5, fuente: "Noga, E.J. (2010). Fish Disease: Diagnosis and Treatment. 2nd ed. Wiley-Blackwell. ISBN 978-0813806976." },
];

export function findDiagnoses(category: SymptomEntry[], selectedIds: string[]): { diagnosis: string; weight: number }[] {
  return category
    .filter((e) => selectedIds.includes(e.id))
    .map((e) => ({ diagnosis: e.diagnosis, weight: e.weight }));
}

export function generateResumen(diagnosticos: string[], riesgo: string, lang: string): string {
  if (diagnosticos.length === 0) return "";
  const es = `Reporte de observaciones: Se detectaron los siguientes hallazgos: ${diagnosticos.join(", ")}. ` +
    (riesgo === "rojo"
      ? "El nivel de riesgo es ALTO. Se recomienda intervención veterinaria inmediata y revisión integral del sistema de cultivo."
      : riesgo === "amarillo"
        ? "El nivel de riesgo es MODERADO. Se sugiere monitoreo frecuente y medidas correctivas tempranas."
        : "El nivel de riesgo es BAJO. Continúe con el monitoreo de rutina.");
  const en = `Observation report: The following findings were detected: ${diagnosticos.join(", ")}. ` +
    (riesgo === "rojo"
      ? "Risk level is HIGH. Immediate veterinary intervention and comprehensive system review recommended."
      : riesgo === "amarillo"
        ? "Risk level is MODERATE. Frequent monitoring and early corrective measures suggested."
        : "Risk level is LOW. Continue with routine monitoring.");
  const pt = `Relatório de observações: Foram detectados os seguintes achados: ${diagnosticos.join(", ")}. ` +
    (riesgo === "rojo"
      ? "O nível de risco é ALTO. Intervenção veterinária imediata e revisão completa do sistema recomendadas."
      : riesgo === "amarillo"
        ? "O nível de risco é MODERADO. Monitoramento frequente e medidas corretivas precoces sugeridas."
        : "O nível de risco é BAIXO. Continue com o monitoramento de rotina.");
  if (lang === "en") return en;
  if (lang === "pt") return pt;
  return es;
}
