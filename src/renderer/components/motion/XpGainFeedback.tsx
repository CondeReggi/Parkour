import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface XpGainFeedbackProps {
  /** Si null/undefined, no se muestra nada. */
  amount: number | null | undefined
  /** Texto opcional debajo del +XP (ej: "Misión completa"). */
  label?: string
  className?: string
}

/**
 * Componente "celebración" para mostrar +N XP cuando se reclama una
 * misión o se desbloquea un logro. Aparece, levita medio segundo y se
 * va. No depende de ningún sistema de toasts: el padre controla cuándo
 * mostrarlo seteando `amount` y limpiándolo después.
 *
 * Ejemplo:
 *   const [gained, setGained] = useState<number | null>(null)
 *   ...
 *   onClick={async () => {
 *     const result = await claim()
 *     setGained(result.xp)
 *     setTimeout(() => setGained(null), 1600)
 *   }}
 *   ...
 *   <XpGainFeedback amount={gained} label="Misión reclamada" />
 */
export function XpGainFeedback({
  amount,
  label,
  className
}: XpGainFeedbackProps) {
  return (
    <AnimatePresence>
      {amount != null && amount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'pointer-events-none inline-flex items-center gap-2 rounded-full bg-primary/15 text-primary px-3 py-1.5 backdrop-blur-md border border-primary/30',
            className
          )}
          role="status"
          aria-live="polite"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-sm font-semibold tabular-nums">+{amount} XP</span>
          {label && (
            <span className="text-xs text-primary/80">· {label}</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
