import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  PlayCircle,
  ShieldAlert,
  Star,
  Trash2
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useSpotById } from './hooks/useSpots'
import { useDeleteSpot, useSetSpotFavorite } from './hooks/useSpotMutations'
import { SpotForm } from './components/SpotForm'
import { ObstaclesPanel } from './components/ObstaclesPanel'
import { SpotPhotosGallery } from './components/SpotPhotosGallery'
import { SpotLocationCard } from './components/SpotLocationCard'
import { IdealMovementsEditor } from './components/IdealMovementsEditor'
import { SpotSessionHistory } from './components/SpotSessionHistory'
import { SpotVideosList } from './components/SpotVideosList'
import { formatRelativeFromNow } from './lib/spotFilters'
import {
  RECOMMENDED_LEVEL_LABEL,
  RISK_BADGE_VARIANT,
  RISK_LABEL,
  RISK_RECOMMENDATION,
  SPOT_TYPE_LABEL
} from './components/spotEnums'

export function SpotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: spot, isLoading } = useSpotById(id)
  const delMut = useDeleteSpot()
  const favMut = useSetSpotFavorite()

  if (isLoading) {
    return (
      <div className="px-8 py-6">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  if (!spot) {
    return (
      <div className="px-8 py-6 max-w-2xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/spots">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>Spot no encontrado.</AlertDescription>
        </Alert>
      </div>
    )
  }

  async function handleDelete() {
    if (!spot) return
    if (
      !confirm(
        `¿Borrar el spot "${spot.name}" y todos sus obstáculos, fotos y movimientos ideales? No se puede deshacer.`
      )
    )
      return
    await delMut.mutateAsync({ id: spot.id })
    navigate('/spots')
  }

  function handleTrainHere() {
    if (!spot) return
    navigate(`/training?spotId=${encodeURIComponent(spot.id)}`)
  }

  const lastTrained = formatRelativeFromNow(spot.lastTrainedAt)

  return (
    <div className="px-8 py-6 max-w-5xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/spots">
            <ArrowLeft className="h-4 w-4" /> Volver a spots
          </Link>
        </Button>
      </div>

      {/* Hero del spot */}
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-br from-primary/10 via-secondary/40 to-transparent p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  {spot.name}
                </h1>
                <button
                  type="button"
                  onClick={() =>
                    favMut.mutate({
                      id: spot.id,
                      isFavorite: !spot.isFavorite
                    })
                  }
                  disabled={favMut.isPending}
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
                    spot.isFavorite
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  aria-label={
                    spot.isFavorite
                      ? 'Quitar de favoritos'
                      : 'Marcar como favorito'
                  }
                >
                  <Star
                    className={cn('h-4 w-4', spot.isFavorite && 'fill-current')}
                  />
                </button>
              </div>
              {spot.locationText && (
                <p className="text-sm text-muted-foreground">
                  {spot.locationText}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {spot.spotType && (
                  <Badge variant="secondary" className="text-[10px]">
                    {SPOT_TYPE_LABEL[spot.spotType]}
                  </Badge>
                )}
                <Badge
                  variant={RISK_BADGE_VARIANT(spot.riskLevel)}
                  className="text-[10px]"
                >
                  Riesgo: {RISK_LABEL[spot.riskLevel]}
                </Badge>
                {spot.recommendedLevel && (
                  <Badge variant="outline" className="text-[10px]">
                    Nivel: {RECOMMENDED_LEVEL_LABEL[spot.recommendedLevel]}
                  </Badge>
                )}
                {spot.beginnerFriendly && (
                  <Badge variant="outline" className="text-[10px]">
                    Apto principiantes
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Button
                type="button"
                onClick={handleTrainHere}
                className="bg-primary text-primary-foreground"
              >
                <PlayCircle className="h-4 w-4" />
                Entrenar acá hoy
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={delMut.isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {delMut.isPending ? 'Borrando…' : 'Borrar spot'}
              </Button>
            </div>
          </div>

          {/* Stats inline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Sesiones" value={String(spot.sessionCount)} />
            <StatTile
              label="Última vez"
              value={lastTrained ?? '—'}
              hint={
                spot.lastTrainedAt
                  ? new Date(spot.lastTrainedAt).toLocaleDateString()
                  : 'Sin registros'
              }
            />
            <StatTile
              label="Obstáculos"
              value={String(spot.obstacles.length)}
            />
            <StatTile
              label="Movimientos"
              value={String(spot.idealMovements.length)}
            />
          </div>

          {spot.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {spot.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Riesgo y recomendación */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-md bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Riesgo y recomendaciones
              </p>
              <p className="text-sm">
                <span className="font-medium">
                  {RISK_LABEL[spot.riskLevel]}.
                </span>{' '}
                {RISK_RECOMMENDATION[spot.riskLevel]}
              </p>
              {spot.recommendedHours && (
                <p className="text-xs text-muted-foreground">
                  Mejor horario: {spot.recommendedHours}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <SpotLocationCard spot={spot} />

      <SpotPhotosGallery spotId={spot.id} photos={spot.photos} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IdealMovementsEditor spot={spot} />
        <ObstaclesPanel spotId={spot.id} obstacles={spot.obstacles} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpotSessionHistory spotId={spot.id} />
        <SpotVideosList spotId={spot.id} />
      </div>

      <PageHeader
        title="Editar datos del spot"
        description="Ajustá nombre, tipo, riesgo, tags y notas personales."
      />

      <SpotForm initial={spot} />
    </div>
  )
}

function StatTile({
  label,
  value,
  hint
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-md bg-background/60 backdrop-blur-sm border border-border/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums truncate">{value}</div>
      {hint && (
        <div className="text-[10px] text-muted-foreground truncate">
          {hint}
        </div>
      )}
    </div>
  )
}
