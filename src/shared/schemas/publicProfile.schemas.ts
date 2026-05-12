import { z } from 'zod'

/**
 * Reglas de username:
 *  - 3 a 30 caracteres.
 *  - Sólo letras (case-insensitive), números, guion y guion bajo.
 *  - Se normaliza a lowercase + trim antes de validar — el DB lo guarda
 *    siempre en lowercase para que `pepe` y `Pepe` colisionen.
 *  - No puede empezar ni terminar con `-` o `_` — evita usernames raros
 *    tipo `__pepe__` o `-juan-`.
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Mínimo 3 caracteres')
  .max(30, 'Máximo 30 caracteres')
  .transform((v) => v.toLowerCase())
  .refine((v) => /^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(v) || /^[a-z0-9]$/.test(v), {
    message: 'Sólo letras, números, guion y guion bajo. No puede empezar ni terminar con un guion.'
  })

const bioSchema = z
  .string()
  .trim()
  .max(200, 'La bio no puede pasar de 200 caracteres')

/**
 * Una URL relativa o absoluta. No validamos contra `z.url()` porque
 * queremos permitir paths locales en el futuro.
 */
const optionalUrl = z
  .string()
  .trim()
  .max(500, 'URL demasiado larga')

export const updatePublicProfileInputSchema = z.object({
  username: usernameSchema,
  displayName: z
    .string()
    .trim()
    .min(1, 'Nombre visible requerido')
    .max(60, 'Máximo 60 caracteres'),
  avatarUrl: optionalUrl.optional().nullable(),
  bio: bioSchema.optional().nullable(),
  coverImageUrl: optionalUrl.optional().nullable(),
  isPublic: z.boolean(),
  showLevel: z.boolean(),
  showStats: z.boolean(),
  showDominatedMovements: z.boolean(),
  showSharedSpots: z.boolean()
})
export type UpdatePublicProfileInput = z.infer<
  typeof updatePublicProfileInputSchema
>

export const checkUsernameInputSchema = z.object({
  username: z.string()
})
export type CheckUsernameInput = z.infer<typeof checkUsernameInputSchema>

export const setPrivacyInputSchema = z.object({
  isPublic: z.boolean(),
  showLevel: z.boolean(),
  showStats: z.boolean(),
  showDominatedMovements: z.boolean(),
  showSharedSpots: z.boolean()
})
export type SetPrivacyInput = z.infer<typeof setPrivacyInputSchema>

export const getByUsernameInputSchema = z.object({
  username: z.string().trim().toLowerCase()
})
export type GetByUsernameInput = z.infer<typeof getByUsernameInputSchema>
