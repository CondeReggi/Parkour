/**
 * Singleton de PrismaClient para el proceso main.
 *
 * Resuelve la URL de SQLite hacia app.getPath('userData')/parkour.db
 * y se la pasa a Prisma vía datasourceUrl. Esto evita depender del
 * .env (que sólo es usado por la CLI de Prisma).
 *
 * Garantizamos que la carpeta exista antes de instanciar el cliente.
 */

import { app } from 'electron'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

function resolveDatabaseUrl(): string {
  const userDataDir = app.getPath('userData')
  mkdirSync(userDataDir, { recursive: true })
  const dbPath = path.join(userDataDir, 'parkour.db')
  return 'file:' + dbPath.replace(/\\/g, '/')
}

const dbUrl = resolveDatabaseUrl()
console.log(`[main] Prisma DB URL: ${dbUrl}`)

export const prisma = new PrismaClient({
  datasourceUrl: dbUrl,
  log: ['warn', 'error']
})

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect()
}
