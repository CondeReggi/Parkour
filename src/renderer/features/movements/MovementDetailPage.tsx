import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Compass,
  Film,
  Flame,
  ListChecks,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  XCircle
} from 'lucide-react'
import { useMovementBySlug } from './hooks/useMovementBySlug'
import { useMovements } from './hooks/useMovements'
import { useSetMovementProgress } from './hooks/useMovementMutations'
import { useActiveProfile } from '@/features/profile/hooks/useActiveProfile'
import { useVideos } from '@/features/videos/hooks/useVideos'
import { computeLearningStatuses } from '@/features/learningPath/lib/learningPathStatus'
import type { MovementDto } from '@shared/types/movement'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MovementProgressForm } from './components/MovementProgressForm'
import { CommentsSection } from '@/features/comments/components/CommentsSection'
import { cn } from '@/lib/utils'

const CATEGORY_LABEL: Record<string, string> = {
  landing: 'Aterrizaje',
  vault: 'Vault',
  climb: 'Climb',
  balance: 'Balance',
  precision: 'Precisión',
  wall: 'Wall',
  core: 'Core'
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Principiante',
  base: 'Base',
  intermediate: 'Intermedio'
}

function difficultyBars(d: number): string[] {
  return Array.from({ length: 5 }, (_, i) => (i < d ? 'on' : 'off'))
}

interface ListSectionProps {
  title: string
  items: string[]
  icon?: React.ReactNode
  iconClass?: string
  emptyHint?: string
}

