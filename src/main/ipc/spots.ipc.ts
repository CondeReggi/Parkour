import { dialog, ipcMain } from 'electron'
import { spotRepository } from '../repositories/spot.repository'
import {
  addObstacleInputSchema,
  addSpotPhotoInputSchema,
  createSpotInputSchema,
  deleteObstacleInputSchema,
  deleteSpotInputSchema,
  deleteSpotPhotoInputSchema,
  getSpotByIdInputSchema,
  setIdealMovementsInputSchema,
  setObstacleMovementsInputSchema,
  setSpotFavoriteInputSchema,
  updateObstacleInputSchema,
  updateSpotInputSchema,
  updateSpotPhotoInputSchema
} from '@shared/schemas/spot.schemas'
import type { PickedSpotPhoto } from '@shared/types/spot'

export function registerSpotHandlers(): void {
  ipcMain.handle('spots:getAll', async () => {
    return spotRepository.getAll()
  })

  ipcMain.handle('spots:getById', async (_evt, raw: unknown) => {
    const { id } = getSpotByIdInputSchema.parse(raw)
    return spotRepository.getById(id)
  })

  ipcMain.handle('spots:create', async (_evt, raw: unknown) => {
    const input = createSpotInputSchema.parse(raw)
    return spotRepository.create(input)
  })

  ipcMain.handle('spots:update', async (_evt, raw: unknown) => {
    const input = updateSpotInputSchema.parse(raw)
    return spotRepository.update(input)
  })

  ipcMain.handle('spots:delete', async (_evt, raw: unknown) => {
    const { id } = deleteSpotInputSchema.parse(raw)
    await spotRepository.remove(id)
  })

  ipcMain.handle('spots:setFavorite', async (_evt, raw: unknown) => {
    const input = setSpotFavoriteInputSchema.parse(raw)
    return spotRepository.setFavorite(input.id, input.isFavorite)
  })

  ipcMain.handle('spots:addObstacle', async (_evt, raw: unknown) => {
    const input = addObstacleInputSchema.parse(raw)
    return spotRepository.addObstacle(input)
  })

  ipcMain.handle('spots:updateObstacle', async (_evt, raw: unknown) => {
    const input = updateObstacleInputSchema.parse(raw)
    return spotRepository.updateObstacle(input)
  })

  ipcMain.handle('spots:deleteObstacle', async (_evt, raw: unknown) => {
    const { id } = deleteObstacleInputSchema.parse(raw)
    await spotRepository.removeObstacle(id)
  })

  ipcMain.handle('spots:setObstacleMovements', async (_evt, raw: unknown) => {
    const input = setObstacleMovementsInputSchema.parse(raw)
    return spotRepository.setObstacleMovements(input)
  })

  ipcMain.handle('spots:setIdealMovements', async (_evt, raw: unknown) => {
    const input = setIdealMovementsInputSchema.parse(raw)
    return spotRepository.setIdealMovements(input)
  })

  // === Photos ===

  ipcMain.handle('spots:addPhoto', async (_evt, raw: unknown) => {
    const input = addSpotPhotoInputSchema.parse(raw)
    return spotRepository.addPhoto(input)
  })

  ipcMain.handle('spots:updatePhoto', async (_evt, raw: unknown) => {
    const input = updateSpotPhotoInputSchema.parse(raw)
    return spotRepository.updatePhoto(input)
  })

  ipcMain.handle('spots:deletePhoto', async (_evt, raw: unknown) => {
    const { id } = deleteSpotPhotoInputSchema.parse(raw)
    await spotRepository.removePhoto(id)
  })

  ipcMain.handle('spots:pickPhoto', async (): Promise<PickedSpotPhoto | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Elegí una foto',
      properties: ['openFile'],
      filters: [
        {
          name: 'Imágenes',
          extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif']
        }
      ]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    if (!filePath) return null
    const parts = filePath.split(/[\\/]/)
    const fileName = parts[parts.length - 1] ?? filePath
    return { filePath, fileName }
  })
}
