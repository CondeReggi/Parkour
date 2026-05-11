import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Calendar,
  Dumbbell,
  Heart,
  Sparkles,
  Star,
  Video,
  Zap
} from 'lucide-react'
import type {
  NullableNumericComparison,
  NumericComparison,
  WeekComparisonDto,
  WeeklySummaryDto
} from '@shared/types/progressInsights'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CATEGORY_LABEL } from '../lib/labels'

interface Props {
  thisWeek: WeeklySummaryDto
  comparison: WeekComparisonDto | null
}

/**
 * Resumen semanal: la pieza central de la pantalla. Cada métrica tiene
 * un delta vs la semana anterior cuando hay datos para comparar.
 */
export function WeeklySummaryCard({ thisWeek, comparison }: Props) {
  const range = formatWeekRange(thisWeek.weekStart, thisWeek.weekEnd)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Esta semana
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-normal">
            {range}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Sesiones"
            value={thisWeek.sessionsCount}
            hint={`${thisWeek.trainingDays} día${thisWeek.trainingDays === 1 ? '' : 's'} entrenados`}
            comparison={comparison?.sessions}
            higherIsBetter
          />
          <Metric
            icon={<Zap className="h-3.5 w-3.5" />}
            label="XP ganado"
            value={thisWeek.xpEarned}
            hint="esta semana"
            comparison={comparison?.xpEarned}
            higherIsBetter
          />
          <Metric
            icon={<Dumbbell className="h-3.5 w-3.5" />}
            label="Movs practicados"
            value={thisWeek.movementsPracticed}
            hint={`${thisWeek.movementsMastered} dominados`}
            comparison={comparison?.movementsPracticed}
            higherIsBetter
          />
          <Metric
            icon={<Video className="h-3.5 w-3.5" />}
            label="Videos revisados"
            value={thisWeek.videosReviewed}
            comparison={comparison?.videosReviewed}
            higherIsBetter
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NullableMetric
            icon={<Heart className="h-3.5 w-3.5" />}
            label="Dolor prom"
            value={thisWeek.avgPain}
            comparison={comparison?.avgPain}
            higherIsBetter={false}
          />
          <NullableMetric
            icon={<Heart className="h-3.5 w-3.5" />}
            label="Fatiga prom"
            value={thisWeek.avgFatigue}
            comparison={comparison?.avgFatigue}
            higherIsBetter={false}
          />
          <Metric
            icon={<Star className="h-3.5 w-3.5" />}
            label="Logros"
            value={thisWeek.achievementsUnlocked}
            hint="desbloqueados"
          />
          <Metric
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Minutos totales"
            value={thisWeek.totalDurationMin}
            hint="entrenando"
          />
        </div>

        {thisWeek.topCategory && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Categoría más trabajada
            </p>
            <p className="text-sm font-medium mt-0.5">
              {CATEGORY_LABEL[thisWeek.topCategory.category]}
              <span className="text-muted-foreground font-normal">
                {' · '}
                {thisWeek.topCategory.mentions} menci{thisWeek.topCategory.mentions === 1 ? 'ón' : 'ones'}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatWeekRange(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const fmt = new Intl.DateTimeFormat('es-UY', { day: 'numeric', month: 'short' })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

interface MetricProps {
  icon: React.ReactNode
  label: string
  value: number
  hint?: string
  comparison?: NumericComparison
  higherIsBetter?: boolean
}

function Metric({
  icon,
  label,
  value,
  hint,
  comparison,
  higherIsBetter
}: MetricProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      {comparison ? (
        <DeltaPill
          delta={comparison.delta}
          higherIsBetter={higherIsBetter ?? true}
        />
      ) : (
        hint && <p className="text-[10px] text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

interface NullableMetricProps {
  icon: React.ReactNode
  label: string
  value: number | null
  comparison?: NullableNumericComparison
  higherIsBetter: boolean
}

function NullableMetric({
  icon,
  label,
  value,
  comparison,
  higherIsBetter
}: NullableMetricProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-semibold tabular-nums">
        {value === null ? '—' : value.toFixed(1)}
      </p>
      {comparison && comparison.delta !== null ? (
        <DeltaPill delta={comparison.delta} higherIsBetter={higherIsBetter} />
      ) : (
        <p className="text-[10px] text-muted-foreground">/ 10</p>
      )}
    </div>
  )
}

function DeltaPill({
  delta,
  higherIsBetter
}: {
  delta: number
  higherIsBetter: boolean
}) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <ArrowRight className="h-3 w-3" />
        igual que la semana pasada
      </span>
    )
  }
  const isUp = delta > 0
  const isGood = higherIsBetter ? isUp : !isUp
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] tabular-nums',
        isGood ? 'text-emerald-500' : 'text-amber-500'
      )}
    >
      {isUp ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      {isUp ? '+' : ''}
      {Math.abs(delta) < 10 && !Number.isInteger(delta)
        ? delta.toFixed(1)
        : delta}{' '}
      vs semana pasada
    </span>
  )
}
