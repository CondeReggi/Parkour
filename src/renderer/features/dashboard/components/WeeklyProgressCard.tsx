import { useMemo } from 'react'
import { CalendarDays, Flame, HeartPulse } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSessionsList } from '@/features/sessions/hooks/useSessions'
import { useStreakState } from '@/features/streak/hooks/useStreak'
import { DashboardCardSkeleton } from './DashboardCardSkeleton'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

interface WeekDay {
  label: string
  isToday: boolean
  hasTraining: boolean
  isFuture: boolean
}

function startOfWeek(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  const idx = (c.getDay() + 6) % 7
  c.setDate(c.getDate() - idx)
  return c
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Mini-visualización L→D con dots. Dots llenos para días con training,
 * dot vacío para días aún sin actividad, "anillo" para hoy. La info de
 * recuperación activa la trae el hook de streak (weeklyActiveDays).
 */
export function WeeklyProgressCard() {
  const sessionsQ = useSessionsList()
  const streakQ = useStreakState()

  const days: WeekDay[] = useMemo(() => {
    const now = new Date()
    const monday = startOfWeek(now)
    const result: WeekDay[] = []
    const trainingDays = new Set<string>()
    for (const s of sessionsQ.data ?? []) {
      if (!s.endedAt) continue
      const d = new Date(s.endedAt)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      trainingDays.add(key)
    }
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
      result.push({
        label: DAY_LABELS[i] ?? '',
        isToday: sameDay(day, now),
        hasTraining: trainingDays.has(key),
        isFuture: day.getTime() > now.getTime() && !sameDay(day, now)
      })
    }
    return result
  }, [sessionsQ.data])

  if (sessionsQ.isLoading || streakQ.isLoading) {
    return <DashboardCardSkeleton lines={3} />
  }

  const weeklyActive = streakQ.data?.weeklyActiveDays ?? 0
  const sessionsThisWeek = days.filter((d) => d.hasTraining).length
  const recoveryDays = Math.max(0, weeklyActive - sessionsThisWeek)

  return (
    <Card className="h-full">
      <CardContent className="pt-5 pb-5 space-y-4 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-md bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Esta semana
              </p>
              <p className="text-sm font-medium leading-snug">
                {weeklyActive}{' '}
                <span className="text-muted-foreground font-normal">
                  {weeklyActive === 1 ? 'día activo' : 'días activos'}
                </span>
              </p>
            </div>
          </div>
          <Badge variant="outline" className="tabular-nums flex-shrink-0">
            {weeklyActive} / 7
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-1.5">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={
                  'h-2.5 w-2.5 rounded-full border transition-colors ' +
                  (d.hasTraining
                    ? 'bg-primary border-primary'
                    : d.isToday
                      ? 'bg-transparent border-primary ring-2 ring-primary/30'
                      : d.isFuture
                        ? 'bg-transparent border-muted/60'
                        : 'bg-muted border-muted')
                }
              />
              <span
                className={
                  'text-[10px] tabular-nums ' +
                  (d.isToday
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground')
                }
              >
                {d.label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mt-auto">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Flame className="h-3.5 w-3.5" />
            <span>
              <span className="font-medium text-foreground tabular-nums">
                {sessionsThisWeek}
              </span>{' '}
              {sessionsThisWeek === 1 ? 'sesión' : 'sesiones'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <HeartPulse className="h-3.5 w-3.5" />
            <span>
              <span className="font-medium text-foreground tabular-nums">
                {recoveryDays}
              </span>{' '}
              recup.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
