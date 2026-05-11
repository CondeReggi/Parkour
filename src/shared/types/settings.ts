/**
 * Tres variantes de tema soportadas:
 *  - 'light'  → Urban Light (modo claro, base, deportivo).
 *  - 'dark'   → Asphalt Dark (modo oscuro nuevo, urbano).
 *  - 'gotham' → Modo oscuro original (paleta zinc).
 *
 * Los tres se persisten en AppSettings.theme. La elección de modo claro
 * vs oscuro la decide el ThemeProvider mirando este valor: 'light' aplica
 * la paleta base, 'dark' y 'gotham' son ambos "oscuros" con tokens distintos.
 */
export type Theme = 'light' | 'dark' | 'gotham'

export interface AppSettingsDto {
  theme: Theme
  activeProfileId: string | null
  lastBackupAt: string | null
}

export interface ExportResult {
  filePath: string
  /** Timestamp ISO en que se generó el archivo. */
  createdAt: string
}

export interface ImportResult {
  /** Cantidad total de registros insertados (todas las tablas). */
  recordCount: number
}

export interface BackupResult {
  filePath: string
  createdAt: string
}
