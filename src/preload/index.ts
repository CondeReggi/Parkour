/**
 * Preload script: única superficie de contacto entre renderer y main.
 * Cada método del contrato `ParkourApi` se mapea a un channel `<feature>:<method>`.
 *
 * Importante: ningún módulo de Node ni Prisma vive acá. Sólo Electron y serialización.
 */

import { contextBridge, ipcRenderer } from 'electron'
import type { ParkourApi } from '@shared/api'

const invoke = <T>(channel: string, payload?: unknown) =>
  ipcRenderer.invoke(channel, payload) as Promise<T>

const api: ParkourApi = {
  ping: () => 'pong',

  movements: {
    getAll: () => invoke('movements:getAll'),
    getBySlug: (input) => invoke('movements:getBySlug', input),
    setProgress: (input) => invoke('movements:setProgress', input),
    recommendForActive: () => invoke('movements:recommendForActive')
  },

  profile: {
    getActive: () => invoke('profile:getActive'),
    create: (input) => invoke('profile:create', input),
    update: (input) => invoke('profile:update', input),
    addInjury: (input) => invoke('profile:addInjury', input),
    updateInjury: (input) => invoke('profile:updateInjury', input),
    deleteInjury: (input) => invoke('profile:deleteInjury', input)
  },

  assessment: {
    create: (input) => invoke('assessment:create', input),
    listForActive: () => invoke('assessment:listForActive'),
    latest: () => invoke('assessment:latest')
  },

  routines: {
    getAll: () => invoke('routines:getAll'),
    getBySlug: (input) => invoke('routines:getBySlug', input),
    recommendForActive: () => invoke('routines:recommendForActive')
  },

  sessions: {
    start: (input) => invoke('sessions:start', input),
    getActive: () => invoke('sessions:getActive'),
    finalize: (input) => invoke('sessions:finalize', input),
    cancel: (input) => invoke('sessions:cancel', input),
    listForActive: () => invoke('sessions:listForActive'),
    getById: (input) => invoke('sessions:getById', input),
    getStats: () => invoke('sessions:getStats')
  },

  spots: {
    getAll: () => invoke('spots:getAll'),
    getById: (input) => invoke('spots:getById', input),
    create: (input) => invoke('spots:create', input),
    update: (input) => invoke('spots:update', input),
    delete: (input) => invoke('spots:delete', input),
    setFavorite: (input) => invoke('spots:setFavorite', input),
    addObstacle: (input) => invoke('spots:addObstacle', input),
    updateObstacle: (input) => invoke('spots:updateObstacle', input),
    deleteObstacle: (input) => invoke('spots:deleteObstacle', input),
    setObstacleMovements: (input) => invoke('spots:setObstacleMovements', input),
    setIdealMovements: (input) => invoke('spots:setIdealMovements', input),
    addPhoto: (input) => invoke('spots:addPhoto', input),
    updatePhoto: (input) => invoke('spots:updatePhoto', input),
    deletePhoto: (input) => invoke('spots:deletePhoto', input),
    pickPhoto: () => invoke('spots:pickPhoto')
  },

  videos: {
    getAll: () => invoke('videos:getAll'),
    getById: (input) => invoke('videos:getById', input),
    create: (input) => invoke('videos:create', input),
    update: (input) => invoke('videos:update', input),
    delete: (input) => invoke('videos:delete', input),
    pickFile: () => invoke('videos:pickFile')
  },

  settings: {
    get: () => invoke('settings:get'),
    setTheme: (input) => invoke('settings:setTheme', input),
    exportJson: () => invoke('settings:exportJson'),
    importJson: () => invoke('settings:importJson'),
    backupDb: () => invoke('settings:backupDb'),
    restoreDb: () => invoke('settings:restoreDb')
  },

  gamification: {
    getState: () => invoke('gamification:getState'),
    listEvents: () => invoke('gamification:listEvents'),
    getBreakdown: () => invoke('gamification:getBreakdown')
  },

  quests: {
    listForActive: () => invoke('quests:listForActive'),
    claim: (input) => invoke('quests:claim', input)
  },

  achievements: {
    listForActive: () => invoke('achievements:listForActive'),
    recentForActive: () => invoke('achievements:recentForActive')
  },

  streak: {
    getState: () => invoke('streak:getState'),
    markActiveRecovery: (input) => invoke('streak:markActiveRecovery', input)
  },

  progress: {
    getInsights: () => invoke('progress:getInsights')
  }
}

// contextIsolation siempre está en true en main/index.ts.
// Si alguna vez se desactiva, este try/catch hace ruidoso el fallo en consola.
try {
  contextBridge.exposeInMainWorld('parkourApi', api)
} catch (error) {
  console.error('[preload] failed to expose parkourApi:', error)
}
