// Archivo único con todas las referencias técnicas
// Cada sección se muestra en la página de Referencias Técnicas

export interface RefItem {
  titulo: string;
  cuerpo: string;
  fuente: string;
}

// --- Fórmulas de producción ---
export const REF_FORMULAS: RefItem[] = [
  {
    titulo: "Biomasa",
    cuerpo: "Biomasa (kg) = N° animales × Peso promedio (g) ÷ 1000. Indica el peso total de los animales en el sistema.",
    fuente: "Pillay, T.V.R. & Kutty, M.N. (2005). Aquaculture: Principles and Practices. 2nd ed. Blackwell Publishing.",
  },
  {
    titulo: "FCR — Factor de Conversión Alimenticia",
    cuerpo: "FCR = Alimento consumido (kg) ÷ Ganancia de peso (kg). Mide la eficiencia alimenticia. Menor es mejor.",
    fuente: "Tacon, A.G.J. (1987). The Nutrition and Feeding of Farmed Fish and Shrimp. FAO Training Manual.",
  },
  {
    titulo: "SGR — Tasa de Crecimiento Específico",
    cuerpo: "SGR (%/día) = [(ln Pf − ln Pi) ÷ días] × 100. Pf = peso final, Pi = peso inicial.",
    fuente: "Ricker, W.E. (1975). Computation and Interpretation of Biological Statistics of Fish Populations. Fisheries Research Board of Canada Bulletin 191.",
  },
  {
    titulo: "Supervivencia",
    cuerpo: "Supervivencia (%) = (Animales finales ÷ Animales iniciales) × 100.",
    fuente: "Boyd, C.E. & Tucker, C.S. (1998). Pond Aquaculture Water Quality Management. Springer.",
  },
  {
    titulo: "Factor de Condición (K)",
    cuerpo: "K = (Peso (g) ÷ Longitud (cm)³) × 100. Valores cercanos a 1 indican buen estado nutricional.",
    fuente: "Fulton, T.W. (1904). The Rate of Growth of Fishes. Fisheries Board of Scotland Annual Report 22.",
  },
  {
    titulo: "Coeficiente de Variación (CV)",
    cuerpo: "CV (%) = (Desviación estándar ÷ Media) × 100. CV < 20% = lote uniforme; > 35% = heterogeneidad problemática.",
    fuente: "Zar, J.H. (2010). Biostatistical Analysis. 5th ed. Pearson Prentice-Hall.",
  },
  {
    titulo: "Tasa de Alimentación",
    cuerpo: "Ración diaria (kg) = Biomasa (kg) × Tasa (%) ÷ 100. La tasa varía entre 1% y 6% según especie y temperatura.",
    fuente: "Timmons, M.B. & Ebeling, J.M. (2010). Recirculating Aquaculture. 3rd ed. NRAC Publication.",
  },
  {
    titulo: "Densidad de Siembra",
    cuerpo: "Densidad = N° animales ÷ Volumen (m³ o m²). Afecta calidad de agua y crecimiento.",
    fuente: "Boyd, C.E. (2015). Water Quality: An Introduction. Springer. ISBN 978-3319174457.",
  },
  {
    titulo: "Costo por kg Producido",
    cuerpo: "Costo/kg = Costo total alimento ÷ Biomasa cosechada (kg). Principal indicador de rentabilidad.",
    fuente: "Engle, C.R. (2010). Aquaculture Economics and Financing: Management and Analysis. Blackwell Publishing.",
  },
  {
    titulo: "Utilidad",
    cuerpo: "Utilidad = Ingreso bruto − Costo de alimento (no incluye otros costos operativos).",
    fuente: "Engle, C.R. (2010). Aquaculture Economics and Financing. Blackwell Publishing.",
  },
  {
    titulo: "Días al Mercado",
    cuerpo: "Días = (Peso cosecha − Peso inicial) ÷ GPD. GPD = ganancia de peso diaria (g/día).",
    fuente: "El-Sayed, A.F.M. (2006). Tilapia Culture. CABI Publishing.",
  },
];

