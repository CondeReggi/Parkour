import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Flame } from 'lucide-react'
import type { MovementDto } from '@shared/types/movement'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSetMovementProgress } from '@/features/movements/hooks/useMovementMutations'
import type { LearningInfo } from '../lib/learningPathStatus'
import { STATUS_LABEL } from './learningPathEnums'

interface Props {
  movement: MovementDto | null
  info: LearningInfo | null
  /** Lookup para mostrar el nombre humano de los prereqs no resueltos. */
  namesBySlug: Map<string, string>
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Detalle corto que se abre al clickear un nodo del skill tree.
 * Acciones rápidas: marcar en práctica / dominado (siempre que el
 * estado actual lo permita) + link al detalle completo en /movements/:slug.
 */
export function MovementDetailDialog({
  movement,
  info,
  namesBySlug,
  open,
  onOpenChange
}: Props) {
  const mutateProgress = useSetMovementProgress()

  if (!movement || !info) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Movimiento</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  async function setStatus(status: 'practicing' | 'mastered') {
    if (!movement) return
    await mutateProgress.mutateAsync({
      movementId: movement.id,
      status,
      notes: movement.userProgress.notes
    })
    onOpenChange(false)
  }

  const canMarkPracticing =
    info.status !== 'locked' && info.status !== 'practicing'
  const canMarkMastered = info.status === 'practicing'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle>{movement.name}</DialogTitle>
            <Badge variant="outline" className="text-[10px] capitalize">
              {movement.category}
            </Badge>
            <Badge variant="outline" className="text-[10px] tabular-nums">
              Dif {movement.difficulty}/5
            </Badge>
            <Badge
              variant={
                info.status === 'mastered' || info.status === 'practicing'
                  ? 'default'
                  : info.status === 'available'
                    ? 'secondary'
                    : 'outline'
              }
              className="text-[10px]"
            >
              {STATUS_LABEL[info.status]}
            </Badge>
          </div>
          <DialogDescription className="pt-1.5 leading-snug">
            {movement.description}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          {info.status === 'locked' && info.lockReason === 'level' && (
            <Alert>
              <AlertDescription className="text-xs">
                Tu nivel actual es demasiado bajo para este movimiento. Subí
                con la evaluación inicial o consolidá los previos.
              </AlertDescription>
            </Alert>
          )}

          {info.status === 'locked' &&
            info.lockReason === 'prereq' &&
            info.unmetPrereqSlugs.length > 0 && (
              <Alert>
                <AlertDescription className="text-xs">
                  Falta dominar:{' '}
                  <span className="font-medium">
                    {info.unmetPrereqSlugs
                      .map((s) => namesBySlug.get(s) ?? s)
                      .join(', ')}
                  </span>
                </AlertDescription>
              </Alert>
            )}

          {movement.prerequisites.length > 0 && info.status !== 'locked' && (
            <p className="text-xs text-muted-foreground">
              Prerequisitos:{' '}
              {movement.prerequisites
                .map((s) => namesBySlug.get(s) ?? s)
                .join(', ')}
            </p>
          )}

          {mutateProgress.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {mutateProgress.error.message}
              </AlertDescription>
            </Alert>
          )}
        </DialogBody>

        <DialogFooter>
          {canMarkMastered && (
            <Button
              type="button"
              size="sm"
              onClick={() => setStatus('mastered')}
              disabled={mutateProgress.isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              Marcar dominado
            </Button>
          )}
          {canMarkPracticing && (
            <Button
              type="button"
              size="sm"
              variant={canMarkMastered ? 'outline' : 'default'}
              onClick={() => setStatus('practicing')}
              disabled={mutateProgress.isPending}
            >
              <Flame className="h-4 w-4" />
              Marcar en práctica
            </Button>
          )}
          <Button
            asChild
            type="button"
            size="sm"
            variant="ghost"
            className="mr-auto"
          >
            <Link to={`/movements/${movement.slug}`}>
              Ver detalle completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
