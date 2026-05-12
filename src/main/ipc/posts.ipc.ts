import { ipcMain } from 'electron'
import {
  createPostInputSchema,
  deletePostInputSchema,
  getByAuthorInputSchema,
  getFeedInputSchema,
  getPostByIdInputSchema,
  updatePostInputSchema
} from '@shared/schemas/post.schemas'
import { postRepository } from '../repositories/post.repository'
import { authService } from '../services/authService'

/**
 * Handlers IPC del namespace `posts`.
 *
 * Permisos:
 *  - getFeed / getById / getByAuthor: cualquiera puede llamarlos. El
 *    repo aplica filtros de visibility/status para tapar lo privado.
 *  - getMine: requiere sesión activa. Si no hay, devolvemos [].
 *  - create / update / delete: requieren sesión activa; sin sesión,
 *    el handler tira error con mensaje legible.
 */
export function registerPostHandlers(): void {
  ipcMain.handle('posts:getFeed', async (_evt, raw: unknown) => {
    const input = getFeedInputSchema.parse(raw)
    const viewer = await authService.getCurrentAccountId()
    return postRepository.getFeed(input, viewer)
  })

  ipcMain.handle('posts:getMine', async () => {
    const viewer = await authService.getCurrentAccountId()
    if (!viewer) return []
    return postRepository.getMine(viewer)
  })

  ipcMain.handle('posts:getById', async (_evt, raw: unknown) => {
    const input = getPostByIdInputSchema.parse(raw)
    const viewer = await authService.getCurrentAccountId()
    return postRepository.getById(input.id, viewer)
  })

  ipcMain.handle('posts:getByAuthor', async (_evt, raw: unknown) => {
    const input = getByAuthorInputSchema.parse(raw)
    const viewer = await authService.getCurrentAccountId()
    return postRepository.getByAuthor(
      input.authorAccountId,
      input.limit ?? 50,
      viewer
    )
  })

  ipcMain.handle('posts:create', async (_evt, raw: unknown) => {
    const authorAccountId = await authService.getCurrentAccountId()
    if (!authorAccountId) {
      throw new Error('Necesitás iniciar sesión para publicar.')
    }
    const input = createPostInputSchema.parse(raw)
    return postRepository.create(input, authorAccountId)
  })

  ipcMain.handle('posts:update', async (_evt, raw: unknown) => {
    const requesterAccountId = await authService.getCurrentAccountId()
    if (!requesterAccountId) {
      throw new Error('Necesitás iniciar sesión para editar un post.')
    }
    const input = updatePostInputSchema.parse(raw)
    return postRepository.update(input, requesterAccountId)
  })

  ipcMain.handle('posts:delete', async (_evt, raw: unknown) => {
    const requesterAccountId = await authService.getCurrentAccountId()
    if (!requesterAccountId) {
      throw new Error('Necesitás iniciar sesión para eliminar un post.')
    }
    const input = deletePostInputSchema.parse(raw)
    await postRepository.softDelete(input.id, requesterAccountId)
  })
}
