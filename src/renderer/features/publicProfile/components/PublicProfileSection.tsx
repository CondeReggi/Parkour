import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  Pencil,
  Save,
  ShieldAlert,
  X
} from 'lucide-react'
import {
  updatePublicProfileInputSchema,
  type UpdatePublicProfileInput
} from '@shared/schemas/publicProfile.schemas'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  useCheckUsernameAvailability,
  useMyPublicProfile,
  useUpdatePublicProfile
} from '../hooks/usePublicProfile'
import { useAuthState } from '@/features/auth/hooks/useAuth'
import { PublicProfileView } from './PublicProfileView'

/**
 * Sección "Perfil público" para `/profile`.
 *
 * Por default sólo muestra la vista previa. El form de edición aparece
 * cuando el usuario aprieta "Editar perfil público". Después de guardar,
 * el form se cierra y volvemos a la vista previa.
 */
export function PublicProfileSection() {
  const { data: state, isLoading: authLoading } = useAuthState()
  const mineQ = useMyPublicProfile()
  const [editing, setEditing] = useState(false)

  const isLocal = state?.mode !== 'authenticated'

  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-muted-foreground" />
            Perfil público
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </CardContent>
      </Card>
    )
  }

  if (isLocal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-muted-foreground" />
            Perfil público
          </CardTitle>
          <CardDescription>
            Tu identidad para la comunidad futura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Estás usando la app en modo local. Para crear o editar tu
                perfil público necesitás iniciar sesión.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (mineQ.isLoading || !mineQ.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-muted-foreground" />
            Perfil público
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </CardContent>
      </Card>
    )
  }

  if (editing) {
    return (
      <PublicProfileEditor
        initial={mineQ.data}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    )
  }

  return (
    <PublicProfilePreview
      profile={mineQ.data}
      onEdit={() => setEditing(true)}
    />
  )
}

// =========================================================
// Preview (modo lectura)
// =========================================================

interface PreviewProps {
  profile: import('@shared/types/publicProfile').MyPublicProfileDto
  onEdit: () => void
}

