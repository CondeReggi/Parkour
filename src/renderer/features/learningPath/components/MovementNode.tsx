import { forwardRef } from 'react'
import type { MovementDto } from '@shared/types/movement'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  STATUS_DOT_CLASS,
  STATUS_ICON,
  STATUS_LABEL,
  STATUS_NODE_CLASS
} from './learningPathEnums'
import type { LearningInfo } from '../lib/learningPathStatus'

interface Props {
  movement: MovementDto
  info: LearningInfo
  onSelect: (m: MovementDto) => void
}

/**
 * Nodo individual del skill tree. Compacto, clickeable, con dot de
 * estado, dificultad y nombre. Forwarda la ref para que CategoryBranch
 * pueda medir posición y dibujar las conexiones SVG.
 */
export const MovementNode = forwardRef<HTMLButtonElement, Props>(
  function MovementNode({ movement, info, onSelect }, ref) {
    const StatusIcon = STATUS_ICON[info.status]
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => onSelect(movement)}
        data-status={info.status}
        className={cn(
          'group relative z-10 w-full text-left rounded-lg border p-3 transition-colors min-h-[88px] flex flex-col gap-1.5',
          STATUS_NODE_CLASS[info.status]
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full flex-shrink-0',
                STATUS_DOT_CLASS[info.status]
              )}
              aria-hidden="true"
            />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {STATUS_LABEL[info.status]}
            </span>
          </div>
          <StatusIcon
            className={cn(
              'h-3.5 w-3.5 flex-shrink-0',
              info.status === 'mastered' || info.status === 'practicing'
                ? 'text-primary'
                : 'text-muted-foreground/70'
            )}
            aria-hidden="true"
          />
        </div>

        <p className="text-sm font-medium leading-tight line-clamp-2">
          {movement.name}
        </p>

        <div className="mt-auto flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] tabular-nums px-1.5">
            Dif {movement.difficulty}
          </Badge>
          {info.status === 'locked' && info.lockReason === 'level' && (
            <span className="text-[10px] text-muted-foreground">
              Nivel insuficiente
            </span>
          )}
          {info.status === 'locked' && info.lockReason === 'prereq' && (
            <span className="text-[10px] text-muted-foreground">
              {info.unmetPrereqSlugs.length}{' '}
              {info.unmetPrereqSlugs.length === 1 ? 'prereq' : 'prereqs'}
            </span>
          )}
        </div>
      </button>
    )
  }
)
