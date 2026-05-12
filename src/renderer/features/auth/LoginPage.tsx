import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn, UserCircle2 } from 'lucide-react'
import {
  loginInputSchema,
  type LoginInput
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
  useLogin,
  useSignInWithGoogle
} from './hooks/useAuth'

/**
 * URL del doodle de la banana. Es un asset externo gratuito de Vecteezy.
 * Si la imagen no carga (offline o el host cae), el `onError` la oculta
 * y dejamos sólo el tagline.
 */
const BANANA_URL =
  'https://static.vecteezy.com/system/resources/previews/011/153/290/non_2x/oodle-freehand-sketch-drawing-of-banana-fruit-free-png.png'

export function LoginPage() {
  const navigate = useNavigate()
  const loginMut = useLogin()
  const googleMut = useSignInWithGoogle()
  const localMut = useContinueLocal()
  const [feedback, setFeedback] = useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: '', password: '' }
  })

  async function onSubmit(values: LoginInput) {
    setFeedback(null)
    const result = await loginMut.mutateAsync(values)
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
    loginMut.isPending || googleMut.isPending || localMut.isPending

  const bananaHero = (
    <div className="flex flex-col items-center gap-1">
      <img
        src={BANANA_URL}
        alt="Banana doodle"
        className="h-28 w-28 object-contain select-none drop-shadow-[0_4px_12px_rgba(245,158,11,0.25)] dark:invert-[0.06]"
        draggable={false}
        onError={(e) => {
          // Si la imagen no carga, la ocultamos sin romper el layout.
          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
        }}
      />
      <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">
        Conectate, dale
      </p>
    </div>
  )

  return (
    <MotionPage>
      <AuthShell
        title="Iniciar sesión"
        subtitle="Entrá para guardar tu progreso y preparar tu comunidad de entrenamiento."
        hero={bananaHero}
        footer={
          <>
            ¿No tenés cuenta?{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              Crear cuenta
            </Link>
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      autoComplete="current-password"
                      placeholder="••••••••"
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
              <LogIn className="h-4 w-4" />
              {loginMut.isPending ? 'Entrando…' : 'Entrar'}
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
          label="Entrar con Google"
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
          Vas a usar la app en este dispositivo. Tus datos quedan locales y
          podés vincularlos a una cuenta más adelante.
        </p>
      </AuthShell>
    </MotionPage>
  )
}
