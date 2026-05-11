/**
 * Backup y restore del archivo SQLite (parkour.db).
 *
 * Para SQLite con Prisma no hay un comando seguro de "swap en caliente":
 * el cliente cachea handles del archivo y reabrir mientras hay queries
 * volando es propenso a romperse. Por eso:
 *  - backup: copia binaria sin desconectar (SQLite tolera lecturas concurrentes).
 *  - restore: copiamos sobre el archivo activo y le decimos al usuario que
 *    debe reiniciar la app para que la nueva DB tome efecto.
 *
 * El path real del .db lo resolvemos vía app.getPath('userData') — la misma
 * convención de db/client.ts.
 */

import { app } from 'electron'
import { copyFile } from 'node:fs/promises'
import path from 'node:path'

function dbPath(): string {
  return path.join(app.getPath('userData'), 'parkour.db')
}

export async function backupDatabaseTo(targetPath: string): Promise<void> {
  await copyFile(dbPath(), targetPath)
}

export async function restoreDatabaseFrom(sourcePath: string): Promise<void> {
  await copyFile(sourcePath, dbPath())
}
