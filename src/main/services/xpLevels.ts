/**
 * Cálculo de nivel a partir del XP total. Función pura: no depende de
 * Prisma ni Electron y se puede testear con valores literales.
 *
 * Curva: thresholds incrementales lineales.
 *   threshold(N) = 50 * N * (N - 1)
 *
 *   Nivel 1: 0 XP
 *   Nivel 2: 100 XP   (+100)
 *   Nivel 3: 300 XP   (+200)
 *   Nivel 4: 600 XP   (+300)
 *   Nivel 5: 1000 XP  (+400)
 *   Nivel 6: 1500 XP  (+500)
 *
 * El costo de cada nivel sube de a 100 XP, así que el ritmo de subir
 * niveles se desacelera de forma natural sin saltos abruptos.
 */

import type { GamificationStateDto } from '@shared/types/gamification'

export function thresholdForLevel(level: number): number {
  if (level <= 1) return 0
  return 50 * level * (level - 1)
}

export function computeLevelFromXp(totalXpRaw: number): GamificationStateDto {
  const totalXp = Math.max(0, Math.floor(totalXpRaw))

  let level = 1
  // Avanzamos mientras el threshold del próximo nivel sea alcanzable.
  while (thresholdForLevel(level + 1) <= totalXp) {
    level++
    // Safety: la curva crece monotónicamente, no debería loopear infinito,
    // pero cortamos por las dudas si entra un valor absurdamente grande.
    if (level > 999) break
  }

  const currentThreshold = thresholdForLevel(level)
  const nextThreshold = thresholdForLevel(level + 1)
  const xpForCurrentLevel = nextThreshold - currentThreshold
  const currentLevelXp = totalXp - currentThreshold
  const xpToNextLevel = Math.max(0, nextThreshold - totalXp)
  const progressPercent =
    xpForCurrentLevel === 0
      ? 0
      : Math.min(100, Math.floor((currentLevelXp / xpForCurrentLevel) * 100))

  return {
    totalXp,
    level,
    currentLevelXp,
    xpForCurrentLevel,
    xpToNextLevel,
    nextLevelThreshold: nextThreshold,
    progressPercent
  }
}
