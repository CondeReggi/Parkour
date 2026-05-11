/**
 * Punto único donde se registran todos los handlers IPC del main.
 * Llamar una sola vez en app.whenReady().
 */

import { registerMovementHandlers } from './movements.ipc'
import { registerProfileHandlers } from './profile.ipc'
import { registerAssessmentHandlers } from './assessment.ipc'
import { registerRoutineHandlers } from './routines.ipc'
import { registerSessionHandlers } from './sessions.ipc'
import { registerSpotHandlers } from './spots.ipc'
import { registerVideoHandlers } from './videos.ipc'
import { registerSettingsHandlers } from './settings.ipc'
import { registerGamificationHandlers } from './gamification.ipc'
import { registerQuestHandlers } from './quest.ipc'
import { registerAchievementHandlers } from './achievement.ipc'
import { registerStreakHandlers } from './streak.ipc'
import { registerProgressHandlers } from './progress.ipc'
import { registerAuthHandlers } from './auth.ipc'

export function registerHandlers(): void {
  registerMovementHandlers()
  registerProfileHandlers()
  registerAssessmentHandlers()
  registerRoutineHandlers()
  registerSessionHandlers()
  registerSpotHandlers()
  registerVideoHandlers()
  registerSettingsHandlers()
  registerGamificationHandlers()
  registerQuestHandlers()
  registerAchievementHandlers()
  registerStreakHandlers()
  registerProgressHandlers()
  registerAuthHandlers()
}
