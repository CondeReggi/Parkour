import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { MainGoal } from '@shared/types/profile'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useActiveProfile } from '@/features/profile/hooks/useActiveProfile'
import { useRoutines } from '@/features/routines/hooks/useRoutines'
import { useSpots } from '@/features/spots/hooks/useSpots'
import { useMovements } from '@/features/movements/hooks/useMovements'
import {
  useActiveSession,
  useSessionsList
} from '@/features/sessions/hooks/useSessions'
import { useStartSession } from '@/features/sessions/hooks/useSessionMutations'
import { TrafficLightCard } from './components/TrafficLightCard'
import {
  CheckInStep,
  DEFAULT_CHECK_IN,
  type CheckInValues
} from './components/CheckInStep'
import { RecommendationStep } from './components/RecommendationStep'
import { GuidedSessionView } from './components/GuidedSessionView'
import { FeedbackStep } from './components/FeedbackStep'
import { computeTrafficLight } from './lib/safety'
import { pickGuidedRoutine } from './lib/pickGuidedRoutine'

type Phase = 'checkin' | 'recommendation' | 'guided' | 'feedback'

const PHASE_LABEL: Record<Phase, string> = {
  checkin: 'Cómo estás',
  recommendation: 'Recomendación',
  guided: 'En curso',
  feedback: 'Feedback'
}

const PHASE_ORDER: Phase[] = ['checkin', 'recommendation', 'guided', 'feedback']

