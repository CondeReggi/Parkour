import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserCircle2, UserPlus } from 'lucide-react'
import {
  registerInputSchema,
  type RegisterInput
} from '@shared/schemas/auth.schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { MotionPage } from '@/components/motion/MotionPage'
import { AuthShell } from './components/AuthShell'
import { GoogleSignInButton } from './components/GoogleSignInButton'
import {
  useContinueLocal,
  useRegister,
  useSignInWithGoogle
} from './hooks/useAuth'

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMut = useRegister()
  const googleMut = useSignInWithGoogle()
  const localMut = useContinueLocal()
  const [feedback, setFeedback] = useState<string | null>(null)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  async function onSubmit(values: RegisterInput) {
    setFeedback(null)
    const result = await registerMut.mutateAsync(values)
    if (result.account) {
      navigate('/dashboard')
    } else if (result.errorMessage) {
      setFeedback(result.errorMessage)
    }
  }

  async function handleGoogle() {
    setFeedback(null)
    const result = await googleMut.mutateAsync()
    if (result.account) {
      navigate('/dashboard')
    } else if (result.errorMessage) {
      setFeedback(result.errorMessage)
    }
  }

  async function handleContinueLocal() {
    setFeedback(null)
    await localMut.mutateAsync()
    navigate('/dashboard')
  }

  const submitting =
    registerMut.isPending || googleMut.isPending || localMut.isPending

  return (
    <MotionPage>
      <AuthShell
        title="Crear cuenta"
        subtitle="Reservá tu nombre y tu mail para cuando llegue la sincronización y la comunidad."
        footer={
          <>
            ¿Ya tenés cuenta?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Iniciar sesión
            </Link>
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre visible</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="tu@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repetí la contraseña"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {feedback && (
              <Alert variant="destructive">
                <AlertDescription>{feedback}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              <UserPlus className="h-4 w-4" />
              {registerMut.isPending ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </form>
        </Form>

        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            o
          </span>
          <Separator className="flex-1" />
        </div>

        <GoogleSignInButton
          onClick={handleGoogle}
          loading={googleMut.isPending}
          className="w-full"
          label="Crear cuenta con Google"
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-muted-foreground hover:text-foreground"
          onClick={handleContinueLocal}
          disabled={submitting}
        >
          <UserCircle2 className="h-4 w-4" />
          {localMut.isPending ? 'Entrando…' : 'Continuar sin cuenta'}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center mt-2 leading-snug">
          Tus datos quedan locales y podés crear la cuenta más adelante
          desde Configuración.
        </p>
      </AuthShell>
    </MotionPage>
  )
}
