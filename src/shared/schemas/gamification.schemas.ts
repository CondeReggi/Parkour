import { z } from 'zod'

/**
 * Los IPC públicos de gamification son sólo getters sin payload, así que
 * no hay schemas de entrada por ahora. Dejo el archivo creado para que la
 * convención (un schemas.ts por feature) quede uniforme y haya un lugar
 * obvio donde agregar validación si en el futuro abrimos una mutación
 * (ej. resetear XP de testing, otorgar XP manual desde dev tools, etc.).
 */
export const xpSourceEnum = z.enum([
  'session_finalized',
  'movement_practicing',
  'movement_mastered',
  'video_uploaded',
  'video_reviewed',
  'spot_registered'
])
export type XpSourceSchema = z.infer<typeof xpSourceEnum>