// --- Parámetros por especie ---
export const REF_SPECIES: RefItem[] = [
  {
    titulo: "Tilapia (Oreochromis niloticus)",
    cuerpo: "Densidad: 20 peces/m³. Supervivencia: 90%. FCR: 1.4. Crecimiento: 3.5 g/día. Peso cosecha: 500 g en ~150 días.",
    fuente: "El-Sayed, A.F.M. (2006). Tilapia Culture. CABI Publishing. ISBN 978-1845931737.",
  },
  {
    titulo: "Trucha Arcoíris (Oncorhynchus mykiss)",
    cuerpo: "Densidad: 30 kg/m³. Supervivencia: 88%. FCR: 1.2. Crecimiento: 2.8 g/día. Peso cosecha: 350 g en ~120 días.",
    fuente: "Sedgwick, S.D. (1995). Trout Farming Handbook. Fishing News Books. ISBN 978-0852382277.",
  },
  {
    titulo: "Camarón Blanco (Litopenaeus vannamei)",
    cuerpo: "Densidad: 80 ind/m². Supervivencia: 70%. FCR: 1.5. Peso cosecha: 12 g en ~100 días.",
    fuente: "FAO (2018). Penaeus vannamei. Cultured Aquatic Species Information Programme. FAO Fisheries Division.",
  },
  {
    titulo: "Guapote Lagunero (Parachromis dovii)",
    cuerpo: "Densidad: 5 peces/m³. Supervivencia: 85%. FCR: 1.8. Peso cosecha: 400 g en ~200 días.",
    fuente: "Günther, J. & Jiménez, R. (2004). Crecimiento del guapote lagunero en cultivo. Revista de Biología Tropical, 52(3).",
  },
  {
    titulo: "Langostino Gigante (Macrobrachium rosenbergii)",
    cuerpo: "Densidad: 8 ind/m². Supervivencia: 65%. FCR: 1.8. Peso cosecha: 40 g en ~180 días.",
    fuente: "New, M.B. & Valenti, W.C. (2000). Freshwater Prawn Culture. Blackwell Science. ISBN 978-0632056026.",
  },
  {
    titulo: "Pangasio (Pangasianodon hypophthalmus)",
    cuerpo: "Densidad: 40 peces/m³. Supervivencia: 92%. FCR: 1.3. Crecimiento: 5 g/día. Peso cosecha: 800 g en ~160 días.",
    fuente: "Phan, L.T. et al. (2009). Current status of farming practices of striped catfish in the Mekong Delta. Aquaculture, 296(3-4), 227-236.",
  },
  {
    titulo: "Carpa Herbívora (Ctenopharyngodon idella)",
    cuerpo: "Densidad: 2 peces/m³. Supervivencia: 88%. FCR: 3.5. Peso cosecha: 1.5 kg en ~200 días.",
    fuente: "Pillay, T.V.R. & Kutty, M.N. (2005). Aquaculture: Principles and Practices. 2nd ed. Blackwell Publishing. ISBN 978-1405105323.",
  },
];

// --- Calidad de agua ---
export const REF_WATER: RefItem[] = [
  {
    titulo: "Oxígeno disuelto",
    cuerpo: "Rango óptimo: 5–20 mg/L. Mínimo recomendado: 2 mg/L. Por debajo de 2 mg/L hay riesgo de hipoxia.",
    fuente: "Boyd, C.E. (2015). Water Quality: An Introduction. Springer. ISBN 978-3319174457.",
  },
  {
    titulo: "Temperatura",
    cuerpo: "Rango general: 5–45 °C según especie. Tropicales: 26–30 °C. Templadas: 12–18 °C. Fuera de rango causa estrés metabólico.",
    fuente: "Boyd, C.E. & Tucker, C.S. (1998). Pond Aquaculture Water Quality Management. Springer.",
  },
  {
    titulo: "pH",
    cuerpo: "Rango óptimo: 6.5–8.5. Valores < 5 o > 10 son letales. El pH afecta la toxicidad del amonio.",
    fuente: "Wurts, W.A. & Durborow, R.M. (1992). Interactions of pH, CO₂, Alkalinity and Hardness in Fish Ponds. SRAC Publication No. 464.",
  },
  {
    titulo: "Amonio NH₃",
    cuerpo: "Máximo recomendado: 0.5 mg/L. El amonio no-ionizado (NH₃) es tóxico. Su toxicidad aumenta con pH y temperatura altos.",
    fuente: "Hargreaves, J.A. & Tucker, C.S. (2004). Managing Ammonia in Fish Ponds. SRAC Publication No. 4603.",
  },
  {
    titulo: "Nitrito NO₂",
    cuerpo: "Máximo recomendado: 0.3 mg/L. El nitrito oxida la hemoglobina impidiendo el transporte de oxígeno.",
    fuente: "Timmons, M.B. & Ebeling, J.M. (2010). Recirculating Aquaculture. 3rd ed. NRAC Publication.",
  },
  {
    titulo: "Sistema de puntuación de riesgo (veterinario)",
    cuerpo: "Puntaje 0–2 = riesgo bajo (verde). 3–5 = riesgo moderado (amarillo). ≥6 = riesgo alto (rojo). Metodología de matriz de riesgo cualitativa.",
    fuente: "Ausvet / OIE (2007). Risk Analysis in Aquatic Animal Health. FAO / World Organisation for Animal Health.",
  },
];

