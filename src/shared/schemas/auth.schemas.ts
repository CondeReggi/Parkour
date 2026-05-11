import { z } from 'zod'

/**
 * Schemas de input para los handlers de auth. Todos se validan en el
 * proceso main antes de tocar repos.
 *
 * El email se normaliza a lowercase y trim — así no terminamos con
 * "Pedro@x.com" y "pedro@x.com" como cuentas distintas.
 */

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email requerido')
  .max(200)
  .email('Email inválido')
  .transform((v) => v.toLowerCase())

/**
 * Mínimo 8 caracteres. No exigimos clases (mayúscula/símbolo/dígito) en
 * el MVP, pero la longitud da una base razonable. Si más adelante hay
 * sync en la nube, conviene endurecer.
 */
const passwordSchema = z
  .string()
  .min(8, 'La contraseña tiene que tener al menos 8 caracteres')
  .max(200)

export const registerInputSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, 'Nombre requerido')
      .max(60, 'Máximo 60 caracteres'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirmá la contraseña')
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  })

export type RegisterInput = z.infer<typeof registerInputSchema>

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida').max(200)
})
export type LoginInput = z.infer<typeof loginInputSchema>
