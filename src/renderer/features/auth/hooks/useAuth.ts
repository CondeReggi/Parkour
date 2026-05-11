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
    onSuccess: () => invalidate(qc)
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation<SignInResultDto, Error, LoginInput>({
    mutationFn: (input) => window.parkourApi.auth.login(input),
    onSuccess: () => invalidate(qc)
  })
}

export function useSignInWithGoogle() {
  const qc = useQueryClient()
  return useMutation<SignInResultDto, Error, void>({
    mutationFn: () => window.parkourApi.auth.signInWithGoogle(),
    onSuccess: () => invalidate(qc)
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => window.parkourApi.auth.logout(),
    onSuccess: () => invalidate(qc)
  })
}

export function useContinueLocal() {
  const qc = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => window.parkourApi.auth.continueLocal(),
    onSuccess: () => invalidate(qc)
  })
}

export function useLinkCurrentProfile() {
  const qc = useQueryClient()
  return useMutation<AuthAccountDto | null, Error, void>({
    mutationFn: () => window.parkourApi.auth.linkCurrentProfile(),
    onSuccess: () => invalidate(qc)
  })
}
