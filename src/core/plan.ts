export type Plan = "free" | "pro" | "enterprise";
export type Rol = "gestor" | "tecnico" | "admin";

export const PLAN_LIMITS: Record<Plan, { maxFincas: number; maxEstanques: number; canExport: boolean; canUseGeo: boolean; roles: Rol[] }> = {
  free: { maxFincas: 1, maxEstanques: 3, canExport: false, canUseGeo: false, roles: ["gestor"] },
  pro: { maxFincas: Infinity, maxEstanques: Infinity, canExport: true, canUseGeo: true, roles: ["gestor", "tecnico"] },
  enterprise: { maxFincas: Infinity, maxEstanques: Infinity, canExport: true, canUseGeo: true, roles: ["admin", "gestor", "tecnico"] },
};

export const PLANES: { id: Plan; label: string; precio: string; desc: string; features: string[] }[] = [
  { id: "free", label: "Free", precio: "$0", desc: "Para empezar", features: ["1 finca", "3 estanques", "Cálculos básicos", "Bitácora manual"] },
  { id: "pro", label: "Pro", precio: "$29/mes", desc: "Para productores activos", features: ["Fincas ilimitadas", "Estanques ilimitados", "Exportación PDF y Excel", "Microbiología y veterinaria", "Finanzas por ciclo", "Soporte prioritario"] },
  { id: "enterprise", label: "Enterprise", precio: "$99/mes", desc: "Para operaciones grandes", features: ["Todo lo de Pro", "Multi-usuario por finca", "Reportes avanzados", "API dedicada", "Soporte 24/7", "Onboarding personalizado"] },
];

export function canExport(plan: Plan): boolean {
  return PLAN_LIMITS[plan].canExport;
}

export function canUseGeo(plan: Plan): boolean {
  return PLAN_LIMITS[plan].canUseGeo;
}

export function limiteFincas(plan: Plan): number {
  return PLAN_LIMITS[plan].maxFincas;
}

export function limiteEstanques(plan: Plan): number {
  return PLAN_LIMITS[plan].maxEstanques;
}

export function excedeLimiteFincas(plan: Plan, actual: number): boolean {
  return actual >= limiteFincas(plan);
}

export function excedeLimiteEstanques(plan: Plan, actual: number): boolean {
  return actual >= limiteEstanques(plan);
}

export function rolValido(plan: Plan, rol: Rol): boolean {
  return PLAN_LIMITS[plan].roles.includes(rol);
}
