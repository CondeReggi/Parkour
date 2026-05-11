import { dialog, ipcMain } from 'electron'
import { basename } from 'node:path'
import { videoRepository } from '../repositories/video.repository'
import {
  createVideoInputSchema,
  deleteVideoInputSchema,
  getVideoByIdInputSchema,
  updateVideoInputSchema
} from '@shared/schemas/video.schemas'
import type { PickedVideo } from '@shared/types/video'

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi']

export function registerVideoHandlers(): void {
  ipcMain.handle('videos:getAll', async () => {
    return videoRepository.getAll()
  })

  ipcMain.handle('videos:getById', async (_evt, raw: unknown) => {
    const { id } = getVideoByIdInputSchema.parse(raw)
    return videoRepository.getById(id)
  })

  ipcMain.handle('videos:create', async (_evt, raw: unknown) => {
    const input = createVideoInputSchema.parse(raw)
    return videoRepository.create(input)
  })

  ipcMain.handle('videos:update', async (_evt, raw: unknown) => {
    const input = updateVideoInputSchema.parse(raw)
    return videoRepository.update(input)
  })

  ipcMain.handle('videos:delete', async (_evt, raw: unknown) => {
    const { id } = deleteVideoInputSchema.parse(raw)
    await videoRepository.remove(id)
  })

  ipcMain.handle('videos:pickFile', async (): Promise<PickedVideo | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Elegí un video',
      properties: ['openFile'],
      filters: [
        { name: 'Video', extensions: VIDEO_EXTENSIONS },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    })
    const filePath = result.filePaths[0]
    if (result.canceled || !filePath) return null
    return { filePath, fileName: basename(filePath) }
  })
}
