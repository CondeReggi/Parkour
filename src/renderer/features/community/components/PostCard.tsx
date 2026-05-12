import { Link } from 'react-router-dom'
import {
  ArrowRight,
  EyeOff,
  Lock,
  MessageSquare,
  UserCircle2
} from 'lucide-react'
import type { PostDto } from '@shared/types/post'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PostTypeBadge } from './PostTypeBadge'

interface Props {
  post: PostDto
}

/**
 * Card de lista. Muestra título, autor, tipo, fecha, extracto del body y
 * (si hay) un chip con la entidad relacionada. El detalle se abre con el
 * botón "Ver".
 */
export function PostCard({ post }: Props) {
  const excerpt = post.body.length > 220 ? post.body.slice(0, 220).trim() + '…' : post.body
  const dateLabel = new Date(post.createdAt).toLocaleString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  const authorName =
    post.author.displayName ?? post.author.username ?? 'Anónimo'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <PostTypeBadge type={post.type} />
              {post.visibility === 'private' && (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Lock className="h-3 w-3" />
                  Privado
                </Badge>
              )}
              {post.visibility === 'unlisted' && (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <EyeOff className="h-3 w-3" />
                  No listado
                </Badge>
              )}
              {post.status !== 'active' && post.status !== 'deleted' && (
                <Badge variant="outline" className="text-[10px]">
                  {post.status}
                </Badge>
              )}
            </div>
            <CardTitle className="text-base">
              <Link
                to={`/community/posts/${post.id}`}
                className="hover:underline"
              >
                {post.title}
              </Link>
            </CardTitle>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link to={`/community/posts/${post.id}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
          {excerpt}
        </p>

        {(post.relatedSpot ||
          post.relatedRoutine ||
          post.relatedVideo ||
          post.relatedMovement) && (
          <div className="flex flex-wrap gap-1.5">
            {post.relatedMovement && (
              <Badge variant="outline" className="text-[10px]">
                Movimiento · {post.relatedMovement.name}
              </Badge>
            )}
            {post.relatedSpot && (
              <Badge variant="outline" className="text-[10px]">
                Spot · {post.relatedSpot.name}
              </Badge>
            )}
            {post.relatedRoutine && (
              <Badge variant="outline" className="text-[10px]">
                Rutina · {post.relatedRoutine.name}
              </Badge>
            )}
            {post.relatedVideo && (
              <Badge variant="outline" className="text-[10px]">
                Video · {post.relatedVideo.fileName}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-6 w-6 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border flex-shrink-0">
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={authorName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          {post.author.username ? (
            <Link
              to={`/u/${post.author.username}`}
              className="hover:underline truncate"
            >
              {authorName}
            </Link>
          ) : (
            <span className="truncate">{authorName}</span>
          )}
          <span>·</span>
          <span>{dateLabel}</span>
          <span className="ml-auto flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.commentCount}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
