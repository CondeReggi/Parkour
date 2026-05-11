import { z } from 'zod'

export const achievementCategoryEnum = z.enum([
  'sessions',
  'movements',
  'videos',
  'spots',
  'consistency',
  'wellness'
])

/**
 * Los IPC de achievements son getters sin payload, así que no hay schemas
 * de entrada en este momento. Mantengo el archivo para conservar la
 * convención (un schemas.ts por feature) y dejar lugar a futuras
 * mutaciones (ej. resetear logros desde dev tools).
 */
export type AchievementCategorySchema = z.infer<typeof achievementCategoryEnum>
