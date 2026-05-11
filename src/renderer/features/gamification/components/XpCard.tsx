import { ChevronRight, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGamificationState } from '../hooks/useGamification'

interface Props {
  /**
   * Si está activo, la card linkea a /progress (donde está el detalle).
   * En la propia /progress no queremos el link porque sería self-referencial.
   */
  linkToDetail?: boolean
}

function formatXp(n: number): string {
  return n.toLocaleString('es-UY')
}

export function XpCard({ linkToDetail = false }: Props = {}) {
  const { data, isLoading } = useGamificationState()

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="pt-5 pb-5">
          <p className="text-sm text-muted-foreground">Cargando progreso…</p>
        </CardContent>
      </Card>
    )
  }

  const {
    level,
    totalXp,
    currentLevelXp,
    xpForCurrentLevel,
    xpToNextLevel,
    progressPercent
  } = data

  const body = (
    <CardContent className="pt-5 pb-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-md bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Nivel
              </p>
              <Badge variant="secondary" className="tabular-nums">
                {level}
              </Badge>
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              {formatXp(totalXp)}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                XP totales
              </span>
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 flex items-center gap-1">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Próximo nivel
            </p>
            <p className="text-sm font-medium tabular-nums">
              {formatXp(xpToNextLevel)} XP
            </p>
          </div>
          {linkToDetail && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      <div>
        <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground tabular-nums">
          <span>
            {formatXp(currentLevelXp)} / {formatXp(xpForCurrentLevel)}
          </span>
          <span>{progressPercent}%</span>
        </div>
      </div>
    </CardContent>
  )

  if (linkToDetail) {
    return (
      <Link to="/progress" className="block">
        <Card className="hover:border-foreground/30 transition-colors cursor-pointer">
          {body}
        </Card>
      </Link>
    )
  }

  return <Card>{body}</Card>
}
