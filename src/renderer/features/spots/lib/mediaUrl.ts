/**
 * Espejo del helper del main para construir URLs del protocolo
 * parkour-media:// que sirven fotos de spots desde la DB.
 */
export function spotPhotoMediaUrl(photoId: string): string {
  return `parkour-media://spot-photo/${encodeURIComponent(photoId)}`
}
