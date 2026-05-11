import { Lock } from 'lucide-react'
import type { AchievementDto } from '@shared/types/achievement'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON, CATEGORY_LABEL } from './achievementEnums'

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

interface Props {
  achievement: AchievementDto
}

export function AchievementCard({ achievement: a }: Props) {
  const Icon = CATEGORY_ICON[a.category]
  const date = formatDate(a.unlockedAt)

  return (
    <Card
      className={cn(
        'p-4 flex items-start gap-3 transition-colors',
        !a.unlocked && 'opacity-60'
      )}
    >
      <div
        className={cn(
          'h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0',
          a.unlocked
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {a.unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight">{a.title}</p>
          {a.xpReward > 0 && (
            <Badge
              variant={a.unlocked ? 'default' : 'outline'}
              className="text-[10px] tabular-nums flex-shrink-0"
            >
              +{a.xpReward} XP
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {a.description}
        </p>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{CATEGORY_LABEL[a.category]}</span>
          {a.unlocked && date && (
            <>
              <span aria-hidden="true">·</span>
              <span>Desbloqueado {date}</span>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
