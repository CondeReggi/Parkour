import { ipcMain } from 'electron'
import { progressInsightsRepository } from '../repositories/progressInsights.repository'

export function registerProgressHandlers(): void {
  ipcMain.handle('progress:getInsights', async () => {
    return progressInsightsRepository.getForActive()
  })
}
