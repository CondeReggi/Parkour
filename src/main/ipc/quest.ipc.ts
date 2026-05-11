import { ipcMain } from 'electron'
import { questRepository } from '../repositories/quest.repository'
import { claimQuestInputSchema } from '@shared/schemas/quest.schemas'

export function registerQuestHandlers(): void {
  ipcMain.handle('quests:listForActive', async () => {
    return questRepository.listForActive()
  })

  ipcMain.handle('quests:claim', async (_evt, raw: unknown) => {
    const { id } = claimQuestInputSchema.parse(raw)
    return questRepository.claimForActive(id)
  })
}
