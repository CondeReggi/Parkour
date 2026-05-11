import { ipcMain } from 'electron'
import { z } from 'zod'
import { profileRepository } from '../repositories/profile.repository'
import { injuryRepository } from '../repositories/injury.repository'
import {
  createProfileInputSchema,
  updateProfileInputSchema
} from '@shared/schemas/profile.schemas'
import {
  addInjuryInputSchema,
  deleteInjuryInputSchema,
  updateInjuryInputSchema
} from '@shared/schemas/injury.schemas'

export function registerProfileHandlers(): void {
  ipcMain.handle('profile:getActive', async () => {
    return profileRepository.getActive()
  })

  ipcMain.handle('profile:create', async (_evt, raw: unknown) => {
    const input = createProfileInputSchema.parse(raw)
    return profileRepository.create(input)
  })

  ipcMain.handle('profile:update', async (_evt, raw: unknown) => {
    const input = updateProfileInputSchema.parse(raw)
    return profileRepository.update(input)
  })

  ipcMain.handle('profile:addInjury', async (_evt, raw: unknown) => {
    const input = addInjuryInputSchema.parse(raw)
    return injuryRepository.add(input)
  })

  ipcMain.handle('profile:updateInjury', async (_evt, raw: unknown) => {
    const input = updateInjuryInputSchema.parse(raw)
    return injuryRepository.update(input)
  })

  ipcMain.handle('profile:deleteInjury', async (_evt, raw: unknown) => {
    const { id } = deleteInjuryInputSchema.parse(raw)
    await injuryRepository.remove(id)
  })

  // Útil para debugging desde DevTools del renderer.
  ipcMain.handle('profile:_validatePing', async (_evt, raw: unknown) => {
    return z.string().parse(raw)
  })
}
