import { Link } from 'react-router-dom'
import {
  Activity,
  MapPin,
  PlayCircle,
  TrendingUp,
  Video,
  type LucideIcon
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Action {
  to: string
  label: string
  icon: LucideIcon
  description: string
}

const ACTIONS: Action[] = [
  {
    to: '/training',
    label: 'Entrenar hoy',
    icon: PlayCircle,
    description: 'Arrancá una sesión nueva'
  },
  {
    to: '/videos',
    label: 'Subir video',
    icon: Video,
    description: 'Sumá un intento para revisar'
  },
  {
    to: '/movements',
    label: 'Ver movimientos',
    icon: Activity,
    description: 'Explorá la biblioteca'
  },
  {
    to: '/spots/new',
    label: 'Registrar spot',
    icon: MapPin,
    description: 'Agregá un lugar nuevo'
  },
  {
    to: '/progress',
    label: 'Ver progreso',
    icon: TrendingUp,
    description: 'Stats y XP en detalle'
  }
]

export function QuickActionsCard() {
  return (
    <Card>
      <CardContent className="pt-5 pb-5 space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Accesos rápidos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex flex-col items-start gap-2 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 hover:border-primary/40 transition-colors min-h-[88px]"
            >
              <div className="h-8 w-8 rounded-md bg-primary/15 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <a.icon className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium leading-tight">{a.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {a.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
