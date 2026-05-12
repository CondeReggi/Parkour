import {
  Award,
  HelpCircle,
  Lightbulb,
  MapPin,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Video
} from 'lucide-react'
import { POST_TYPE_OPTIONS, type PostType } from '@shared/types/post'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const ICON_BY_TYPE: Record<PostType, React.ComponentType<{ className?: string }>> = {
  question: HelpCircle,
  progress: TrendingUp,
  advice: Lightbulb,
  shared_spot: MapPin,
  shared_routine: Sparkles,
  video_review: Video,
  achievement: Award,
  general: MessageSquare
}

const LABEL_BY_TYPE: Record<PostType, string> = Object.fromEntries(
  POST_TYPE_OPTIONS.map((o) => [o.value, o.label])
) as Record<PostType, string>

interface Props {
  type: PostType
  className?: string
}

export function PostTypeBadge({ type, className }: Props) {
  const Icon = ICON_BY_TYPE[type]
  return (
    <Badge
      variant="outline"
      className={cn('gap-1 text-[10px] uppercase tracking-wider', className)}
    >
      <Icon className="h-3 w-3" />
      {LABEL_BY_TYPE[type]}
    </Badge>
  )
}
