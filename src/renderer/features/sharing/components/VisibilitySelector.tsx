import { Globe2, Link2, Lock, ShieldAlert } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  VISIBILITY_OPTIONS,
  describeVisibility,
  isShareableVisibility,
  type Visibility
} from '@shared/types/sharing'
import { useAuthState } from '@/features/auth/hooks/useAuth'
import { useMyPublicProfile } from '@/features/publicProfile/hooks/usePublicProfile'

interface Props {
  value: Visibility
  onChange: (next: Visibility) => void
  /**
   * Label custom para el field. Por default "Visibilidad".
   */
  label?: string
}

const ICON_BY_VISIBILITY: Record<Visibility, React.ComponentType<{ className?: string }>> = {
  private: Lock,
  public: Globe2,
  unlisted: Link2
}

/**
 * Selector reutilizable de visibility para entidades compartibles.
 * Tres comportamientos:
 *
 * 1. Si el usuario no está autenticado (modo local), el select queda
 *    deshabilitado y mostramos un Alert: "Para compartir contenido
 *    necesitás iniciar sesión". Cualquier valor previo distinto a
 *    `private` igual se muestra pero no se puede cambiar.
 *
 * 2. Si el perfil público está marcado privado, dejamos seleccionar
 *    public/unlisted pero avisamos: "Tu perfil público está privado.
 *    Lo que compartas no se va a ver hasta que lo actives."
 *
 * 3. En cualquier caso, mostramos la microcopy correspondiente al valor
 *    elegido debajo del select.
 *
 * Se monta dentro de un `<FormField>`; el componente sólo emite cambios.
 */
export function VisibilitySelector({ value, onChange, label = 'Visibilidad' }: Props) {
  const { data: state } = useAuthState()
  const { data: pub } = useMyPublicProfile()
  const isAuthenticated = state?.mode === 'authenticated'
  const profilePrivate = isAuthenticated && pub && pub.isPublic === false
  const Icon = ICON_BY_VISIBILITY[value]

  return (
    <FormItem>
      <FormLabel className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </FormLabel>

      {!isAuthenticated && (
        <Alert variant="default" className="border-amber-500/30">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Para compartir contenido necesitás iniciar sesión. El valor queda en{' '}
            <strong>privado</strong>.
          </AlertDescription>
        </Alert>
      )}

      <FormControl>
        <Select
          value={value}
          onValueChange={(v) => onChange(v as Visibility)}
          disabled={!isAuthenticated}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((o) => {
              const OptIcon = ICON_BY_VISIBILITY[o.value]
              return (
                <SelectItem key={o.value} value={o.value}>
                  <span className="flex items-center gap-2">
                    <OptIcon className="h-3.5 w-3.5" />
                    {o.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </FormControl>

      <FormDescription>{describeVisibility(value)}</FormDescription>

      {isAuthenticated && profilePrivate && isShareableVisibility(value) && (
        <Alert variant="default" className="border-amber-500/30">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Tu perfil público está privado. Lo que compartas acá no va a ser
            visible para otros hasta que actives tu perfil público desde la
            pantalla de Perfil.
          </AlertDescription>
        </Alert>
      )}

      <FormMessage />
    </FormItem>
  )
}
