/**
 * Stats agregadas del perfil activo. El renderer consume esto vía useSessionStats.
 * Sin perfil activo, todos los campos = 0.
 */

export interface SessionStatsDto {
  totalSessions: number       // Sesiones finalizadas (no canceladas)
  daysTrained: number          // Días únicos con al menos una sesión
  currentStreak: number        // Días consecutivos entrenados (tolerancia 1 día)
  sessionsThisWeek: number     // Sesiones en los últimos 7 días
  masteredMovements: number    // MovementProgress.status='mastered'
  practicingMovements: number  // MovementProgress.status='practicing'
}
