/**
 * Frase motivadora personalizada del hero. Función pura: recibe el
 * perfil + estado de gamificación + racha + flag de sesión activa y
 * devuelve el saludo y una frase tipo coach en rioplatense.
 *
 * Reglas de selección, en este orden:
 *  1. Sesión activa → recordar que tiene una abierta.
 *  2. Racha alta (≥ 7 días) → reconocimiento del momento.
 *  3. Racha media (≥ 3 días) → reforzar constancia.
 *  4. Racha de 1 día → empujar a sumar otro.
 *  5. Sin racha + cuenta nueva → invitar a empezar.
 *  6. Sin racha + cuenta con historial → invitar a volver.
 */

import type { ProfileDto } from '@shared/types/profile'
import type { GamificationStateDto } from '@shared/types/gamification'
import type { StreakStateDto } from '@shared/types/streak'

function timeGreeting(hour: number): string {
  if (hour < 6) return 'Hola'
  if (hour < 12) return 'Buen día'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

export function buildHeroGreeting(
  profile: ProfileDto,
  now: Date = new Date()
): string {
  return `${timeGreeting(now.getHours())}, ${firstName(profile.name)}`
}

export interface HeroQuoteContext {
  gamification: GamificationStateDto | undefined
  streak: StreakStateDto | undefined
  hasActiveSession: boolean
}

export function buildHeroQuote(ctx: HeroQuoteContext): string {
  if (ctx.hasActiveSession) {
    return 'Tenés una sesión abierta. Retomala y cerrala fuerte.'
  }

  const currentStreak = ctx.streak?.currentStreak ?? 0
  if (currentStreak >= 7) {
    return `Llevás ${currentStreak} días al hilo. Estás en zona, que no se enfríe.`
  }
  if (currentStreak >= 3) {
    return `${currentStreak} días seguidos. La constancia es la clave; hoy también cuenta.`
  }
  if (currentStreak === 1) {
    return 'Un día arriba. Mañana es para sumar otro.'
  }

  const totalXp = ctx.gamification?.totalXp ?? 0
  if (totalXp === 0) {
    return 'Hoy es buen día para arrancar. Una sesión cortita y entramos en ritmo.'
  }
  return 'Volvamos a movernos. Una sesión y empezás una racha nueva.'
}
