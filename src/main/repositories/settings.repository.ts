/**
 * Repositorio del singleton AppSettings (id=1).
 * Lazy-init: si la fila no existe, se crea al primer read.
 */

import { prisma } from '../db/client'
import type { AppSettingsDto, Theme } from '@shared/types/settings'

const SETTINGS_ID = 1

async function ensureRow() {
  return prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID },
    update: {}
  })
}

function rowToDto(row: {
  theme: string
  activeProfileId: string | null
  lastBackupAt: Date | null
}): AppSettingsDto {
  return {
    theme: (row.theme as Theme) ?? 'dark',
    activeProfileId: row.activeProfileId,
    lastBackupAt: row.lastBackupAt ? row.lastBackupAt.toISOString() : null
  }
}

export const settingsRepository = {
  async get(): Promise<AppSettingsDto> {
    const row = await ensureRow()
    return rowToDto(row)
  },

  async getActiveProfileId(): Promise<string | null> {
    const row = await ensureRow()
    return row.activeProfileId
  },

  async setActiveProfileId(profileId: string | null): Promise<void> {
    await ensureRow()
    await prisma.appSettings.update({
      where: { id: SETTINGS_ID },
      data: { activeProfileId: profileId }
    })
  },

  async setTheme(theme: Theme): Promise<AppSettingsDto> {
    await ensureRow()
    const updated = await prisma.appSettings.update({
      where: { id: SETTINGS_ID },
      data: { theme }
    })
    return rowToDto(updated)
  },

  async setLastBackupAt(date: Date): Promise<void> {
    await ensureRow()
    await prisma.appSettings.update({
      where: { id: SETTINGS_ID },
      data: { lastBackupAt: date }
    })
  }
}
