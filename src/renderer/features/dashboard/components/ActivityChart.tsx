import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  buildWeeklyActivity,
  type ActivityBucket
} from '../lib/activityBuckets'

const WEEKS = 8

interface Props {
  /** ISO timestamps de cuándo terminó cada sesión finalizada. */
  endedAts: string[]
}

export function ActivityChart({ endedAts }: Props) {
  const buckets = useMemo<ActivityBucket[]>(
    () => buildWeeklyActivity(endedAts, WEEKS),
    [endedAts]
  )

  const maxCount = Math.max(1, ...buckets.map((b) => b.count))
  const total = buckets.reduce((acc, b) => acc + b.count, 0)
  const avg = total / WEEKS

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actividad reciente</CardTitle>
        <CardDescription>
          {total === 0
            ? `Sin sesiones en las últimas ${WEEKS} semanas.`
            : `${total} sesión${total === 1 ? '' : 'es'} en ${WEEKS} semanas · ${avg.toFixed(1)} por semana en promedio`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5 h-32 px-1">
          {buckets.map((b, i) => {
            const heightPct = b.count === 0 ? 0 : (b.count / maxCount) * 100
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5 group"
                title={`${b.label}: ${b.count} sesión${b.count === 1 ? '' : 'es'}`}
              >
                <div className="flex-1 w-full flex items-end">
                  {/* Track del bucket vacío */}
                  <div className="w-full h-full rounded-sm bg-muted/40 relative overflow-hidden">
                    {b.count > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary/80 group-hover:bg-primary transition-colors rounded-sm"
                        style={{ height: `${heightPct}%` }}
                      />
                    )}
                    {b.count > 0 && (
                      <div className="absolute top-1 left-0 right-0 text-[10px] text-center font-medium text-primary-foreground mix-blend-difference">
                        {b.count}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {b.label}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
