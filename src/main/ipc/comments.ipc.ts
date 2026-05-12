import { ipcMain } from 'electron'
import {
  createCommentInputSchema,
  deleteCommentInputSchema,
  getCommentCountSchema,
  getCommentsByTargetSchema,
  updateCommentInputSchema
} from '@shared/schemas/comment.schemas'
import { commentRepository } from '../repositories/comment.repository'
import { authService } from '../services/authService'

/**
 * Handlers IPC del namespace `comments`. Polimórfico sobre Post/Spot/Movement.
 *
 * Permisos:
 *  - Listar y contar: cualquiera (incluso modo local).
 *  - Crear/Editar/Eliminar: requieren sesión activa. El handler tira
 *    error legible si no hay.
 */
export function registerCommentHandlers(): void {
  ipcMain.handle('comments:getByTarget', async (_evt, raw: unknown) => {
    const input = getCommentsByTargetSchema.parse(raw)
    const viewer = await authService.getCurrentAccountId()
    return commentRepository.getByTarget(input.target, viewer)
  })

  ipcMain.handle('comments:countByTarget', async (_evt, raw: unknown) => {
    const input = getCommentCountSchema.parse(raw)
    return commentRepository.countByTarget(input.target)
  })

  ipcMain.handle('comments:create', async (_evt, raw: unknown) => {
    const accountId = await authService.getCurrentAccountId()
    if (!accountId) {
      throw new Error('Para comentar necesitás iniciar sesión.')
    }
    const input = createCommentInputSchema.parse(raw)
    return commentRepository.create(input, accountId)
  })

  ipcMain.handle('comments:update', async (_evt, raw: unknown) => {
    const accountId = await authService.getCurrentAccountId()
    if (!accountId) {
      throw new Error('Necesitás iniciar sesión para editar un comentario.')
    }
    const input = updateCommentInputSchema.parse(raw)
    return commentRepository.update(input, accountId)
  })

  ipcMain.handle('comments:delete', async (_evt, raw: unknown) => {
    const accountId = await authService.getCurrentAccountId()
    if (!accountId) {
      throw new Error('Necesitás iniciar sesión para eliminar un comentario.')
    }
    const input = deleteCommentInputSchema.parse(raw)
    await commentRepository.softDelete(input.id, accountId)
  })
}
