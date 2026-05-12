import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AuthAccountDto,
  AuthStateDto,
  SignInResultDto
} from '@shared/types/auth'
import type {
  LoginInput,
  RegisterInput
} from '@shared/schemas/auth.schemas'

export const authKeys = {
  all: ['auth'] as const,
  state: () => [...authKeys.all, 'state'] as const
}

/**
 * Marca explícita de que el usuario eligió "Continuar sin cuenta" en la
 * pantalla de login. El AuthGuard la usa para distinguir "no decidió
 * todavía" (→ /login) de "eligió usar local" (→ dejar pasar).
 *
 * Vive en localStorage porque es preferencia del dispositivo, no de la
 * cuenta: si el usuario reinstala la app o limpia datos, vuelve a ver el
 * login. Lo setea useContinueLocal; lo limpian useLogout, useLogin,
 * useRegister y useSignInWithGoogle (cuando hubo cuenta).
 */
const LOCAL_FLAG_KEY = 'parkour:auth:choseLocal'

export function hasChosenLocalMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(LOCAL_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

function setLocalFlag(value: boolean) {
  if (typeof window === 'undefined') return
  try {
    if (value) window.localStorage.setItem(LOCAL_FLAG_KEY, '1')
    else window.localStorage.removeItem(LOCAL_FLAG_KEY)
  } catch {
    // ignore: localStorage puede no estar disponible en algunos entornos
  }
}

/**
 * Estado consolidado de auth. Devuelve siempre un objeto con:
 *   - mode: 'local' | 'authenticated'
 *   - account: cuenta actual o null
 *   - sessionId / sessionExpiresAt / sessionExpired
 *
 * Las páginas y componentes consumen `data.mode` o `data.account` para
 * decidir qué renderizar.
 */
export function useAuthState() {
  return useQuery<AuthStateDto>({
    queryKey: authKeys.state(),
    queryFn: () => window.parkourApi.auth.getState()
  })
}

/**
 * Acceso directo a la cuenta autenticada. Útil cuando sólo querés el
 * `account` y no el resto del state. Devuelve null en modo local.
 */
export function useAuthAccount() {
  const q = useAuthState()
  return {
    ...q,
    data: q.data?.account ?? null
  }
}

// =========================================================
// Mutaciones
// =========================================================

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: authKeys.all })
  // Otros features podrían depender de saber quién está logueado en el
  // futuro (publicaciones, perfiles públicos…). Por ahora con auth.all
  // alcanza.
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation<SignInResultDto, Error, RegisterInput>({
    mutationFn: (input) => window.parkourApi.auth.register(input),
    onSuccess: (result) => {
      if (result.account) setLocalFlag(false)
      invalidate(qc)
    }
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation<SignInResultDto, Error, LoginInput>({
    mutationFn: (input) => window.parkourApi.auth.login(input),
    onSuccess: (result) => {
      if (result.account) setLocalFlag(false)
      invalidate(qc)
    }
  })
}

export function useSignInWithGoogle() {
  const qc = useQueryClient()
  return useMutation<SignInResultDto, Error, void>({
    mutationFn: () => window.parkourApi.auth.signInWithGoogle(),
    onSuccess: (result) => {
      if (result.account) setLocalFlag(false)
      invalidate(qc)
    }
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => window.parkourApi.auth.logout(),
    onSuccess: () => {
      // Después de cerrar sesión queremos que el guard vuelva a empujar
      // al usuario a /login en su próxima navegación.
      setLocalFlag(false)
      invalidate(qc)
    }
  })
}

export function useContinueLocal() {
  const qc = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => window.parkourApi.auth.continueLocal(),
    onSuccess: () => {
      // Marca explícita: el usuario decidió usar la app sin cuenta. El
      // AuthGuard la usa para no volver a redirigir a /login.
      setLocalFlag(true)
      invalidate(qc)
    }
  })
}

export function useLinkCurrentProfile() {
  const qc = useQueryClient()
  return useMutation<AuthAccountDto | null, Error, void>({
    mutationFn: () => window.parkourApi.auth.linkCurrentProfile(),
    onSuccess: () => invalidate(qc)
  })
}
