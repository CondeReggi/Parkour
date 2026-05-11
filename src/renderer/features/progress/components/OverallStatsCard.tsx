import { Award, Flame, Star, Trophy } from 'lucide-react'
import type { OverallStatsDto } from '@shared/types/progressInsights'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Hero panel: nivel + XP totales + mejor racha + logros desbloqueados.
 * Pensado para que el usuario tenga una foto de su progreso histórico
 * en un solo vistazo.
 */
export function OverallStatsCard({ overall }: { overall: OverallStatsDto }) {
  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="bg-gradient-to-br from-primary/10 via-secondary/30 to-transparent p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tile
            icon={<Trophy className="h-4 w-4" />}
            label="Nivel"
            value={String(overall.level)}
            hint={`${overall.totalXp.toLocaleString('es-UY')} XP totales`}
          />
          <Tile
            icon={<Flame className="h-4 w-4" />}
            label="Mejor racha"
            value={`${overall.bestStreak} d`}
            hint={`Actual: ${overall.currentStreak} d`}
          />
          <Tile
            icon={<Star className="h-4 w-4" />}
            label="Dominados"
            value={String(overall.masteredMovements)}
            hint={`${overall.practicingMovements} en práctica`}
          />
          <Tile
            icon={<Award className="h-4 w-4" />}
            label="Logros"
            value={`${overall.achievementsUnlocked}/${overall.achievementsTotal}`}
            hint={`${overall.totalSessions} sesiones totales`}
          />
        </div>
      </div>
    </Card>
  )
}

function Tile({
  icon,
  label,
  value,
  hint
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && (
        <p className="text-[11px] text-muted-foreground truncate">{hint}</p>
      )}
    </div>
  )
}

/** Skeleton para mostrar mientras carga el hook. */
export function OverallStatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5 animate-pulse">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-8 w-12 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
