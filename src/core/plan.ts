export type Plan = "free" | "pro" | "enterprise";
export type Rol = "productor" | "tecnico" | "admin";

export const PLAN_LIMITS: Record<Plan, { maxFincas: number; maxEstanques: number; canExport: boolean; roles: Rol[] }> = {
  free: { maxFincas: 1, maxEstanques: 3, canExport: false, roles: ["productor"] },
  pro: { maxFincas: Infinity, maxEstanques: Infinity, canExport: true, roles: ["productor", "tecnico"] },
  enterprise: { maxFincas: Infinity, maxEstanques: Infinity, canExport: true, roles: ["admin", "productor", "tecnico"] },
};

export const PLANES: { id: Plan; label: string; precio: string }[] = [
  { id: "free", label: "Free", precio: "$0" },
  { id: "pro", label: "Pro", precio: "$10/mes" },
  { id: "enterprise", label: "Enterprise", precio: "a cotizar" },
];

export function canExport(plan: Plan): boolean {
  return PLAN_LIMITS[plan].canExport;
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
