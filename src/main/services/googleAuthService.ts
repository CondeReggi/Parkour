/**
 * Sign-in con Google usando Authorization Code Flow + PKCE + loopback
 * redirect, como recomienda RFC 8252 y la propia doc de Google para
 * apps nativas/desktop.
 *
 * Flujo:
 *  1. Generar code_verifier + code_challenge (PKCE) y state (CSRF).
 *  2. Levantar un HTTP server local en 127.0.0.1, puerto random.
 *  3. Construir la URL de autorización con redirect_uri al loopback.
 *  4. Abrir el navegador del SO con shell.openExternal.
 *  5. Esperar el callback (con timeout). Validar state.
 *  6. Cerrar el server. Intercambiar code por tokens en el endpoint
 *     de Google (con client_secret y code_verifier).
 *  7. Llamar userinfo para obtener email/name/picture.
 *  8. Persistir la cuenta y devolver el DTO seguro.
 *
 * El renderer NO ve client_id, client_secret, tokens ni redirect_uri.
 * Sólo invoca `auth:signInWithGoogle` y recibe el resultado.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { AddressInfo } from 'node:net'
import { randomBytes, createHash } from 'node:crypto'
import { shell } from 'electron'
import { userAccountRepository } from '../repositories/userAccount.repository'
import { settingsRepository } from '../repositories/settings.repository'
import { authService } from './authService'
import type {
  AuthAccountDto,
  SignInResultDto
} from '@shared/types/auth'

// =========================================================
// Constantes
// =========================================================

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo'

/** Scopes mínimos para identificar al usuario. */
const SCOPES = ['openid', 'email', 'profile']

/** Tiempo máximo que esperamos al callback antes de abortar. */
const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutos

// =========================================================
// PKCE / state helpers
// =========================================================

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function generateCodeVerifier(): string {
  // 32 bytes random → 43 chars base64url, dentro del rango RFC 7636.
  return base64UrlEncode(randomBytes(32))
}

function deriveCodeChallenge(verifier: string): string {
  return base64UrlEncode(createHash('sha256').update(verifier).digest())
}

function generateState(): string {
  return base64UrlEncode(randomBytes(16))
}

// =========================================================
// Configuración runtime
// =========================================================

interface GoogleAuthConfig {
  clientId: string
  clientSecret: string
}

/**
 * Lee la config desde variables de entorno. Faltar valores acá implica
 * que el usuario no configuró su .env todavía — devolvemos un error
 * legible en lugar de petar con undefined.
 */
function readConfig(): GoogleAuthConfig | { error: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return {
      error:
        'Falta configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el archivo .env. Ver README de auth.'
    }
  }
  return { clientId, clientSecret }
}

// =========================================================
// Loopback callback handler
// =========================================================

interface CallbackResult {
  code: string
  state: string
}

interface LoopbackServer {
  server: Server
  port: number
  /** Promise que resuelve con el primer callback recibido o rechaza por timeout/cancel. */
  waitForCallback: () => Promise<CallbackResult>
  close: () => void
}

/**
 * Crea un servidor HTTP escuchando en 127.0.0.1 con puerto random.
 * Resuelve cuando llega un GET a /auth/google/callback con code+state,
 * o rechaza al timeout.
 */
