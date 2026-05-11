import { Flame, HeartPulse, Sparkles, Sun } from 'lucide-react'
import type { DayType } from '@shared/types/streak'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStreakState } from '../hooks/useStreak'
import { useMarkActiveRecovery } from '../hooks/useStreakMutations'

const TODAY_LABEL: Record<DayType, string> = {
  training: 'Entrenaste hoy',
  active_recovery: 'Recuperación activa',
  justified_rest: 'Descanso justificado',
  rest: 'Día de descanso',
  idle: 'Sin actividad hoy'
}

const TODAY_ICON: Record<DayType, typeof Flame> = {
  training: Flame,
  active_recovery: HeartPulse,
  justified_rest: Sun,
  rest: Sun,
  idle: Sparkles
}

export function StreakCard() {
  const { data, isLoading } = useStreakState()
  const markMut = useMarkActiveRecovery()

  if (isLoading || !data) {
    return (
      <Card className="h-full animate-pulse">
        <CardContent className="pt-5 pb-5 space-y-3">
          <div className="h-4 w-1/3 rounded bg-muted/70" />
          <div className="h-3 w-full rounded bg-muted/50" />
          <div className="h-3 w-2/3 rounded bg-muted/50" />
        </CardContent>
      </Card>
    )
  }

  const { currentStreak, bestStreak, today, recommendation } = data
  const TodayIcon = TODAY_ICON[today.type]
  const isTodayActive =
    today.type === 'training' || today.type === 'active_recovery'

  return (
    <Card className="h-full">
      <CardContent className="pt-5 pb-5 space-y-4 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-md bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Racha
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tabular-nums leading-none">
                  {currentStreak}
                </p>
                <span className="text-sm text-muted-foreground">
                  {currentStreak === 1 ? 'día' : 'días'}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="tabular-nums text-[10px] flex-shrink-0">
            Mejor: {bestStreak}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <TodayIcon
            className={
              'h-3.5 w-3.5 flex-shrink-0 ' +
              (isTodayActive ? 'text-primary' : 'text-muted-foreground')
            }
          />
          <span
            className={isTodayActive ? 'font-medium' : 'text-muted-foreground'}
          >
            {TODAY_LABEL[today.type]}
          </span>
          {today.type === 'justified_rest' && today.justifiedReason && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              · dolor {today.justifiedReason.painAfter ?? '—'} · fatiga{' '}
              {today.justifiedReason.fatigueAfter ?? '—'}
            </span>
          )}
        </div>

        <Alert className="py-2.5 mt-auto">
          <AlertDescription className="text-xs leading-snug">
            {recommendation.text}
          </AlertDescription>
        </Alert>

        {recommendation.suggestActiveRecovery &&
          today.type !== 'active_recovery' && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => markMut.mutate({})}
              disabled={markMut.isPending}
            >
              <HeartPulse className="h-4 w-4" />
              {markMut.isPending ? 'Marcando…' : 'Marcar recuperación activa'}
            </Button>
          )}

        {markMut.error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">
              {markMut.error.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
