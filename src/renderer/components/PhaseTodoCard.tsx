import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface Props {
  phase: string
  description?: string
  features?: string[]
}

/**
 * Placeholder estandarizado para secciones que aún no se implementaron.
 * Sirve como contrato visual de qué va a contener cada feature cuando esté lista.
 */
export function PhaseTodoCard({ phase, description, features }: Props) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Próximamente</CardTitle>
          <Badge variant="outline">{phase}</Badge>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {features && features.length > 0 && (
        <CardContent>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Va a incluir
          </p>
          <ul className="space-y-2 text-sm">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-muted-foreground">
                <span className="text-foreground/40 select-none mt-0.5">·</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}
