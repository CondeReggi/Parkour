import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { MovementDto } from '@shared/types/movement'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const MAX_ITEMS = 5

function relativeDate(iso: string | null): string {
  if (!iso) return 'sin práctica'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  if (days < 30) return `hace ${Math.floor(days / 7)} sem`
  return `hace ${Math.floor(days / 30)} meses`
}

export function PracticingMovementsCard({ movements }: { movements: MovementDto[] }) {
  const practicing = movements
    .filter((m) => m.userProgress.status === 'practicing')
    .sort((a, b) => {
      const aTs = a.userProgress.lastPracticedAt
        ? new Date(a.userProgress.lastPracticedAt).getTime()
        : 0
      const bTs = b.userProgress.lastPracticedAt
        ? new Date(b.userProgress.lastPracticedAt).getTime()
        : 0
      return bTs - aTs
    })
    .slice(0, MAX_ITEMS)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Movimientos en práctica</CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link to="/movements">
              Ver biblioteca <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {practicing.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no marcaste ningún movimiento como en práctica.
          </p>
        ) : (
          <ul className="space-y-2">
            {practicing.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/movements/${m.slug}`}
                  className="flex items-center justify-between gap-2 text-sm hover:underline"
                >
                  <span className="truncate">{m.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {relativeDate(m.userProgress.lastPracticedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
