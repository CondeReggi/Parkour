/**
 * Resuelve la ruta de userData (la misma que usa Electron en runtime),
 * setea DATABASE_URL apuntando a parkour.db dentro de esa carpeta,
 * y ejecuta el comando que se le pase como argumento.
 *
 * Uso:
 *   node scripts/with-db-env.mjs prisma migrate dev
 *   node scripts/with-db-env.mjs tsx prisma/seed.ts
 *
 * Esta lógica DEBE coincidir con app.getPath('userData') de Electron.
 * Electron usa: <appdata>/<package.json#name>
 */

import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_NAME = 'parkour-app'

function userDataDir() {
  const platform = process.platform
  if (platform === 'win32') {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming')
    return path.join(appData, APP_NAME)
  }
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', APP_NAME)
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config')
  return path.join(xdg, APP_NAME)
}

const dbDir = userDataDir()
fs.mkdirSync(dbDir, { recursive: true })

const dbPath = path.join(dbDir, 'parkour.db')
const dbUrl = 'file:' + dbPath.replace(/\\/g, '/')

process.env.DATABASE_URL = dbUrl

console.log(`[parkour] DATABASE_URL=${dbUrl}`)

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node scripts/with-db-env.mjs <command> [...args]')
  process.exit(1)
}

const child = spawn(args[0], args.slice(1), {
  stdio: 'inherit',
  env: process.env,
  shell: true
})

child.on('exit', (code) => process.exit(code ?? 0))
