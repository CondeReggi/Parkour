/**
 * Handlers IPC del namespace `movements:*`.
 * Cada channel name sigue el patrón `<feature>:<method>`.
 */

import { ipcMain } from 'electron'
import { movementRepository } from '../repositories/movement.repository'
import {
  getMovementBySlugInputSchema,
  setMovementProgressInputSchema
} from '@shared/schemas/movement.schemas'

export function registerMovementHandlers(): void {
  ipcMain.handle('movements:getAll', async () => {
    return movementRepository.getAll()
  })

  ipcMain.handle('movements:getBySlug', async (_evt, raw: unknown) => {
    const { slug } = getMovementBySlugInputSchema.parse(raw)
    return movementRepository.getBySlug(slug)
  })

  ipcMain.handle('movements:setProgress', async (_evt, raw: unknown) => {
    const input = setMovementProgressInputSchema.parse(raw)
    return movementRepository.setProgress(input)
  })

  ipcMain.handle('movements:recommendForActive', async () => {
    return movementRepository.getRecommendationsForActive()
  })
}
