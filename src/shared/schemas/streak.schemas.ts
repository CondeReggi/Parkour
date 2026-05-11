import { z } from 'zod'

export const activityTypeEnum = z.enum(['active_recovery'])

export const markActiveRecoveryInputSchema = z.object({
  /**
   * Fecha en formato "YYYY-MM-DD" (hora local del cliente). Si no viene,
   * el repo asume hoy. Lo permitimos por si la UI ofrece "marcar ayer"
   * más adelante; hoy el cliente no lo manda.
   */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado YYYY-MM-DD')
    .optional(),
  notes: z.string().max(500).nullable().optional()
})
export type MarkActiveRecoveryInput = z.infer<
  typeof markActiveRecoveryInputSchema
>
