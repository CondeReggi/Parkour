import type { MovementProgressStatus } from '@shared/types/movement'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS: Record<
  MovementProgressStatus,
  { label: string; dot: string }
> = {
  not_attempted: { label: 'Sin intentar', dot: 'bg-zinc-500' },
  practicing: { label: 'En práctica', dot: 'bg-amber-400' },
  mastered: { label: 'Dominado', dot: 'bg-emerald-400' }
}

export function StatusBadge({
  status,
  size = 'default'
}: {
  status: MovementProgressStatus
  size?: 'default' | 'sm'
}) {
  const cfg = STATUS[status]
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-2',
        size === 'sm' && 'px-2 py-0.5 text-[10px]'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      <span>{cfg.label}</span>
    </Badge>
  )
}

export const STATUS_LABEL: Record<MovementProgressStatus, string> = {
  not_attempted: STATUS.not_attempted.label,
  practicing: STATUS.practicing.label,
  mastered: STATUS.mastered.label
}