function ListSection({
  title,
  items,
  icon,
  iconClass,
  emptyHint
}: ListSectionProps) {
  if (items.length === 0) {
    if (!emptyHint) return null
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{emptyHint}</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {items.map((it, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              {icon ? (
                <span className={iconClass}>{icon}</span>
              ) : (
                <span className="text-muted-foreground select-none mt-1">·</span>
              )}
              <span className="leading-snug">{it}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function BadgeSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <Badge key={it} variant="outline">
              {it}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface QuickActionsProps {
  movement: MovementDto
  status: 'locked' | 'available' | 'practicing' | 'mastered'
}

function QuickActions({ movement, status }: QuickActionsProps) {
  const mut = useSetMovementProgress()
  if (status === 'locked' || status === 'mastered') return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== 'practicing' && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            mut.mutate({
              movementId: movement.id,
              status: 'practicing',
              notes: movement.userProgress.notes
            })
          }
          disabled={mut.isPending}
        >
          <Flame className="h-4 w-4" />
          Marcar en práctica
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        onClick={() =>
          mut.mutate({
            movementId: movement.id,
            status: 'mastered',
            notes: movement.userProgress.notes
          })
        }
        disabled={mut.isPending}
      >
        <CheckCircle2 className="h-4 w-4" />
        Marcar dominado
      </Button>
    </div>
  )
}

function StatusBadge({
  status
}: {
  status: 'locked' | 'available' | 'practicing' | 'mastered'
}) {
  switch (status) {
    case 'mastered':
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Dominado
        </Badge>
      )
    case 'practicing':
      return (
        <Badge variant="secondary" className="gap-1">
          <Flame className="h-3 w-3" />
          En práctica
        </Badge>
      )
    case 'locked':
      return (
        <Badge variant="outline" className="gap-1">
          <Lock className="h-3 w-3" />
          Bloqueado
        </Badge>
      )
    default:
      return <Badge variant="outline">Disponible</Badge>
  }
}

export function MovementDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: movement, isLoading } = useMovementBySlug(slug)
  const { data: allMovements } = useMovements()
  const { data: profile } = useActiveProfile()
  const { data: allVideos } = useVideos()

  const namesBySlug = useMemo(() => {
    const m = new Map<string, string>()
    for (const mv of allMovements ?? []) m.set(mv.slug, mv.name)
    return m
  }, [allMovements])

  const learningStatus = useMemo(() => {
    if (!movement || !allMovements || !profile) return null
    return (
      computeLearningStatuses(allMovements, profile.level).get(movement.slug) ??
      null
    )
  }, [movement, allMovements, profile])

  const associatedVideos = useMemo(() => {
    if (!allVideos || !movement) return []
    return allVideos.filter((v) => v.movement?.id === movement.id)
  }, [allVideos, movement])

  if (isLoading) {
    return (
      <div className="px-8 py-6">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  if (!movement) {
    return (
      <div className="px-8 py-6 max-w-2xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/movements">
            <ArrowLeft className="h-4 w-4" /> Volver a la biblioteca
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>Movimiento no encontrado: {slug}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const status = learningStatus?.status ?? 'available'
  const risks = movement.risks.length

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/movements">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </Button>
      </div>

      <header className="space-y-4 pb-6 mb-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {CATEGORY_LABEL[movement.category] ?? movement.category}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{movement.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <Badge variant="outline">
                Nivel: {LEVEL_LABEL[movement.requiredLevel] ?? movement.requiredLevel}
              </Badge>
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border"
                title={`Dificultad ${movement.difficulty}/5`}
              >
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
                  Dif
                </span>
                {difficultyBars(movement.difficulty).map((on, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-2 w-1 rounded-sm',
                      on === 'on' ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                ))}
              </div>
              {risks > 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    'gap-1',
                    risks >= 4
                      ? 'border-destructive/50 text-destructive'
                      : risks >= 2
                        ? 'border-amber-500/50 text-amber-400'
                        : ''
                  )}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {risks} {risks === 1 ? 'riesgo' : 'riesgos'}
                </Badge>
              )}
            </div>
          </div>
          <QuickActions movement={movement} status={status} />
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">
          {movement.description}
        </p>

        {movement.technicalGoal && (
          <Card className="bg-primary/5 border-primary/30">
            <CardContent className="pt-4 pb-4 flex items-start gap-3">
              <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-primary/80">
                  Objetivo técnico
                </p>
                <p className="text-sm leading-snug">{movement.technicalGoal}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </header>

      <div className="grid gap-4">
        {status === 'locked' &&
          learningStatus?.lockReason === 'prereq' &&
          learningStatus.unmetPrereqSlugs.length > 0 && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Para empezar a practicar, primero dominá:{' '}
                <span className="font-medium">
                  {learningStatus.unmetPrereqSlugs
                    .map((s) => namesBySlug.get(s) ?? s)
                    .join(', ')}
                </span>
                .
              </AlertDescription>
            </Alert>
          )}

        {status === 'locked' && learningStatus?.lockReason === 'level' && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Tu nivel actual queda lejos del requerido. Consolidá los previos
              o pasá una evaluación nueva para desbloquearlo.
            </AlertDescription>
          </Alert>
        )}

        {movement.risks.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Riesgos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {movement.risks.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-destructive select-none mt-1">·</span>
                    <span className="leading-snug">{r}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {movement.safetyChecklist.length > 0 && (
          <Card className="border-emerald-500/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Checklist de práctica segura
              </CardTitle>
              <CardDescription className="text-xs">
                Repasá esto antes de cada intento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {movement.safetyChecklist.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckSquare className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="leading-snug">{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListSection
            title="Señales de buena técnica"
            items={movement.goodExecutionCues}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            iconClass="mt-0.5 flex-shrink-0"
          />
          <ListSection
            title="Errores comunes"
            items={movement.commonMistakes}
            icon={<XCircle className="h-4 w-4 text-destructive" />}
            iconClass="mt-0.5 flex-shrink-0"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {movement.prerequisites.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prerrequisitos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {movement.prerequisites.map((s) => {
                    const ok = !learningStatus?.unmetPrereqSlugs.includes(s)
                    return (
                      <li key={s}>
                        <Link
                          to={`/movements/${s}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          {ok ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                          )}
                          <span>{namesBySlug.get(s) ?? s}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prerrequisitos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  No requiere movimientos previos.
                </p>
              </CardContent>
            </Card>
          )}

          <ListSection
            title="Ejercicios preparatorios"
            items={movement.preparatoryDrills}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BadgeSection
            title="Músculos involucrados"
            items={movement.musclesInvolved}
          />
          <BadgeSection title="Tags" items={movement.tags} />
        </div>

        {movement.nextMovements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                Cuando domines este
              </CardTitle>
              <CardDescription className="text-xs">
                Estos movimientos se vuelven accesibles cuando lo marcás como
                dominado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {movement.nextMovements.map((n) => (
                  <li key={n.slug}>
                    <Link
                      to={`/movements/${n.slug}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5 hover:border-primary/40 hover:bg-accent/30 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{n.name}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Dif {n.difficulty}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground/80 flex-shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {movement.usedInRoutines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                Aparece en estas rutinas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {movement.usedInRoutines.map((r) => (
                  <li key={r.id}>
                    {r.slug ? (
                      <Link
                        to={`/routines/${r.slug}`}
                        className="flex items-center justify-between gap-2 text-sm hover:underline"
                      >
                        <span>{r.name}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {r.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Film className="h-4 w-4 text-primary" />
              Videos asociados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {associatedVideos.length === 0 ? (
              <div className="text-center py-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Todavía no tenés videos vinculados a este movimiento.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/videos">
                    <Sparkles className="h-4 w-4" />
                    Ir a videos
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {associatedVideos.slice(0, 5).map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Film className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{v.fileName}</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {v.reviewStatus}
                    </Badge>
                  </li>
                ))}
                {associatedVideos.length > 5 && (
                  <li className="text-[11px] text-muted-foreground text-center">
                    +{associatedVideos.length - 5} más
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        <MovementProgressForm movement={movement} />
      </div>

      <CommentsSection
        target={{ kind: 'movement', id: movement.id }}
        title="Tips y comentarios"
      />
    </div>
  )
}
