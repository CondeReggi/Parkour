import { Dumbbell } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { slideUpVariants } from '@/lib/motion'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  /** Slot inferior para enlaces (ej: "ya tengo cuenta"). */
  footer?: React.ReactNode
  /**
   * Override del elemento visual de arriba (default: ícono Dumbbell).
   * Pasar acá una imagen, SVG o el componente que quieras. Si viene,
   * se renderiza encima del título; si no, se muestra el ícono default.
   */
  hero?: React.ReactNode
}

/**
 * Layout centrado para las pantallas de auth (login/register). Mantiene
 * la estética del resto de la app pero pone el contenido como
 * protagonista en el centro de la pantalla.
 *
 * No hay back link a /dashboard: las rutas privadas están protegidas
 * por AuthGuard, así que ofrecer "volver" sin sesión no tiene sentido.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  hero
}: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <motion.div
        variants={slideUpVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          {hero ?? (
            <div className="mx-auto h-10 w-10 rounded-md bg-primary/15 text-primary flex items-center justify-center">
              <Dumbbell className="h-5 w-5" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-snug">
              {subtitle}
            </p>
          )}
        </div>

        <Card className="border-border/80">
          <CardContent className="pt-6 pb-6">{children}</CardContent>
        </Card>

        {footer && (
          <div className="text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  )
}
