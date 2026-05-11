import {
  Activity,
  Award,
  CheckCircle2,
  Eye,
  MapPin,
  Sparkles,
  Trophy,
  Video,
  type LucideIcon
} from 'lucide-react'
import type { XpSource } from '@shared/types/gamification'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useXpBreakdown } from '../hooks/useGamification'

const SOURCE_LABEL: Record<XpSource, string> = {
  session_finalized: 'Finalizar una sesión',
  movement_practicing: 'Empezar a practicar un movimiento',
  movement_mastered: 'Dominar un movimiento',
  video_uploaded: 'Subir un video',
  video_reviewed: 'Revisar un video',
  spot_registered: 'Registrar un spot',
  quest_claimed: 'Reclamar una misión',
  achievement_unlocked: 'Desbloquear un logro'
}

const SOURCE_ICON: Record<XpSource, LucideIcon> = {
  session_finalized: Activity,
  movement_practicing: Trophy,
  movement_mastered: CheckCircle2,
  video_uploaded: Video,
  video_reviewed: Eye,
  spot_registered: MapPin,
  quest_claimed: Sparkles,
  achievement_unlocked: Award
}

/** Fuentes cuya recompensa por evento es variable (no XP_REWARDS fija). */
const VARIABLE_REWARD_SOURCES: ReadonlySet<XpSource> = new Set([
  'quest_claimed',
  'achievement_unlocked'
])

function formatXp(n: number): string {
  return n.toLocaleString('es-UY')
}

export function XpBreakdownCard() {
  const { data, isLoading } = useXpBreakdown()

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="pt-5 pb-5">
          <p className="text-sm text-muted-foreground">Cargando detalle…</p>
        </CardContent>
      </Card>
    )
  }

  const { totalXp, entries } = data

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cómo ganás XP</CardTitle>
        <CardDescription>
          Tarifa por acción y cuánto llevás acumulado en cada fuente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {entries.map((e) => {
            const Icon = SOURCE_ICON[e.source]
            const sharePct =
              totalXp === 0 ? 0 : Math.round((e.xp / totalXp) * 100)
            const isEmpty = e.count === 0
            return (
              <li key={e.source} className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Icon
                      className={
                        'h-4 w-4 mt-0.5 flex-shrink-0 ' +
                        (isEmpty
                          ? 'text-muted-foreground/50'
                          : 'text-muted-foreground')
                      }
                    />
                    <div className="min-w-0">
                      <p
                        className={
                          'text-sm ' +
                          (isEmpty ? 'text-muted-foreground' : 'font-medium')
                        }
                      >
                        {SOURCE_LABEL[e.source]}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {VARIABLE_REWARD_SOURCES.has(e.source)
                          ? 'Recompensa variable'
                          : `+${e.rewardPerEvent} XP por evento`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium tabular-nums">
                      {formatXp(e.xp)}{' '}
                      <span className="text-[11px] font-normal text-muted-foreground">
                        XP
                      </span>
                    </p>
                    <Badge variant="outline" className="text-[10px] tabular-nums">
                      {e.count}{' '}
                      {e.count === 1 ? 'evento' : 'eventos'}
                    </Badge>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-primary/80 transition-all"
                    style={{ width: `${sharePct}%` }}
                    title={`${sharePct}% del XP total`}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        {totalXp === 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            Todavía no acumulaste XP. Probá completar una sesión o marcar un
            movimiento.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
