import type { TrafficLight, TrafficLightResult } from '../lib/safety'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Cfg {
  label: string
  description: string
  dot: string
  ring: string
}

const CONFIG: Record<TrafficLight, Cfg> = {
  green: {
    label: 'Adelante',
    description: 'Estás en condiciones para entrenar normal.',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/20'
  },
  yellow: {
    label: 'Suave hoy',
    description: 'Hay señales de moderar la intensidad. Una rutina liviana o de movilidad.',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400/20'
  },
  red: {
    label: 'Mejor descansá',
    description: 'Hoy no es el día para entrenar. Movilidad ligera, hidratación y descanso.',
    dot: 'bg-red-500',
    ring: 'ring-red-500/20'
  }
}

export function TrafficLightCard({ result }: { result: TrafficLightResult }) {
  const cfg = CONFIG[result.level]
  const allReasons = [...result.reds, ...result.yellows]

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'h-12 w-12 rounded-full ring-8 flex-shrink-0',
              cfg.dot,
              cfg.ring
            )}
            aria-hidden
          />
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-bold">{cfg.label}</h2>
              <span className="text-xs text-muted-foreground">
                semáforo de seguridad
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{cfg.description}</p>
          </div>
        </div>

        {allReasons.length > 0 && (
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Lo que se tomó en cuenta
            </p>
            <ul className="space-y-1">
              {result.reds.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 select-none mt-0.5">●</span>
                  <span>{r}</span>
                </li>
              ))}
              {result.yellows.map((y) => (
                <li key={y} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-400 select-none mt-0.5">●</span>
                  <span>{y}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
