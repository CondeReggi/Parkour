/**
 * Loader minimalista de `.env` para el proceso main.
 *
 * Por qué no usar `dotenv`: no quiero agregar una dep nueva por algo
 * que son 20 líneas. El formato soportado es el subconjunto típico:
 *
 *   KEY=value
 *   KEY="value with spaces"
 *   # comentarios
 *
 * No interpola, no expande, no soporta multilínea. Suficiente para
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET y similares.
 *
 * Se llama una sola vez en src/main/index.ts antes de registerHandlers
 * para que `process.env.*` esté disponible cuando el servicio de auth
 * lo lea.
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {}
  const lines = content.split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    // Strip wrapping quotes if están balanceadas.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) out[key] = value
  }
  return out
}

/**
 * Carga el `.env` del root del proyecto y mezcla los valores en
 * `process.env` sin sobreescribir vars que ya vinieran seteadas por el
 * shell. Si el archivo no existe (ej. en una build empaquetada sin
 * .env), no hace nada — la app sigue funcionando, y los features que
 * dependan de las vars muestran su error propio.
 *
 * En dev (`app.isPackaged === false`) el cwd suele ser el root del
 * proyecto. En prod, el .env probablemente no esté presente; eso es
 * intencional para no shippear secrets.
 */
export function loadDotEnv(): void {
  const candidates: string[] = []
  candidates.push(join(process.cwd(), '.env'))
  if (!app.isPackaged) {
    // En dev electron-vite a veces ejecuta desde out/main; subimos.
    candidates.push(join(__dirname, '..', '..', '.env'))
    candidates.push(join(__dirname, '..', '..', '..', '.env'))
  }

  for (const p of candidates) {
    try {
      if (!existsSync(p)) continue
      const content = readFileSync(p, 'utf8')
      const parsed = parseEnvFile(content)
      for (const [k, v] of Object.entries(parsed)) {
        if (process.env[k] === undefined || process.env[k] === '') {
          process.env[k] = v
        }
      }
      return
    } catch {
      // ignoramos errores de lectura del .env — no es crítico.
    }
  }
}
