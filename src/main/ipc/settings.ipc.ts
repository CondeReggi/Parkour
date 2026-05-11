import { app, dialog, ipcMain } from 'electron'
import { writeFile, readFile } from 'node:fs/promises'
import { settingsRepository } from '../repositories/settings.repository'
import { updateThemeInputSchema } from '@shared/schemas/settings.schemas'
import { buildExportPayload } from '../services/dataExport'
import {
  applyImportPayload,
  exportPayloadSchema
} from '../services/dataImport'
import {
  backupDatabaseTo,
  restoreDatabaseFrom
} from '../services/dbBackup'
import { prisma } from '../db/client'
import type {
  BackupResult,
  ExportResult,
  ImportResult
} from '@shared/types/settings'

function timestampForFile(): string {
  // 2026-05-10T17-30-12 — file-system safe ISO sin segundos fraccionarios.
  return new Date().toISOString().replace(/[:.]/g, '-').split('.')[0] ?? 'export'
}

export function registerSettingsHandlers(): void {
  // === Settings basics ===
  ipcMain.handle('settings:get', async () => {
    return settingsRepository.get()
  })

  ipcMain.handle('settings:setTheme', async (_evt, raw: unknown) => {
    const { theme } = updateThemeInputSchema.parse(raw)
    return settingsRepository.setTheme(theme)
  })

  // === Export JSON ===
  ipcMain.handle('settings:exportJson', async (): Promise<ExportResult | null> => {
    const result = await dialog.showSaveDialog({
      title: 'Exportar datos a JSON',
      defaultPath: `parkour-export-${timestampForFile()}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return null

    const payload = await buildExportPayload()
    await writeFile(result.filePath, JSON.stringify(payload, null, 2), 'utf8')

    await prisma.backupLog.create({
      data: {
        type: 'export_json',
        filePath: result.filePath,
        succeeded: true,
        message: null
      }
    })
    return { filePath: result.filePath, createdAt: payload.exportedAt }
  })

  // === Import JSON ===
  ipcMain.handle('settings:importJson', async (): Promise<ImportResult | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Importar datos desde JSON',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    const filePath = result.filePaths[0]
    if (result.canceled || !filePath) return null

    const raw = await readFile(filePath, 'utf8')
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      throw new Error(
        `El archivo no es JSON válido: ${e instanceof Error ? e.message : String(e)}`
      )
    }

    const payload = exportPayloadSchema.parse(parsed)
    let importResult: { recordCount: number }
    try {
      importResult = await applyImportPayload(payload)
    } catch (e) {
      await prisma.backupLog.create({
        data: {
          type: 'import_json',
          filePath,
          succeeded: false,
          message: e instanceof Error ? e.message : String(e)
        }
      })
      throw e
    }

    await prisma.backupLog.create({
      data: {
        type: 'import_json',
        filePath,
        succeeded: true,
        message: `Insertados ${importResult.recordCount} registros`
      }
    })
    return importResult
  })

  // === Backup .db ===
  ipcMain.handle('settings:backupDb', async (): Promise<BackupResult | null> => {
    const result = await dialog.showSaveDialog({
      title: 'Crear backup de la base de datos',
      defaultPath: `parkour-backup-${timestampForFile()}.db`,
      filters: [{ name: 'SQLite DB', extensions: ['db'] }]
    })
    if (result.canceled || !result.filePath) return null

    try {
      await backupDatabaseTo(result.filePath)
    } catch (e) {
      await prisma.backupLog.create({
        data: {
          type: 'backup_db',
          filePath: result.filePath,
          succeeded: false,
          message: e instanceof Error ? e.message : String(e)
        }
      })
      throw e
    }

    const now = new Date()
    await settingsRepository.setLastBackupAt(now)
    await prisma.backupLog.create({
      data: {
        type: 'backup_db',
        filePath: result.filePath,
        succeeded: true,
        message: null
      }
    })
    return { filePath: result.filePath, createdAt: now.toISOString() }
  })

  // === Restore .db (requiere reinicio) ===
  ipcMain.handle('settings:restoreDb', async (): Promise<{ relaunching: true } | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Restaurar desde backup',
      properties: ['openFile'],
      filters: [{ name: 'SQLite DB', extensions: ['db'] }]
    })
    const filePath = result.filePaths[0]
    if (result.canceled || !filePath) return null

    try {
      // Cerramos el cliente Prisma antes de sobrescribir el .db. Si la copia
      // falla, el cliente ya está cerrado pero el reinicio lo va a reabrir.
      await prisma.$disconnect()
      await restoreDatabaseFrom(filePath)
      await prisma.backupLog.create({
        data: {
          type: 'restore_db',
          filePath,
          succeeded: true,
          message: null
        }
      })
    } catch (e) {
      // Intentamos loggearlo aunque el client esté desconectado.
      try {
        await prisma.backupLog.create({
          data: {
            type: 'restore_db',
            filePath,
            succeeded: false,
            message: e instanceof Error ? e.message : String(e)
          }
        })
      } catch {
        // ignore: el restore puede haber dejado la DB en estado raro
      }
      throw e
    }

    // Reabrir Prisma en caliente sobre un archivo recién copiado es propenso
    // a estados raros (handles que no se actualizan). El camino seguro y
    // simple es relanzar el proceso.
    setTimeout(() => {
      app.relaunch()
      app.exit(0)
    }, 200)
    return { relaunching: true }
  })
}
