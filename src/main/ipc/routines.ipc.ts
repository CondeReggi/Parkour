import { ipcMain } from 'electron'
import { z } from 'zod'
import { routineRepository } from '../repositories/routine.repository'

const slugInputSchema = z.object({ slug: z.string().min(1) })

export function registerRoutineHandlers(): void {
  ipcMain.handle('routines:getAll', async () => {
    return routineRepository.getAll()
  })

  ipcMain.handle('routines:getBySlug', async (_evt, raw: unknown) => {
    const { slug } = slugInputSchema.parse(raw)
    return routineRepository.getBySlug(slug)
  })

  ipcMain.handle('routines:recommendForActive', async () => {
    return routineRepository.recommendForActive()
  })
}