function StepRail({ phase }: { phase: Phase }) {
  const currentIdx = PHASE_ORDER.indexOf(phase)
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PHASE_ORDER.map((p, i) => {
        const isActive = p === phase
        const isPast = i < currentIdx
        return (
          <div key={p} className="flex items-center gap-2">
            <div
              className={
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors ' +
                (isActive
                  ? 'bg-primary/15 text-primary'
                  : isPast
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/60')
              }
            >
              <span
                className={
                  'inline-block h-1.5 w-1.5 rounded-full ' +
                  (isActive || isPast ? 'bg-primary' : 'bg-muted')
                }
                aria-hidden="true"
              />
              {PHASE_LABEL[p]}
            </div>
            {i < PHASE_ORDER.length - 1 && (
              <span className="text-muted-foreground/40">·</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function TrainingPage() {
  const { data: profile } = useActiveProfile()
  const { data: routines } = useRoutines()
  const { data: spots } = useSpots()
  const { data: allMovements } = useMovements()
  const { data: activeSession, isLoading: sessionLoading } = useActiveSession()
  const { data: pastSessions } = useSessionsList()
  const startMut = useStartSession()

  // Si venimos del flujo "Entrenar acá hoy" del detalle del spot, el
  // ?spotId=<id> pre-selecciona place='spot' + spotId en el check-in.
  const [searchParams, setSearchParams] = useSearchParams()
  const incomingSpotId = searchParams.get('spotId')

  const [phase, setPhase] = useState<Phase>('checkin')
  const [checkIn, setCheckIn] = useState<CheckInValues>(DEFAULT_CHECK_IN)
  const [preselectedMovementIds, setPreselectedMovementIds] = useState<
    string[]
  >([])

  // Aplicamos el spotId entrante una sola vez: lo metemos en el check-in y
  // limpiamos el query param para no re-aplicarlo en navegaciones.
  useEffect(() => {
    if (!incomingSpotId) return
    if (!spots) return
    const exists = spots.some((s) => s.id === incomingSpotId)
    if (!exists) {
      setSearchParams({}, { replace: true })
      return
    }
    setCheckIn((prev) =>
      prev.spotId === incomingSpotId
        ? prev
        : { ...prev, place: 'spot', spotId: incomingSpotId }
    )
    setSearchParams({}, { replace: true })
  }, [incomingSpotId, spots, setSearchParams])

  // Sincroniza el phase con el estado real de la sesión activa:
  //  - Si hay sesión activa y no estamos en 'feedback', saltamos a 'guided'.
  //  - Si la sesión activa desaparece (cancel o finalize), volvemos al
  //    check-in con valores por defecto.
  useEffect(() => {
    if (sessionLoading) return
    if (activeSession && phase !== 'feedback') {
      setPhase('guided')
    } else if (!activeSession && (phase === 'guided' || phase === 'feedback')) {
      setPhase('checkin')
      setCheckIn(DEFAULT_CHECK_IN)
      setPreselectedMovementIds([])
    }
  }, [activeSession, sessionLoading, phase])

  const trafficLight = useMemo(
    () =>
      computeTrafficLight({
        pain: checkIn.pain,
        fatigue: checkIn.fatigue,
        sleepQuality: checkIn.sleepQuality,
        confidence: checkIn.confidence,
        floor: checkIn.floor,
        environment: checkIn.environment
      }),
    [checkIn]
  )

  const recommendation = useMemo(
    () =>
      pickGuidedRoutine({
        routines,
        profile: profile ?? undefined,
        trafficLight: trafficLight.level,
        goalOfDay: checkIn.goalOfDay,
        timeAvailableMin: checkIn.timeAvailableMin,
        fatigue: checkIn.fatigue,
        pain: checkIn.pain
      }),
    [routines, profile, trafficLight.level, checkIn]
  )

  async function handleStart() {
    if (!recommendation.routine) return
    const goalToPersist: MainGoal | null =
      checkIn.goalOfDay ?? profile?.mainGoal ?? null

    await startMut.mutateAsync({
      routineId: recommendation.routine.id,
      spotId: checkIn.place === 'spot' ? checkIn.spotId : null,
      safetyTrafficLight: trafficLight.level,
      safetyOverridden: false,
      safetyNotes: null,
      painBefore: checkIn.pain,
      fatigueBefore: checkIn.fatigue,
      energyBefore: checkIn.energy,
      goalOfDay: goalToPersist,
      place: checkIn.place
    })

    // Mapeo de slug→id de los movements de la rutina, para pre-marcarlos
    // en el FeedbackStep.
    const slugSet = new Set<string>()
    for (const block of recommendation.routine.blocks) {
      for (const ex of block.exercises) {
        if (ex.movementSlug) slugSet.add(ex.movementSlug)
      }
    }
    const ids: string[] = []
    for (const m of allMovements ?? []) {
      if (slugSet.has(m.slug)) ids.push(m.id)
    }
    setPreselectedMovementIds(ids)
  }

  if (sessionLoading) {
    return (
      <div className="px-8 py-6 max-w-3xl">
        <PageHeader title="Entrenar hoy" />
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="px-8 py-6 max-w-2xl space-y-4">
        <PageHeader title="Entrenar hoy" />
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Necesitás un perfil activo para entrenar.</span>
            <Button asChild size="sm">
              <Link to="/profile">Crear perfil</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="px-8 py-6 max-w-3xl space-y-5">
      <PageHeader
        title="Entrenar hoy"
        description="Tu coach guiado. Avanzamos en pasos para que sólo te ocupés de entrenar."
      />

      <StepRail phase={phase} />

      {phase === 'checkin' && (
        <CheckInStep
          value={checkIn}
          onChange={setCheckIn}
          spots={spots}
          onContinue={() => setPhase('recommendation')}
        />
      )}

      {phase === 'recommendation' && (
        <div className="space-y-5">
          <TrafficLightCard result={trafficLight} />
          <RecommendationStep
            recommendation={recommendation}
            trafficLight={trafficLight}
            isStarting={startMut.isPending}
            onStart={handleStart}
            onBack={() => setPhase('checkin')}
          />
          {startMut.error && (
            <Alert variant="destructive">
              <AlertDescription>{startMut.error.message}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {phase === 'guided' && activeSession && (
        <GuidedSessionView
          session={activeSession}
          onFinish={() => setPhase('feedback')}
        />
      )}

      {phase === 'feedback' && activeSession && (
        <FeedbackStep
          session={activeSession}
          preselectedMovementIds={preselectedMovementIds}
          onBack={() => setPhase('guided')}
          onFinished={() => {
            setPhase('checkin')
            setCheckIn(DEFAULT_CHECK_IN)
            setPreselectedMovementIds([])
          }}
        />
      )}

      {phase === 'checkin' && pastSessions && pastSessions.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Ya cargaste {pastSessions.length}{' '}
          {pastSessions.length === 1 ? 'sesión' : 'sesiones'}. Mirá tu
          progreso en{' '}
          <Link to="/progress" className="underline hover:text-foreground">
            Progreso
          </Link>
          .
        </p>
      )}
    </div>
  )
}
