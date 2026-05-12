import { Link } from 'react-router-dom'
import { MapPin, Sparkles, Target, Trophy, UserCircle2, Zap } from 'lucide-react'
import type { PublicProfileDataDto } from '@shared/types/publicProfile'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Props {
  data: PublicProfileDataDto
  /**
   * Modo compacto para usar dentro de la preview en la página de
   * edición. Achica paddings y oculta la portada para no romper el
   * layout de la card contenedora.
   */
  compact?: boolean
}

/**
 * Render del perfil público. Lo usan dos pantallas:
 *  - `/u/:username` (full).
 *  - El preview dentro de la pantalla de edición (compact).
 *
 * No hace fetch propio — todo viene del DTO que le pasen. Las secciones
 * que el dueño escondió ya vienen vacías desde el backend (null o []).
 */
export function PublicProfileView({ data, compact }: Props) {
  const hasLevel = data.level !== null
  const hasStats =
    data.totalXp !== null ||
    data.sessionsCount !== null ||
    data.masteredCount !== null
  const hasDominated = data.dominatedMovements.length > 0
  const hasSpots = data.sharedSpots.length > 0

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {!compact && data.coverImageUrl && (
        <div className="h-40 w-full overflow-hidden rounded-md bg-muted">
          <img
            src={data.coverImageUrl}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`${compact ? 'h-12 w-12' : 'h-20 w-20'} rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border`}>
          {data.avatarUrl ? (
            <img
              src={data.avatarUrl}
              alt={data.displayName ?? data.username}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <UserCircle2 className={compact ? 'h-7 w-7 text-muted-foreground' : 'h-12 w-12 text-muted-foreground'} />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={compact ? 'text-base font-semibold' : 'text-xl font-bold'}>
              {data.displayName ?? data.username}
            </h2>
            {hasLevel && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                {data.level}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            @{data.username}
          </p>
          {data.bio && (
            <p className="text-sm text-muted-foreground leading-snug pt-1">
              {data.bio}
            </p>
          )}
        </div>
      </div>

      {hasStats && (
        <>
          <Separator />
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              icon={Zap}
              label="XP total"
              value={data.totalXp ?? 0}
            />
            <StatTile
              icon={Target}
              label="Sesiones"
              value={data.sessionsCount ?? 0}
            />
            <StatTile
              icon={Trophy}
              label="Dominados"
              value={data.masteredCount ?? 0}
            />
          </div>
        </>
      )}

      {hasDominated && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Movimientos dominados
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {data.dominatedMovements.map((m) => (
                <Badge key={m.slug} variant="secondary" className="text-[11px]">
                  {m.name}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {hasSpots && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Spots compartidos
            </h3>
            <ul className="space-y-1">
              {data.sharedSpots.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/spots/${s.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {!hasStats && !hasDominated && !hasSpots && !data.bio && (
        <p className="text-xs text-muted-foreground italic">
          {compact
            ? 'Con la config actual, otros sólo verían tu nombre y username.'
            : 'Este usuario no compartió estadísticas ni datos adicionales.'}
        </p>
      )}
    </div>
  )
}

interface StatTileProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}

function StatTile({ icon: Icon, label, value }: StatTileProps) {
  return (
    <div className="rounded-md border border-border p-3 bg-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold mt-1">{value.toLocaleString('es-UY')}</p>
    </div>
  )
}
