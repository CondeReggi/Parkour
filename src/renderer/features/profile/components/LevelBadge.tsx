import type { UserLevel } from '@shared/types/profile'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const LEVEL_LABEL: Record<UserLevel, string> = {
  beginner: 'Principiante',
  base: 'Base',
  intermediate: 'Intermedio'
}

const LEVEL_DOT: Record<UserLevel, string> = {
  beginner: 'bg-zinc-400',
  base: 'bg-blue-400',
  intermediate: 'bg-emerald-400'
}

export function LevelBadge({ level }: { level: UserLevel }) {
  return (
    <Badge variant="outline" className="gap-2 px-3 py-1">
      <span className={cn('h-2 w-2 rounded-full', LEVEL_DOT[level])} />
      <span>{LEVEL_LABEL[level]}</span>
    </Badge>
  )
}