function startLoopbackServer(): Promise<LoopbackServer> {
  return new Promise((resolve, reject) => {
    let waiterResolve: ((value: CallbackResult) => void) | null = null
    let waiterReject: ((reason: Error) => void) | null = null
    let timeoutHandle: NodeJS.Timeout | null = null

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (!req.url) {
        res.writeHead(400)
        res.end('Bad request')
        return
      }
      // Construimos la URL completa: req.url es path+query.
      const fullUrl = new URL(req.url, `http://127.0.0.1`)
      if (fullUrl.pathname !== '/auth/google/callback') {
        res.writeHead(404)
        res.end('Not found')
        return
      }

      const code = fullUrl.searchParams.get('code')
      const state = fullUrl.searchParams.get('state')
      const errorParam = fullUrl.searchParams.get('error')

      // HTML "Sesión iniciada" para que el usuario sepa que ya puede
      // volver a la app. Usamos un estilo simple sin assets externos.
      const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Parkour App — Sesión iniciada</title>
<style>
  body { background: #09090B; color: #FAFAFA; font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .card { background: #111113; border: 1px solid #27272A; border-radius: 12px; padding: 32px 40px; max-width: 420px; text-align: center; }
  h1 { color: #F59E0B; margin: 0 0 8px; font-size: 20px; }
  p { color: #A1A1AA; font-size: 14px; line-height: 1.5; margin: 0; }
  .err h1 { color: #F87171; }
</style>
</head>
<body>
  <div class="card${errorParam || !code ? ' err' : ''}">
    ${
      errorParam
        ? `<h1>No pudimos iniciar sesión</h1><p>${errorParam}. Volvé a la app para intentar de nuevo.</p>`
        : code
          ? `<h1>Sesión iniciada</h1><p>Listo. Volvé a la app — podés cerrar esta pestaña.</p>`
          : `<h1>Sin código</h1><p>El callback llegó sin código de autorización. Volvé a la app y probá de nuevo.</p>`
    }
  </div>
</body>
</html>`

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)

      if (errorParam) {
        waiterReject?.(new Error(`Google devolvió error: ${errorParam}`))
        return
      }
      if (!code || !state) {
        waiterReject?.(new Error('El callback de Google llegó sin code o state.'))
        return
      }
      waiterResolve?.({ code, state })
    })

    server.on('error', (err) => {
      reject(err)
    })

    // Puerto 0 = el SO asigna uno libre.
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo
      const port = addr.port

      const close = (): void => {
        if (timeoutHandle) clearTimeout(timeoutHandle)
        server.close()
      }

      const waitForCallback = (): Promise<CallbackResult> => {
        return new Promise<CallbackResult>((res2, rej2) => {
          waiterResolve = (value) => {
            close()
            res2(value)
          }
          waiterReject = (reason) => {
            close()
            rej2(reason)
          }
          timeoutHandle = setTimeout(() => {
            close()
            rej2(new Error('Timeout esperando el callback de Google.'))
          }, CALLBACK_TIMEOUT_MS)
        })
      }

      resolve({ server, port, waitForCallback, close })
    })
  })
}

// =========================================================
// Token exchange + userinfo
// =========================================================

interface TokenResponse {
  access_token: string
  refresh_token?: string
  id_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
}

async function exchangeCodeForTokens(args: {
  config: GoogleAuthConfig
  code: string
  redirectUri: string
  codeVerifier: string
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code: args.code,
    client_id: args.config.clientId,
    client_secret: args.config.clientSecret,
    redirect_uri: args.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: args.codeVerifier
  })

  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(
      `Falló el intercambio de code por tokens (${resp.status}): ${text || resp.statusText}`
    )
  }
  return (await resp.json()) as TokenResponse
}

interface UserInfoResponse {
  sub: string
  email?: string
  name?: string
  picture?: string
  email_verified?: boolean
}

async function fetchUserInfo(accessToken: string): Promise<UserInfoResponse> {
  const resp = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(
      `Falló userinfo (${resp.status}): ${text || resp.statusText}`
    )
  }
  return (await resp.json()) as UserInfoResponse
}

// =========================================================
// API pública del servicio
// =========================================================

export const googleAuthService = {
  async signIn(): Promise<SignInResultDto> {
    const configOrError = readConfig()
    if ('error' in configOrError) {
      return { account: null, errorMessage: configOrError.error }
    }
    const config = configOrError

    // Una corrida → un servidor → un par PKCE → un state.
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = deriveCodeChallenge(codeVerifier)
    const state = generateState()

    let loopback: LoopbackServer
    try {
      loopback = await startLoopbackServer()
    } catch (e) {
      return {
        account: null,
        errorMessage:
          e instanceof Error
            ? `No se pudo levantar el servidor local: ${e.message}`
            : String(e)
      }
    }

    const redirectUri = `http://127.0.0.1:${loopback.port}/auth/google/callback`

    const authUrl = new URL(AUTH_ENDPOINT)
    authUrl.searchParams.set('client_id', config.clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', SCOPES.join(' '))
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    // access_type=offline + prompt=consent → refresh_token la primera vez.
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('include_granted_scopes', 'true')

    try {
      await shell.openExternal(authUrl.toString())
    } catch (e) {
      loopback.close()
      return {
        account: null,
        errorMessage:
          e instanceof Error
            ? `No se pudo abrir el navegador: ${e.message}`
            : String(e)
      }
    }

    let callback: CallbackResult
    try {
      callback = await loopback.waitForCallback()
    } catch (e) {
      // Cancelación del usuario o timeout — devolvemos null sin
      // marcar como error severo cuando es timeout, pero sí cuando es
      // un error explícito del provider.
      const msg = e instanceof Error ? e.message : String(e)
      return { account: null, errorMessage: msg }
    }

    // Validación de state — defensa CSRF.
    if (callback.state !== state) {
      return {
        account: null,
        errorMessage:
          'El parámetro `state` no coincide con el original. Cancelado por seguridad.'
      }
    }

    // Intercambio de code por tokens.
    let tokens: TokenResponse
    try {
      tokens = await exchangeCodeForTokens({
        config,
        code: callback.code,
        redirectUri,
        codeVerifier
      })
    } catch (e) {
      return {
        account: null,
        errorMessage: e instanceof Error ? e.message : String(e)
      }
    }

    // userinfo para obtener email/name/picture. Como pedimos scope
    // openid+profile+email, esto siempre responde con sub+email.
    let info: UserInfoResponse
    try {
      info = await fetchUserInfo(tokens.access_token)
    } catch (e) {
      return {
        account: null,
        errorMessage: e instanceof Error ? e.message : String(e)
      }
    }

    if (!info.email) {
      return {
        account: null,
        errorMessage:
          'Google no devolvió el email del usuario. Permitilo en el consentimiento.'
      }
    }

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null

    // Upserteamos la cuenta vinculándola al perfil activo si lo hay.
    const profileId = await settingsRepository.getActiveProfileId()
    const accountUpserted: AuthAccountDto =
      await userAccountRepository.upsertGoogleAccount(
        {
          providerUserId: info.sub,
          email: info.email,
          displayName: info.name ?? null,
          avatarUrl: info.picture ?? null,
          accessToken: tokens.access_token ?? null,
          refreshToken: tokens.refresh_token ?? null,
          idToken: tokens.id_token ?? null,
          expiresAt
        },
        profileId
      )

    // Creamos la sesión y la marcamos como activa.
    const started = await authService.startSessionForAccountId(
      accountUpserted.id
    )
    return { account: started.account }
  }
}