// --- Energía ---
export const REF_ENERGY: RefItem[] = [
  {
    titulo: "Costo de bombeo eléctrico",
    cuerpo: "Costo = HP × 0.746 × N° bombas × horas/día × precio kWh × días ciclo. El factor 0.746 convierte HP a kW.",
    fuente: "Timmons, M.B. & Ebeling, J.M. (2010). Recirculating Aquaculture. 3rd ed. Cap. 7. NRAC Publication.",
  },
  {
    titulo: "Costo de aireación eléctrica",
    cuerpo: "Costo = HP × 0.746 × N° aireadores × horas/día × precio kWh × días ciclo.",
    fuente: "Boyd, C.E. (2015). Water Quality: An Introduction. Cap. 9. Springer. ISBN 978-3319174457.",
  },
  {
    titulo: "Costo de bombeo a combustible",
    cuerpo: "Costo = consumo (L/h) × horas/día × precio combustible × días ciclo.",
    fuente: "FAO (1992). Aquaculture Sector Review: Energy Costs in Aquaculture. Fisheries Circular No. 854.",
  },
  {
    titulo: "Costo de aireación a combustible",
    cuerpo: "Costo = consumo (L/h) × horas/día × precio combustible × días ciclo.",
    fuente: "Summerfelt, S.T. & Vinci, B.J. (2004). Energy use in recirculating aquaculture systems. Aquacultural Engineering, 31(3-4), 155-171.",
  },
  {
    titulo: "Costo por recibo real",
    cuerpo: "Costo del ciclo = (gasto del período ÷ días del período) × días del ciclo. Divide el monto del recibo entre los días que cubre para obtener el gasto diario real.",
    fuente: "Engle, C.R. (2010). Aquaculture Economics and Financing. Cap. 5. Blackwell Publishing.",
  },
];

// --- Diagnósticos veterinarios ---
export const REF_DIAGNOSIS: RefItem[] = [
  {
    titulo: "Diagnóstico: Anorexia",
    cuerpo: "Los peces no están comiendo. Puede indicar estrés, enfermedad o mala calidad de agua.",
    fuente: "Noga, E.J. (2010). Fish Disease: Diagnosis and Treatment. 2nd ed. Wiley-Blackwell. ISBN 978-0813806976.",
  },
  {
    titulo: "Diagnóstico: Hipoxia",
    cuerpo: "Peces nadan en superficie o boquean. Causado por bajo oxígeno disuelto (<2 mg/L).",
    fuente: "Boyd, C.E. & Tucker, C.S. (1998). Pond Aquaculture Water Quality Management. Springer.",
  },
  {
    titulo: "Diagnóstico: Parasitosis (Ich)",
    cuerpo: "Manchas blancas en piel y aletas. Causado por Ichthyophthirius multifiliis. Altamente contagioso.",
    fuente: "Noga, E.J. (2010). Fish Disease: Diagnosis and Treatment. 2nd ed. Wiley-Blackwell.",
  },
  {
    titulo: "Diagnóstico: Necrosis en aletas",
    cuerpo: "Tejido muerto en bordes de aletas. Asociado a infecciones bacterianas (Flavobacterium spp.) o mala calidad de agua.",
    fuente: "Roberts, R.J. (2012). Fish Pathology. 4th ed. Wiley-Blackwell. ISBN 978-1444332821.",
  },
  {
    titulo: "Diagnóstico: Exoftalmia / Caquexia",
    cuerpo: "Ojos saltones (exoftalmia) u ojos hundidos (caquexia). Indican infección sistémica o desnutrición severa.",
    fuente: "Stoskopf, M.K. (1993). Fish Medicine. W.B. Saunders. ISBN 978-0721645201.",
  },
  {
    titulo: "Diagnóstico: Septicemia hemorrágica",
    cuerpo: "Hemorragias internas y externas. Causada por bacterias del género Aeromonas o Pseudomonas.",
    fuente: "Roberts, R.J. (2012). Fish Pathology. 4th ed. Wiley-Blackwell.",
  },
  {
    titulo: "Diagnóstico: Ascitis / Hidropesía",
    cuerpo: "Hinchazón abdominal por acumulación de líquido. Asociado a infecciones bacterianas o fallo renal.",
    fuente: "Noga, E.J. (2010). Fish Disease: Diagnosis and Treatment. 2nd ed. Wiley-Blackwell.",
  },
  {
    titulo: "Diagnóstico: Bloom de algas tóxico",
    cuerpo: "Color verdoso intenso del agua. Puede producir toxinas y causar mortandad por anoxia nocturna.",
    fuente: "Boyd, C.E. (2015). Water Quality: An Introduction. Springer.",
  },
  {
    titulo: "Diagnóstico: Estrés social",
    cuerpo: "Competencia agresiva por comida o espacio. Relacionado con alta densidad de siembra y jerarquía social.",
    fuente: "Wedemeyer, G.A. (1996). Physiology of Fish in Intensive Culture Systems. Chapman & Hall.",
  },
];

// --- Layout de secciones ---
export interface RefSection {
  id: string;
  emoji: string;
  title: string;
  items: RefItem[];
}

export const REF_SECTIONS: RefSection[] = [
  { id: "formulas", emoji: "📐", title: "Fórmulas de Producción", items: REF_FORMULAS },
  { id: "species", emoji: "🐟", title: "Parámetros por Especie", items: REF_SPECIES },
  { id: "water", emoji: "💧", title: "Calidad de Agua", items: REF_WATER },
  { id: "energy", emoji: "⚡", title: "Energía", items: REF_ENERGY },
  { id: "diagnosis", emoji: "🔍", title: "Diagnósticos Veterinarios", items: REF_DIAGNOSIS },
];