import { Link } from 'react-router-dom'
import { Play, PlayCircle, Sparkles } from 'lucide-react'
import type { ProfileDto } from '@shared/types/profile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useActiveSession } from '@/features/sessions/hooks/useSessions'
import { useGamificationState } from '@/features/gamification/hooks/useGamification'
import { useStreakState } from '@/features/streak/hooks/useStreak'
import { buildHeroGreeting, buildHeroQuote } from '../lib/heroQuote'

interface Props {
  profile: ProfileDto
}

/**
 * Hero principal del dashboard. Look gamificado pero contenido:
 * gradient sutil en el fondo, badge con el nivel, frase motivadora
 * personalizada y CTA grande para entrenar.
 */
export function DashboardHeroCard({ profile }: Props) {
  const { data: activeSession } = useActiveSession()
  const { data: gamification } = useGamificationState()
  const { data: streak } = useStreakState()

  const greeting = buildHeroGreeting(profile)
  const quote = buildHeroQuote({
    gamification,
    streak,
    hasActiveSession: !!activeSession
  })

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardContent className="pt-7 pb-7 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Bienvenido de vuelta
            </p>
            <h1 className="text-3xl font-bold tracking-tight leading-tight">
              {greeting}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-snug flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/70" />
              <span>{quote}</span>
            </p>
          </div>

          {gamification && (
            <div className="flex-shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Nivel
              </p>
              <p className="text-4xl font-bold tabular-nums leading-none">
                {gamification.level}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeSession ? (
            <Button asChild>
              <Link to="/training">
                <Play className="h-4 w-4" />
                Continuar sesión
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/training">
                <PlayCircle className="h-4 w-4" />
                Entrenar hoy
              </Link>
            </Button>
          )}
          {activeSession && (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              Sesión en curso
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
