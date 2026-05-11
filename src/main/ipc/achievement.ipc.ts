import { ipcMain } from 'electron'
import { achievementRepository } from '../repositories/achievement.repository'

export function registerAchievementHandlers(): void {
  ipcMain.handle('achievements:listForActive', async () => {
    return achievementRepository.listForActive()
  })

  ipcMain.handle('achievements:recentForActive', async () => {
    return achievementRepository.recentForActive(3)
  })
}
