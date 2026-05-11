import { ipcMain } from 'electron'
import {
  loginInputSchema,
  registerInputSchema
} from '@shared/schemas/auth.schemas'
import { authService } from '../services/authService'
import { googleAuthService } from '../services/googleAuthService'

/**
 * Handlers IPC del namespace `auth`. Todos validan con Zod antes de
 * tocar el servicio.
 *
 * Convención: los handlers que pueden fallar de forma "limpia"
 * (credenciales malas, cancelación de OAuth, etc.) devuelven un objeto
 * `{ account, errorMessage? }`. Los errores inesperados se lanzan y
 * el renderer los recibe como Error normal.
 */
export function registerAuthHandlers(): void {
  ipcMain.handle('auth:getState', async () => {
    return authService.getState()
  })

  ipcMain.handle('auth:register', async (_evt, raw: unknown) => {
    const input = registerInputSchema.parse(raw)
    return authService.register(input)
  })

  ipcMain.handle('auth:login', async (_evt, raw: unknown) => {
    const input = loginInputSchema.parse(raw)
    return authService.login(input)
  })

  ipcMain.handle('auth:signInWithGoogle', async () => {
    return googleAuthService.signIn()
  })

  ipcMain.handle('auth:logout', async () => {
    await authService.logout()
  })

  ipcMain.handle('auth:continueLocal', async () => {
    await authService.continueLocal()
  })

  ipcMain.handle('auth:linkCurrentProfile', async () => {
    return authService.linkCurrentProfile()
  })
}
