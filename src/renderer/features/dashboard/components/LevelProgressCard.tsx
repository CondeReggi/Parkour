import { Link } from 'react-router-dom'
import { ChevronRight, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGamificationState } from '@/features/gamification/hooks/useGamification'
import { progressTransition } from '@/lib/motion'
import { DashboardCardSkeleton } from './DashboardCardSkeleton'

function fmt(n: number): string {
  return n.toLocaleString('es-UY')
}

/**
 * Card de nivel + XP. Linkea a /progress para ver detalle.
 * Diseñada para grilla 3-col en el dashboard, altura uniforme con
 * sus vecinas (Streak, DailyMission).
 */
export function LevelProgressCard() {
  const { data, isLoading } = useGamificationState()

  if (isLoading || !data) return <DashboardCardSkeleton lines={3} />

  const {
    level,
    totalXp,
    currentLevelXp,
    xpForCurrentLevel,
    xpToNextLevel,
    progressPercent
  } = data

  return (
    <Link to="/progress" className="block group h-full">
      <Card className="h-full hover:border-primary/40 transition-colors cursor-pointer">
        <CardContent className="pt-5 pb-5 space-y-4 h-full flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-md bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Nivel
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold tabular-nums leading-none">
                    {level}
                  </p>
                  <Badge variant="outline" className="text-[10px] tabular-nums">
                    {fmt(totalXp)} XP
                  </Badge>
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground/70 transition-colors flex-shrink-0" />
          </div>

          <div className="space-y-1.5 mt-auto">
            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={progressTransition}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>
                {fmt(currentLevelXp)} / {fmt(xpForCurrentLevel)} XP
              </span>
              <span>{progressPercent}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Faltan{' '}
              <span className="font-medium text-foreground tabular-nums">
                {fmt(xpToNextLevel)} XP
              </span>{' '}
              para el nivel {level + 1}.
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
