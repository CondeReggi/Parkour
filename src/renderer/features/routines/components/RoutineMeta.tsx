import type { MainGoal } from '@shared/types/profile'
import type { RoutineLevel } from '@shared/types/routine'
import { Badge } from '@/components/ui/badge'

export const GOAL_LABEL: Record<MainGoal, string> = {
  technique: 'Técnica',
  mobility: 'Movilidad',
  strength: 'Fuerza',
  general: 'General'
}

export const LEVEL_LABEL: Record<RoutineLevel, string> = {
  beginner: 'Principiante',
  base: 'Base',
  intermediate: 'Intermedio',
  any: 'Cualquier nivel'
}

export function GoalBadge({ goal }: { goal: MainGoal }) {
  return <Badge variant="outline">{GOAL_LABEL[goal]}</Badge>
}

export function LevelBadge({ level }: { level: RoutineLevel }) {
  return <Badge variant="outline">Nivel: {LEVEL_LABEL[level]}</Badge>
}

export function DurationBadge({ minutes }: { minutes: number }) {
  return <Badge variant="secondary" className="font-mono">{minutes} min</Badge>
}
