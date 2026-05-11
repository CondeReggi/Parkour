/**
 * Protocolo custom parkour-media:// para servir archivos locales al renderer.
 *
 * Razón: el renderer corre con contextIsolation y no puede leer rutas
 * absolutas del disco. Si las pasáramos directo a un <video src="file://...">
 * o <img src="file://..."> además expondríamos la ruta real al DOM. Este
 * protocolo recibe una URL opaca tipo parkour-media://<kind>/<id> y resuelve
 * el path desde la DB, de modo que sólo se sirven archivos referenciados
 * por una entrada existente.
 *
 * Hosts soportados:
 *  - video        → VideoEntry.filePath
 *  - spot-photo   → SpotPhoto.filePath
 *
 * Llamar registerParkourMediaProtocol() ANTES de createMainWindow() para que
 * el navegador del renderer ya tenga el handler registrado al cargar.
 */

import { protocol, net } from 'electron'
import { pathToFileURL } from 'node:url'
import { videoRepository } from '../repositories/video.repository'
import { spotRepository } from '../repositories/spot.repository'

export const PARKOUR_MEDIA_SCHEME = 'parkour-media'

/**
 * Permite que el scheme se trate como uno con privilegios estándar
 * (CORS, fetch, streaming). Debe llamarse antes de app.whenReady().
 */
export function registerParkourMediaPrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PARKOUR_MEDIA_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        bypassCSP: false
      }
    }
  ])
}

async function resolveFilePath(host: string, id: string): Promise<string | null> {
  if (host === 'video') {
    return videoRepository.getFilePath(id)
  }
  if (host === 'spot-photo') {
    return spotRepository.getPhotoFilePath(id)
  }
  return null
}

export function registerParkourMediaProtocol(): void {
  protocol.handle(PARKOUR_MEDIA_SCHEME, async (request) => {
    try {
      const url = new URL(request.url)
      const host = url.host
      const id = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
      if (!id) return new Response('Bad request', { status: 400 })

      const filePath = await resolveFilePath(host, id)
      if (!filePath) {
        return new Response('Not found', { status: 404 })
      }

      // net.fetch sobre file:// soporta Range requests (necesario para seek
      // en <video>) sin que tengamos que implementar streaming a mano. Para
      // imágenes hace exactamente lo que esperás del <img>.
      return net.fetch(pathToFileURL(filePath).toString())
    } catch (error) {
      console.error('[parkour-media] error serving request:', error)
      return new Response('Internal error', { status: 500 })
    }
  })
}

/** Helper para que el renderer construya URLs canónicas de video. */
export function videoMediaUrl(videoId: string): string {
  return `${PARKOUR_MEDIA_SCHEME}://video/${encodeURIComponent(videoId)}`
}

/** Helper para que el renderer construya URLs canónicas de fotos de spot. */
export function spotPhotoMediaUrl(photoId: string): string {
  return `${PARKOUR_MEDIA_SCHEME}://spot-photo/${encodeURIComponent(photoId)}`
}
