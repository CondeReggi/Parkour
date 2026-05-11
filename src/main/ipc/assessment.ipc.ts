import { ipcMain } from 'electron'
import { assessmentRepository } from '../repositories/assessment.repository'
import { createAssessmentInputSchema } from '@shared/schemas/assessment.schemas'

export function registerAssessmentHandlers(): void {
  ipcMain.handle('assessment:create', async (_evt, raw: unknown) => {
    const input = createAssessmentInputSchema.parse(raw)
    return assessmentRepository.createForActive(input)
  })

  ipcMain.handle('assessment:listForActive', async () => {
    return assessmentRepository.listForActive()
  })

  ipcMain.handle('assessment:latest', async () => {
    return assessmentRepository.latestForActive()
  })
}
