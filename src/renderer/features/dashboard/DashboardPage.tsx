import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useActiveProfile } from '@/features/profile/hooks/useActiveProfile'
import { StreakCard } from '@/features/streak/components/StreakCard'
import { RecentAchievementsCard } from '@/features/achievements/components/RecentAchievementsCard'
import { DashboardHeroCard } from './components/DashboardHeroCard'
import { LevelProgressCard } from './components/LevelProgressCard'
import { DailyMissionCard } from './components/DailyMissionCard'
import { WeeklyProgressCard } from './components/WeeklyProgressCard'
import { PendingVideosCard } from './components/PendingVideosCard'
import { QuickActionsCard } from './components/QuickActionsCard'
import { RecommendedNextMovesCard } from './components/RecommendedNextMovesCard'

/**
 * Pantalla principal del juego de progreso personal.
 *
 * Layout (top → bottom):
 *   1. Hero full-width: saludo + frase + CTA + badge de nivel.
 *   2. Grilla 3-col: LevelProgressCard | StreakCard | DailyMissionCard.
 *   3. Grilla 2-col: WeeklyProgressCard + RecentAchievementsCard.
 *   4. Grilla 2-col: RecommendedNextMovesCard + PendingVideosCard.
 *   5. QuickActionsCard full-width.
 *
 * Loading: cada card tiene su propio skeleton. No mostramos un spinner
 * global salvo que falte el perfil mismo.
 */
export function DashboardPage() {
  const { data: profile, isLoading: profileLoading } = useActiveProfile()

  if (profileLoading) {
    return (
      <div className="px-8 py-6 max-w-6xl">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="px-8 py-6 max-w-2xl space-y-4">
        <PageHeader
          title="Bienvenido"
          description="Empezá creando tu perfil para personalizar tu entrenamiento."
        />
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Necesitás un perfil activo para usar la app.</span>
            <Button asChild size="sm">
              <Link to="/profile">Crear perfil</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="px-8 py-6 max-w-6xl space-y-5">
      <DashboardHeroCard profile={profile} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        <LevelProgressCard />
        <StreakCard />
        <DailyMissionCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <WeeklyProgressCard />
        <RecentAchievementsCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <RecommendedNextMovesCard />
        <PendingVideosCard />
      </div>

      <QuickActionsCard />
    </div>
  )
}
