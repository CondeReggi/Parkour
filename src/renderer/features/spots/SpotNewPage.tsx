import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { SpotForm } from './components/SpotForm'

export function SpotNewPage() {
  const navigate = useNavigate()

  return (
    <div className="px-8 py-6 max-w-3xl">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/spots">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Nuevo spot"
        description="Después vas a poder agregarle obstáculos y movimientos recomendados."
      />

      <SpotForm onCreated={(spot) => navigate(`/spots/${spot.id}`)} />
    </div>
  )
}
