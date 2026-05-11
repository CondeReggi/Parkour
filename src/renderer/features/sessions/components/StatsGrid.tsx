import { Activity, Calendar, Flame, type LucideIcon, Trophy } from 'lucide-react'
import type { SessionStatsDto } from '@shared/types/stats'
import { Card, CardContent } from '@/components/ui/card'

interface StatTileProps {
  icon: LucideIcon
  label: string
  value: number | string
  hint?: string
}

function StatTile({ icon: Icon, label, value, hint }: StatTileProps) {
  return (
    <Card>
      <CardContent className="pt-5 space-y-1.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <p className="text-xs uppercase tracking-wider">{label}</p>
        </div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

interface Props {
  stats: SessionStatsDto
}

export function StatsGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatTile
        icon={Activity}
        label="Sesiones"
        value={stats.totalSessions}
        hint={`${stats.daysTrained} días entrenados`}
      />
      <StatTile
        icon={Flame}
        label="Racha actual"
        value={stats.currentStreak}
        hint={stats.currentStreak === 1 ? 'día' : 'días consecutivos'}
      />
      <StatTile
        icon={Calendar}
        label="Esta semana"
        value={stats.sessionsThisWeek}
        hint={stats.sessionsThisWeek === 1 ? 'sesión' : 'sesiones'}
      />
      <StatTile
        icon={Trophy}
        label="Dominados"
        value={stats.masteredMovements}
        hint={`${stats.practicingMovements} en práctica`}
      />
    </div>
  )
}