function PublicProfilePreview({ profile, onEdit }: PreviewProps) {
  const hasUsername = !!profile.username
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {profile.isPublic ? (
                <Eye className="h-4 w-4 text-primary" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              Perfil público
              {!profile.isPublic && (
                <Badge variant="secondary" className="text-[10px]">
                  Privado
                </Badge>
              )}
              {profile.isPublic && (
                <Badge variant="outline" className="text-[10px] border-primary text-primary">
                  Público
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {profile.isPublic
                ? 'Así te ven otros usuarios cuando llegue la comunidad.'
                : 'Esta es una vista previa. Tu perfil está privado: nadie puede verlo todavía.'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasUsername && (
              <Button asChild variant="ghost" size="sm">
                <Link to={`/u/${profile.username}`}>
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Link>
              </Button>
            )}
            <Button onClick={onEdit} size="sm">
              <Pencil className="h-4 w-4" />
              {hasUsername ? 'Editar' : 'Configurar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasUsername ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center space-y-2">
            <Globe2 className="h-6 w-6 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">
              Todavía no configuraste tu perfil público
            </p>
            <p className="text-xs text-muted-foreground">
              Elegí un username y decidí qué querés mostrar. Podés cambiarlo
              cuando quieras.
            </p>
            <Button onClick={onEdit} size="sm" className="mt-2">
              <Pencil className="h-4 w-4" />
              Configurar perfil público
            </Button>
          </div>
        ) : (
          <PublicProfileView data={profile.preview} compact />
        )}
      </CardContent>
    </Card>
  )
}

// =========================================================
// Editor (modo edición)
// =========================================================

interface EditorProps {
  initial: import('@shared/types/publicProfile').MyPublicProfileDto
  onCancel: () => void
  onSaved: () => void
}

function PublicProfileEditor({ initial, onCancel, onSaved }: EditorProps) {
  const updateMut = useUpdatePublicProfile()
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const form = useForm<UpdatePublicProfileInput>({
    resolver: zodResolver(updatePublicProfileInputSchema),
    defaultValues: {
      username: initial.username ?? '',
      displayName: initial.displayName ?? '',
      avatarUrl: initial.avatarUrl ?? '',
      bio: initial.bio ?? '',
      coverImageUrl: initial.coverImageUrl ?? '',
      isPublic: initial.isPublic,
      showLevel: initial.showLevel,
      showStats: initial.showStats,
      showDominatedMovements: initial.showDominatedMovements,
      showSharedSpots: initial.showSharedSpots
    }
  })

  // Si el dueño cambia (logout/login mientras editás), reseteamos el form
  // al nuevo perfil para no escribir sobre la cuenta equivocada.
  useEffect(() => {
    form.reset({
      username: initial.username ?? '',
      displayName: initial.displayName ?? '',
      avatarUrl: initial.avatarUrl ?? '',
      bio: initial.bio ?? '',
      coverImageUrl: initial.coverImageUrl ?? '',
      isPublic: initial.isPublic,
      showLevel: initial.showLevel,
      showStats: initial.showStats,
      showDominatedMovements: initial.showDominatedMovements,
      showSharedSpots: initial.showSharedSpots
    })
  }, [initial.accountId, form, initial])

  const usernameValue = form.watch('username')
  const usernameChanged =
    usernameValue.length > 0 &&
    usernameValue.trim().toLowerCase() !== (initial.username ?? '')
  const usernameLooksValid =
    /^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/.test(usernameValue.trim().toLowerCase()) &&
    usernameValue.trim().length >= 3 &&
    usernameValue.trim().length <= 30
  const availabilityQ = useCheckUsernameAvailability(
    usernameValue.trim().toLowerCase(),
    usernameLooksValid && usernameChanged
  )

  async function onSubmit(values: UpdatePublicProfileInput) {
    try {
      await updateMut.mutateAsync(values)
      setSavedAt(Date.now())
      // Pequeña pausa para que el usuario vea el "Guardado" antes de
      // cerrar el editor.
      setTimeout(() => onSaved(), 350)
    } catch (e) {
      form.setError('root', {
        message: e instanceof Error ? e.message : String(e)
      })
    }
  }

  const rootError = form.formState.errors.root?.message
  const isPublic = form.watch('isPublic')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Editar perfil público
            </CardTitle>
            <CardDescription>
              Tu identidad y privacidad para la comunidad futura.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={updateMut.isPending}
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Identidad</h3>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="parkour_juancho"
                        autoComplete="off"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toLowerCase())
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Letras, números, guion y guion bajo. Entre 3 y 30
                      caracteres. Forma la URL pública /u/&lt;username&gt;.
                    </FormDescription>
                    <UsernameAvailabilityHint
                      changed={usernameChanged}
                      looksValid={usernameLooksValid}
                      loading={availabilityQ.isFetching}
                      available={availabilityQ.data?.available}
                      reason={availabilityQ.data?.reason}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre visible</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cómo querés que te llamen"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de avatar</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://…"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Si iniciaste con Google, se llenó con tu avatar de la
                      cuenta. Podés cambiarla acá.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de portada</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://…"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Una o dos frases sobre cómo entrenás."
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>Máximo 200 caracteres.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Privacidad</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Mientras tu perfil esté privado, nadie puede verlo en /u/.
                  Los toggles secundarios sólo aplican cuando el perfil es
                  público.
                </p>
              </div>
              <PrivacyToggle
                form={form}
                name="isPublic"
                title="Perfil público"
                description="Activá para que otros puedan ver tu perfil en /u/<username>."
                isMaster
              />
              <Separator />
              <PrivacyToggle
                form={form}
                name="showLevel"
                title="Mostrar nivel"
                description="Tu nivel técnico actual (beginner / base / intermediate)."
                disabled={!isPublic}
              />
              <PrivacyToggle
                form={form}
                name="showStats"
                title="Mostrar estadísticas"
                description="Sesiones finalizadas, XP total y movimientos masterizados."
                disabled={!isPublic}
              />
              <PrivacyToggle
                form={form}
                name="showDominatedMovements"
                title="Mostrar movimientos dominados"
                description="La lista de movimientos en estado mastered."
                disabled={!isPublic}
              />
              <PrivacyToggle
                form={form}
                name="showSharedSpots"
                title="Mostrar spots compartidos"
                description="Los spots que marcaste como públicos."
                disabled={!isPublic}
              />
            </div>

            {rootError && (
              <Alert variant="destructive">
                <AlertDescription>{rootError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={updateMut.isPending}>
                <Save className="h-4 w-4" />
                {updateMut.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={updateMut.isPending}
              >
                Cancelar
              </Button>
              {savedAt && !updateMut.isPending && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Guardado
                </span>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// =========================================================
// Helpers
// =========================================================

interface AvailabilityHintProps {
  changed: boolean
  looksValid: boolean
  loading?: boolean
  available?: boolean
  reason?: 'taken' | 'invalid'
}

function UsernameAvailabilityHint(props: AvailabilityHintProps) {
  if (!props.changed) return null
  if (!props.looksValid) return null
  if (props.loading) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Chequeando disponibilidad…
      </p>
    )
  }
  if (props.available) {
    return (
      <p className="text-xs text-primary flex items-center gap-1">
        <Check className="h-3 w-3" />
        Disponible
      </p>
    )
  }
  return (
    <p className="text-xs text-destructive flex items-center gap-1">
      <X className="h-3 w-3" />
      {props.reason === 'taken' ? 'Ya está en uso' : 'Formato inválido'}
    </p>
  )
}

interface PrivacyToggleProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any
  name:
    | 'isPublic'
    | 'showLevel'
    | 'showStats'
    | 'showDominatedMovements'
    | 'showSharedSpots'
  title: string
  description: string
  disabled?: boolean
  isMaster?: boolean
}

function PrivacyToggle({
  form,
  name,
  title,
  description,
  disabled,
  isMaster
}: PrivacyToggleProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-start gap-3 space-y-0">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
              disabled={disabled}
              className="mt-0.5"
            />
          </FormControl>
          <div className="space-y-0.5">
            <FormLabel className={isMaster ? 'text-sm font-semibold' : 'text-sm'}>
              {title}
            </FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
        </FormItem>
      )}
    />
  )
}
