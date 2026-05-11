import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useRoutineBySlug } from './hooks/useRoutineBySlug'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RoutineBlock } from './components/RoutineBlock'
import { DurationBadge, GoalBadge, LevelBadge } from './components/RoutineMeta'

export function RoutineDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: routine, isLoading } = useRoutineBySlug(slug)

  if (isLoading) {
    return (
      <div className="px-8 py-6">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="px-8 py-6 max-w-2xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/routines">
            <ArrowLeft className="h-4 w-4" /> Volver a rutinas
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>Rutina no encontrada: {slug}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="px-8 py-6 max-w-3xl">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/routines">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </Button>
      </div>

      <header className="space-y-4 pb-6 mb-6 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">{routine.name}</h1>
        {routine.description && (
          <p className="text-sm text-foreground/80 leading-relaxed">{routine.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <GoalBadge goal={routine.goal} />
          <LevelBadge level={routine.level} />
          <DurationBadge minutes={routine.estimatedMin} />
        </div>
      </header>

      <div className="grid gap-4">
        {routine.blocks.length === 0 && (
          <p className="text-sm text-muted-foreground">Esta rutina no tiene bloques.</p>
        )}
        {routine.blocks.map((b) => (
          <RoutineBlock key={b.id} block={b} />
        ))}
      </div>
    </div>
  )
}
