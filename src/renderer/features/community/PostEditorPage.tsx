import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, ShieldAlert } from 'lucide-react'
import {
  createPostInputSchema,
  type PostFormValues
} from '@shared/schemas/post.schemas'
import { POST_TYPE_OPTIONS } from '@shared/types/post'
import { MotionPage } from '@/components/motion/MotionPage'
import { PageHeader } from '@/components/PageHeader'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { useAuthState } from '@/features/auth/hooks/useAuth'
import { VisibilitySelector } from '@/features/sharing/components/VisibilitySelector'
import {
  useCreatePost,
  usePost,
  useUpdatePost
} from './hooks/usePosts'
import { RelatedContentPicker } from './components/RelatedContentPicker'

const defaultValues: PostFormValues = {
  title: '',
  body: '',
  type: 'general',
  visibility: 'public',
  relatedMovementId: null,
  relatedSpotId: null,
  relatedRoutineId: null,
  relatedVideoId: null,
  relatedSessionId: null
}

export function PostEditorPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const existingQ = usePost(id)
  const createMut = useCreatePost()
  const updateMut = useUpdatePost()
  const navigate = useNavigate()
  const { data: state } = useAuthState()
  const isLocal = state?.mode !== 'authenticated'

  const form = useForm<PostFormValues>({
    resolver: zodResolver(createPostInputSchema),
    defaultValues
  })

  useEffect(() => {
    if (isEdit && existingQ.data) {
      form.reset({
        title: existingQ.data.title,
        body: existingQ.data.body,
        type: existingQ.data.type,
        visibility: existingQ.data.visibility,
        relatedMovementId: existingQ.data.relatedMovement?.id ?? null,
        relatedSpotId: existingQ.data.relatedSpot?.id ?? null,
        relatedRoutineId: existingQ.data.relatedRoutine?.id ?? null,
        relatedVideoId: existingQ.data.relatedVideo?.id ?? null,
        relatedSessionId: existingQ.data.relatedSession?.id ?? null
      })
    }
  }, [isEdit, existingQ.data, form])

  async function onSubmit(values: PostFormValues) {
    try {
      if (isEdit && id) {
        await updateMut.mutateAsync({ id, ...values })
        navigate(`/community/posts/${id}`)
      } else {
        const created = await createMut.mutateAsync(values)
        navigate(`/community/posts/${created.id}`)
      }
    } catch (e) {
      form.setError('root', {
        message: e instanceof Error ? e.message : String(e)
      })
    }
  }

  // En modo local, no permitimos crear ni editar.
  if (isLocal) {
    return (
      <MotionPage className="px-8 py-6 max-w-3xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/community">
            <ArrowLeft className="h-4 w-4" />
            Volver al feed
          </Link>
        </Button>
        <PageHeader title={isEdit ? 'Editar publicación' : 'Nueva publicación'} />
        <Alert variant="default" className="border-amber-500/30">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Estás usando la app en modo local. Para publicar necesitás iniciar
            sesión.
          </AlertDescription>
        </Alert>
        <Button asChild size="sm">
          <Link to="/login">Iniciar sesión</Link>
        </Button>
      </MotionPage>
    )
  }

  // En edición: si el post no se cargó o no soy el autor, mostramos un error.
  if (isEdit && existingQ.isLoading) {
    return (
      <MotionPage className="px-8 py-6 max-w-3xl">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </MotionPage>
    )
  }
  if (isEdit && (!existingQ.data || !existingQ.data.isOwnedByCurrentUser)) {
    return (
      <MotionPage className="px-8 py-6 max-w-3xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/community">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            No tenés permiso para editar esta publicación o ya no existe.
          </AlertDescription>
        </Alert>
      </MotionPage>
    )
  }

  const rootError = form.formState.errors.root?.message
  const visibility = form.watch('visibility')
  const isPending = createMut.isPending || updateMut.isPending

  return (
    <MotionPage className="px-8 py-6 max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to={isEdit && id ? `/community/posts/${id}` : '/community'}>
          <ArrowLeft className="h-4 w-4" />
          {isEdit ? 'Volver al post' : 'Volver al feed'}
        </Link>
      </Button>

      <PageHeader
        title={isEdit ? 'Editar publicación' : 'Nueva publicación'}
        description={
          isEdit
            ? 'Cambiá el contenido, tipo, visibilidad o el contenido relacionado.'
            : 'Compartí algo con la comunidad: una pregunta, un avance, un consejo, un logro.'
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contenido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Una frase clara y corta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuerpo</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={8}
                        placeholder="Contá lo que querés compartir."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Hasta 5000 caracteres.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POST_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {POST_TYPE_OPTIONS.find((o) => o.value === field.value)
                        ?.description ?? ''}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <VisibilitySelector
                    value={field.value}
                    onChange={field.onChange}
                    label="Quién puede ver este post"
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contenido relacionado</CardTitle>
            </CardHeader>
            <CardContent>
              <RelatedContentPicker
                movementId={form.watch('relatedMovementId')}
                spotId={form.watch('relatedSpotId')}
                routineId={form.watch('relatedRoutineId')}
                videoId={form.watch('relatedVideoId')}
                onChange={(next) => {
                  if ('movementId' in next) {
                    form.setValue('relatedMovementId', next.movementId ?? null, {
                      shouldDirty: true
                    })
                  }
                  if ('spotId' in next) {
                    form.setValue('relatedSpotId', next.spotId ?? null, {
                      shouldDirty: true
                    })
                  }
                  if ('routineId' in next) {
                    form.setValue('relatedRoutineId', next.routineId ?? null, {
                      shouldDirty: true
                    })
                  }
                  if ('videoId' in next) {
                    form.setValue('relatedVideoId', next.videoId ?? null, {
                      shouldDirty: true
                    })
                  }
                }}
                postVisibility={visibility}
              />
            </CardContent>
          </Card>

          {rootError && (
            <Alert variant="destructive">
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4" />
              {isPending
                ? 'Guardando…'
                : isEdit
                  ? 'Guardar cambios'
                  : 'Publicar'}
            </Button>
            <Button asChild variant="ghost">
              <Link to={isEdit && id ? `/community/posts/${id}` : '/community'}>
                Cancelar
              </Link>
            </Button>
          </div>
        </form>
      </Form>
    </MotionPage>
  )
}
