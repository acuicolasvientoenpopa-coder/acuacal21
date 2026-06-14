export interface NavLinkDef {
  to: string;
  key: string;
  emoji: string;
  tutorialDesc: string; // i18n key for tutorial description
}

export const NAV_LINKS: NavLinkDef[] = [
  { to: "/", key: "calc", emoji: "🧮", tutorialDesc: "tutorialCalcDesc" },
  { to: "/bitacora", key: "bitacora", emoji: "📋", tutorialDesc: "tutorialBitacoraDesc" },
  { to: "/zootecnico", key: "zootecnico", emoji: "🔬", tutorialDesc: "tutorialZootecnicoDesc" },
  { to: "/parametros", key: "params", emoji: "⚙️", tutorialDesc: "tutorialParamsDesc" },
  { to: "/especies", key: "especies", emoji: "🐠", tutorialDesc: "tutorialEspeciesDesc" },
  { to: "/formulas", key: "formulas", emoji: "📐", tutorialDesc: "tutorialFormulasDesc" },
  { to: "/fincas", key: "fincas", emoji: "🏠", tutorialDesc: "tutorialFincasDesc" },
  { to: "/micro", key: "micro", emoji: "🧫", tutorialDesc: "tutorialMicroDesc" },
  { to: "/finanzas", key: "finanzas", emoji: "💰", tutorialDesc: "tutorialFinanzasDesc" },
  { to: "/vet", key: "vet", emoji: "🏥", tutorialDesc: "tutorialVetDesc" },
  { to: "/inventario", key: "inventario", emoji: "📦", tutorialDesc: "tutorialInventarioDesc" },
  { to: "/lotes", key: "lotesTitle", emoji: "🌱", tutorialDesc: "tutorialLotesDesc" },
  { to: "/medir-estanque", key: "medirEstanque", emoji: "📏", tutorialDesc: "tutorialMedirEstanqueDesc" },
  { to: "/planes", key: "plan", emoji: "💳", tutorialDesc: "tutorialPlanDesc" },
];