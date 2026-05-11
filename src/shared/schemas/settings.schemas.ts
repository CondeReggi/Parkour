import { z } from 'zod'

/**
 * Enum de temas. Los valores se guardan tal cual en AppSettings.theme.
 * 'gotham' es la paleta zinc histórica que conservamos junto a las nuevas
 * 'light' (Urban Light) y 'dark' (Asphalt Dark).
 */
export const themeEnum = z.enum(['dark', 'light', 'gotham'])

export const updateThemeInputSchema = z.object({
  theme: themeEnum
})
export type UpdateThemeInput = z.infer<typeof updateThemeInputSchema>
