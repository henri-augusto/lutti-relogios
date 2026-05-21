/**
 * Modo de manutenção ativado via MAINTENANCE_MODE no .env.
 * Valores aceitos: true, 1, yes (case-insensitive).
 */
export function isMaintenanceModeEnabled() {
  const value = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}
