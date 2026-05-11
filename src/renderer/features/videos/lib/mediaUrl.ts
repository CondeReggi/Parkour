/**
 * Construye la URL del protocolo custom registrado en main/protocol/parkourMedia.ts.
 * Es un espejo intencional del helper del main: el renderer no debería
 * importar nada del main, así que duplicamos los 3 caracteres de scheme.
 */
export function videoMediaUrl(videoId: string): string {
  return `parkour-media://video/${encodeURIComponent(videoId)}`
}
