import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Lock,
  ShieldAlert
} from 'lucide-react'
import type { MovementDto } from '@shared/types/movement'
import type { LearningInfo } from '@/features/learningPath/lib/learningPathStatus'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSetMovementProgress } from '../hooks/useMovementMutations'
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

function riskClass(risks: number): string {
  if (risks >= 4) return 'text-destructive'
  if (risks >= 2) return 'text-amber-400'
  return 'text-muted-foreground/70'
}

function statusBorderClass(status: LearningInfo['status']): string {
  switch (status) {
    case 'mastered':
      return 'border-primary/50'
    case 'practicing':
      return 'border-primary/30'
    case 'locked':
      return 'border-dashed border-border opacity-80'
    default:
      return 'border-foreground/15'
  }
}

interface Props {
  movement: MovementDto
  info: LearningInfo
  /** Lookup para mostrar nombres legibles de prereqs. */
  namesBySlug: Map<string, string>
}

export function MovementCard({ movement, info, namesBySlug }: Props) {
  const mutate = useSetMovementProgress()
  const risks = movement.risks.length

  async function quickPracticing(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await mutate.mutateAsync({
      movementId: movement.id,
      status: 'practicing',
      notes: movement.userProgress.notes
    })
  }

  async function quickMastered(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await mutate.mutateAsync({
      movementId: movement.id,
      status: 'mastered',
      notes: movement.userProgress.notes
    })
  }

  return (
    <Link to={`/movements/${movement.slug}`} className="block group">
      <Card
        className={cn(
          'p-4 transition-colors hover:border-primary/50 cursor-pointer space-y-3',
          statusBorderClass(info.status)
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold leading-tight">{movement.name}</span>
              <StatusChip status={info.status} />
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <Badge variant="outline" className="capitalize">
                {CATEGORY_LABEL[movement.category] ?? movement.category}
              </Badge>
              <Badge variant="outline">
                {LEVEL_LABEL[movement.requiredLevel] ?? movement.requiredLevel}
              </Badge>
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border"
                title={`Dificultad ${movement.difficulty}/5`}
              >
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
                <span
                  className={cn(
                    'flex items-center gap-1 text-[10px] tabular-nums',
                    riskClass(risks)
                  )}
                  title={`${risks} riesgos listados`}
                >
                  <ShieldAlert className="h-3 w-3" />
                  {risks}
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground/70 transition-colors flex-shrink-0 mt-1" />
        </div>

        {movement.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
            {movement.description}
          </p>
        )}

        {movement.prerequisites.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Requiere:
            </span>
            {movement.prerequisites.slice(0, 3).map((slug) => (
              <Badge
                key={slug}
                variant="outline"
                className={cn(
                  'text-[10px]',
                  info.unmetPrereqSlugs.includes(slug)
                    ? 'border-amber-500/50 text-amber-400'
                    : 'border-emerald-500/40 text-emerald-400'
                )}
              >
                {namesBySlug.get(slug) ?? slug}
              </Badge>
            ))}
            {movement.prerequisites.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{movement.prerequisites.length - 3}
              </span>
            )}
          </div>
        )}

        {(info.status === 'available' || info.status === 'practicing') && (
          <div className="flex items-center gap-2 pt-1">
            {info.status === 'available' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs"
                onClick={quickPracticing}
                disabled={mutate.isPending}
              >
                <Flame className="h-3.5 w-3.5" />
                Empezar a practicar
              </Button>
            )}
            {info.status === 'practicing' && (
              <Button
                type="button"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={quickMastered}
                disabled={mutate.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Marcar dominado
              </Button>
            )}
          </div>
        )}
      </Card>
    </Link>
  )
}

function StatusChip({ status }: { status: LearningInfo['status'] }) {
  switch (status) {
    case 'mastered':
      return (
        <Badge variant="default" className="gap-1 text-[10px]">
          <CheckCircle2 className="h-3 w-3" />
          Dominado
        </Badge>
      )
    case 'practicing':
      return (
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <Flame className="h-3 w-3" />
          En práctica
        </Badge>
      )
    case 'locked':
      return (
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Lock className="h-3 w-3" />
          Bloqueado
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-[10px]">
          Disponible
        </Badge>
      )
  }
}
