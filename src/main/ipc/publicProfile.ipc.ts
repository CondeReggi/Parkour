import { ipcMain } from 'electron'
import {
  checkUsernameInputSchema,
  getByUsernameInputSchema,
  setPrivacyInputSchema,
  updatePublicProfileInputSchema
} from '@shared/schemas/publicProfile.schemas'
import { publicProfileRepository } from '../repositories/publicProfile.repository'
import { authService } from '../services/authService'

/**
 * Handlers IPC del namespace `publicProfile`.
 *
 * Todas las operaciones que tocan "mi" perfil requieren sesión activa
 * (resolvemos vía authService.getCurrentAccountId). Si no hay sesión,
 * devolvemos null en lugar de tirar — la UI lo interpreta como "no se
 * puede editar todavía".
 *
 * `getByUsername` es pública: cualquier usuario logueado o en modo
 * local puede consultarla. Devuelve un DTO discriminado por visibility,
 * así la UI no tiene que inferir el caso privado / no encontrado.
 */
export function registerPublicProfileHandlers(): void {
  ipcMain.handle('publicProfile:getMine', async () => {
    const accountId = await authService.getCurrentAccountId()
    if (!accountId) return null
    return publicProfileRepository.getMine(accountId)
  })

  ipcMain.handle('publicProfile:upsertMine', async (_evt, raw: unknown) => {
    const accountId = await authService.getCurrentAccountId()
    if (!accountId) {
      throw new Error('Necesitás iniciar sesión para editar tu perfil público.')
    }
    const input = updatePublicProfileInputSchema.parse(raw)
    return publicProfileRepository.upsertMine(accountId, input)
  })

  ipcMain.handle(
    'publicProfile:checkUsernameAvailability',
    async (_evt, raw: unknown) => {
      const accountId = await authService.getCurrentAccountId()
      const input = checkUsernameInputSchema.parse(raw)
      return publicProfileRepository.checkUsernameAvailability(
        accountId,
        input.username
      )
    }
  )

  ipcMain.handle('publicProfile:getByUsername', async (_evt, raw: unknown) => {
    const input = getByUsernameInputSchema.parse(raw)
    return publicProfileRepository.getByUsername(input.username)
  })

  ipcMain.handle('publicProfile:setPrivacy', async (_evt, raw: unknown) => {
    const accountId = await authService.getCurrentAccountId()
    if (!accountId) {
      throw new Error(
        'Necesitás iniciar sesión para cambiar la privacidad de tu perfil.'
      )
    }
    const input = setPrivacyInputSchema.parse(raw)
    return publicProfileRepository.setPrivacy(accountId, input)
  })
}
