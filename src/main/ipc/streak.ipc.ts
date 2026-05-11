import { ipcMain } from 'electron'
import { streakRepository } from '../repositories/streak.repository'
import { achievementRepository } from '../repositories/achievement.repository'
import { markActiveRecoveryInputSchema } from '@shared/schemas/streak.schemas'

export function registerStreakHandlers(): void {
  ipcMain.handle('streak:getState', async () => {
    return streakRepository.getStateForActive()
  })

  ipcMain.handle('streak:markActiveRecovery', async (_evt, raw: unknown) => {
    const input = markActiveRecoveryInputSchema.parse(raw ?? {})
    const result = await streakRepository.markActiveRecoveryForActive(input)
    // Marcar recuperación puede mover la racha y disparar logros como
    // "tres días seguidos" si se basan en streak inteligente.
    await achievementRepository.evaluateAndUnlockForActive()
    return result
  })
}
