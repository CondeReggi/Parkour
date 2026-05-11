import { Link } from 'react-router-dom'
import { LineChart, PlayCircle } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MotionPage } from '@/components/motion/MotionPage'
import { MotionList, MotionListItem } from '@/components/motion/MotionList'
import { useActiveProfile } from '@/features/profile/hooks/useActiveProfile'
import { useSessionsList } from '@/features/sessions/hooks/useSessions'
import { SessionCard } from '@/features/sessions/components/SessionCard'
import { XpCard } from '@/features/gamification/components/XpCard'
import { XpBreakdownCard } from '@/features/gamification/components/XpBreakdownCard'
import { useProgressInsights } from './hooks/useProgressInsights'
import {
  OverallStatsCard,
  OverallStatsCardSkeleton
} from './components/OverallStatsCard'
import { WeeklySummaryCard } from './components/WeeklySummaryCard'
import { InsightsList } from './components/InsightsList'
import { CategoryBreakdownCard } from './components/CategoryBreakdownCard'
import { CloseToMasterCard } from './components/CloseToMasterCard'

export function ProgressPage() {
  const { data: profile, isLoading: profileLoading } = useActiveProfile()
  const { data: insights, isLoading: insightsLoading } = useProgressInsights()
  const { data: sessions, isLoading: sessionsLoading } = useSessionsList()

  if (profileLoading) {
    return (
      <div className="px-8 py-6">
        <PageHeader title="Progreso" />
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="px-8 py-6 max-w-2xl">
        <PageHeader title="Progreso" />
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Necesitás un perfil para ver tu progreso.</span>
            <Button asChild size="sm">
              <Link to="/profile">Crear perfil</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <MotionPage className="px-8 py-6 max-w-5xl space-y-6">
      <PageHeader
        title="Progreso"
        description="Cómo venís mejorando — resumen semanal, comparación, foco y movimientos cerca de dominar."
      />

      {/* Hero overall */}
      {insightsLoading && !insights && <OverallStatsCardSkeleton />}
      {insights && <OverallStatsCard overall={insights.overall} />}

      {/* Estado vacío específico cuando no hay datos todavía */}
      {insights && !insights.hasAnyData && (
        <Card>
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <div className="mx-auto h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center">
              <LineChart className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Tu progreso arranca con la primera sesión</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Cuando termines tu primer entrenamiento vas a empezar a ver
                resumen semanal, comparación con la semana anterior y las
                lecturas interpretativas que te ayudan a ajustar.
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/training">
                <PlayCircle className="h-4 w-4" />
                Entrenar hoy
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resumen + insights + cards de foco */}
      {insights && insights.hasAnyData && (
        <>
          <WeeklySummaryCard
            thisWeek={insights.thisWeek}
            comparison={insights.comparison}
          />

          {insights.insights.length > 0 && (
            <InsightsList insights={insights.insights} />
          )}

          {!insights.comparison && (
            <Alert>
              <AlertDescription>
                Todavía no hay datos de la semana pasada para comparar. La
                próxima semana ya vas a ver cómo venís evolucionando.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <CategoryBreakdownCard entries={insights.categoryBreakdown} />
            <CloseToMasterCard movements={insights.closeToMaster} />
          </div>
        </>
      )}

      {/* XP detalle (mantenemos las cards existentes) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Experiencia
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <XpCard />
          <XpBreakdownCard />
        </div>
      </section>

      {/* Historial de sesiones (preexistente) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Historial de entrenamientos
        </h2>

        {sessionsLoading && (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        )}

        {!sessionsLoading && (!sessions || sessions.length === 0) && (
          <Card className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Todavía no registraste ningún entrenamiento.
            </p>
            <Button asChild size="sm">
              <Link to="/training">Ir a Entrenar hoy</Link>
            </Button>
          </Card>
        )}

        {sessions && sessions.length > 0 && (
          <MotionList className="grid gap-3">
            {sessions.map((s) => (
              <MotionListItem key={s.id}>
                <SessionCard session={s} />
              </MotionListItem>
            ))}
          </MotionList>
        )}
      </section>
    </MotionPage>
  )
}
