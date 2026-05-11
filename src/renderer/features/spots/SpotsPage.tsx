import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MotionPage } from '@/components/motion/MotionPage'
import { MotionList, MotionListItem } from '@/components/motion/MotionList'
import { useSpots } from './hooks/useSpots'
import { SpotCard, SpotsEmptyState } from './components/SpotCard'
import { SpotFiltersBar } from './components/SpotFiltersBar'
import { SpotMap } from './components/SpotMap'
import { applySpotFilters, DEFAULT_SPOT_FILTERS } from './lib/spotFilters'

export function SpotsPage() {
  const navigate = useNavigate()
  const { data: spots, isLoading, error } = useSpots()
  const [filters, setFilters] = useState(DEFAULT_SPOT_FILTERS)

  const filtered = useMemo(
    () => (spots ? applySpotFilters(spots, filters) : []),
    [spots, filters]
  )

  const totalText = spots
    ? `${filtered.length}${filtered.length !== spots.length ? ` de ${spots.length}` : ''}`
    : '…'

  return (
    <MotionPage className="px-8 py-6 max-w-5xl">
      <PageHeader
        title="Spots"
        description="Tu mapa personal de entrenamiento. Cada lugar con sus obstáculos, movimientos y memoria."
      >
        <Badge variant="outline">{totalText}</Badge>
        <Button asChild size="sm">
          <Link to="/spots/new">
            <Plus className="h-4 w-4" />
            Nuevo spot
          </Link>
        </Button>
      </PageHeader>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {error instanceof Error ? error.message : String(error)}
          </AlertDescription>
        </Alert>
      )}

      {/*
       * Mapa principal: lo mostramos siempre, incluso sin spots todavía.
       * Si no hay ninguno con coordenadas, el mapa igual sirve de pista
       * visual para entender que el flujo nuevo permite elegir lugar.
       */}
      {!isLoading && (
        <div className="mb-5">
          <SpotMap spots={filtered.length > 0 ? filtered : spots ?? []} />
        </div>
      )}

      {spots && spots.length > 0 && (
        <div className="mb-5">
          <SpotFiltersBar value={filters} onChange={setFilters} />
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {!isLoading && (!spots || spots.length === 0) && (
        <SpotsEmptyState onCreate={() => navigate('/spots/new')} />
      )}

      {spots && spots.length > 0 && filtered.length === 0 && (
        <Card className="p-6 text-center space-y-2">
          <p className="text-sm font-medium">Ningún spot coincide con los filtros</p>
          <p className="text-xs text-muted-foreground">
            Ajustá la búsqueda o limpiá los filtros.
          </p>
        </Card>
      )}

      {filtered.length > 0 && (
        <MotionList
          // El `key` cambia con cualquier filtro: forzamos re-stagger al
          // filtrar para que el resultado se sienta vivo.
          key={JSON.stringify(filters)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence initial={false}>
            {filtered.map((s) => (
              <MotionListItem key={s.id}>
                <SpotCard spot={s} />
              </MotionListItem>
            ))}
          </AnimatePresence>
        </MotionList>
      )}
    </MotionPage>
  )
}
