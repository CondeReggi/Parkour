import { ipcMain } from 'electron'
import { sessionRepository } from '../repositories/session.repository'
import {
  cancelSessionInputSchema,
  finalizeSessionInputSchema,
  getSessionByIdInputSchema,
  startSessionInputSchema
} from '@shared/schemas/session.schemas'

export function registerSessionHandlers(): void {
  ipcMain.handle('sessions:start', async (_evt, raw: unknown) => {
    const input = startSessionInputSchema.parse(raw)
    return sessionRepository.start(input)
  })

  ipcMain.handle('sessions:getActive', async () => {
    return sessionRepository.getActive()
  })

  ipcMain.handle('sessions:finalize', async (_evt, raw: unknown) => {
    const input = finalizeSessionInputSchema.parse(raw)
    return sessionRepository.finalize(input)
  })

  ipcMain.handle('sessions:cancel', async (_evt, raw: unknown) => {
    const { id } = cancelSessionInputSchema.parse(raw)
    await sessionRepository.cancel(id)
  })

  ipcMain.handle('sessions:listForActive', async () => {
    return sessionRepository.listForActive()
  })

  ipcMain.handle('sessions:getById', async (_evt, raw: unknown) => {
    const { id } = getSessionByIdInputSchema.parse(raw)
    return sessionRepository.getById(id)
  })

  ipcMain.handle('sessions:getStats', async () => {
    return sessionRepository.getStats()
  })
}
