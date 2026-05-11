import { ipcMain } from 'electron'
import { xpEventRepository } from '../repositories/xpEvent.repository'

export function registerGamificationHandlers(): void {
  ipcMain.handle('gamification:getState', async () => {
    return xpEventRepository.getStateForActive()
  })

  ipcMain.handle('gamification:listEvents', async () => {
    return xpEventRepository.listEventsForActive()
  })

  ipcMain.handle('gamification:getBreakdown', async () => {
    return xpEventRepository.getBreakdownForActive()
  })
}
