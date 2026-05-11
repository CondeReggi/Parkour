import {
  CheckCircle2,
  Circle,
  Flame,
  Lock,
  type LucideIcon
} from 'lucide-react'
import type { LearningStatus } from '../lib/learningPathStatus'
import type { MovementCategory } from '@shared/types/movement'

export const STATUS_LABEL: Record<LearningStatus, string> = {
  locked: 'Bloqueado',
  available: 'Disponible',
  practicing: 'En práctica',
  mastered: 'Dominado'
}

export const STATUS_ICON: Record<LearningStatus, LucideIcon> = {
  locked: Lock,
  available: Circle,
  practicing: Flame,
  mastered: CheckCircle2
}

/**
 * Clases tailwind para el contenedor del nodo según estado. El criterio:
 *  - mastered: borde y fondo de primary, sólido.
 *  - practicing: borde primary, fondo suave.
 *  - available: borde foreground/30, fondo card, hover más fuerte.
 *  - locked: opacidad reducida, borde dashed, sin hover state pesado.
 */
export const STATUS_NODE_CLASS: Record<LearningStatus, string> = {
  mastered:
    'border-primary bg-primary/15 text-foreground hover:border-primary/80',
  practicing:
    'border-primary/60 bg-primary/5 text-foreground hover:border-primary',
  available:
    'border-foreground/25 bg-card text-foreground hover:border-primary/60 hover:bg-accent/30',
  locked:
    'border-dashed border-border bg-muted/30 text-muted-foreground opacity-70'
}

export const STATUS_DOT_CLASS: Record<LearningStatus, string> = {
  mastered: 'bg-primary',
  practicing: 'bg-primary/60',
  available: 'bg-foreground/40',
  locked: 'bg-muted-foreground/30'
}

export const CATEGORY_LABEL: Record<MovementCategory, string> = {
  landing: 'Aterrizaje',
  vault: 'Vault',
  climb: 'Climb',
  balance: 'Balance',
  precision: 'Precisión',
  wall: 'Wall',
  core: 'Core'
}

export const CATEGORY_ORDER: MovementCategory[] = [
  'landing',
  'precision',
  'balance',
  'vault',
  'wall',
  'climb',
  'core'
]
