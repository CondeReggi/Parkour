/**
 * Repositorio de UserProfile + Injuries embebidos.
 * Convierte JSON-strings (daysAvailable) a arrays tipados en los DTOs.
 */

import type { Injury, Prisma, UserProfile } from '@prisma/client'
import { prisma } from '../db/client'
import { settingsRepository } from './settings.repository'
import type {
  BodyPart,
  DominantLeg,
  InjuryDto,
  InjurySeverity,
  Intensity,
  MainGoal,
  ParkourExperience,
  ProfileDto,
  UserLevel,
  WeakSide,
  WeekDay
} from '@shared/types/profile'
import type {
  CreateProfileInput,
  UpdateProfileInput
} from '@shared/schemas/profile.schemas'

function parseDays(json: string): WeekDay[] {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    const valid: WeekDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    return parsed.filter((d): d is WeekDay => typeof d === 'string' && valid.includes(d as WeekDay))
  } catch {
    return []
  }
}

function injuryToDto(i: Injury): InjuryDto {
  return {
    id: i.id,
    bodyPart: i.bodyPart as BodyPart,
    description: i.description,
    severity: i.severity as InjurySeverity,
    isActive: i.isActive,
    startedAt: i.startedAt.toISOString(),
    resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : null,
    notes: i.notes
  }
}

type ProfileWithInjuries = UserProfile & { injuries: Injury[] }

function profileToDto(p: ProfileWithInjuries): ProfileDto {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    parkourExperience: p.parkourExperience as ParkourExperience,
    previousSports: p.previousSports,
    dominantLeg: p.dominantLeg as DominantLeg,
    weakSide: p.weakSide as WeakSide | null,
    daysAvailable: parseDays(p.daysAvailable),
    sessionDurationMin: p.sessionDurationMin,
    mainGoal: p.mainGoal as MainGoal,
    preferredIntensity: p.preferredIntensity as Intensity,
    level: p.level as UserLevel,
    injuries: p.injuries.map(injuryToDto),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  }
}

function inputToData(input: CreateProfileInput): Prisma.UserProfileUncheckedCreateInput {
  return {
    name: input.name,
    age: input.age,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    parkourExperience: input.parkourExperience,
    previousSports: input.previousSports,
    dominantLeg: input.dominantLeg,
    weakSide: input.weakSide,
    daysAvailable: JSON.stringify(input.daysAvailable),
    sessionDurationMin: input.sessionDurationMin,
    mainGoal: input.mainGoal,
    preferredIntensity: input.preferredIntensity
  }
}

export const profileRepository = {
  async getActive(): Promise<ProfileDto | null> {
    const activeId = await settingsRepository.getActiveProfileId()
    if (activeId) {
      const found = await prisma.userProfile.findUnique({
        where: { id: activeId },
        include: { injuries: { orderBy: { createdAt: 'desc' } } }
      })
      if (found) return profileToDto(found)
    }
    // Fallback: si no hay activo seteado pero existe algún perfil, usá el primero
    // y persistí esa elección.
    const first = await prisma.userProfile.findFirst({
      orderBy: { createdAt: 'asc' },
      include: { injuries: { orderBy: { createdAt: 'desc' } } }
    })
    if (first) {
      await settingsRepository.setActiveProfileId(first.id)
      return profileToDto(first)
    }
    return null
  },

  async create(input: CreateProfileInput): Promise<ProfileDto> {
    const created = await prisma.userProfile.create({
      data: inputToData(input),
      include: { injuries: true }
    })
    // Auto-activar el primer perfil creado.
    const activeId = await settingsRepository.getActiveProfileId()
    if (!activeId) {
      await settingsRepository.setActiveProfileId(created.id)
    }
    return profileToDto(created)
  },

  async update(input: UpdateProfileInput): Promise<ProfileDto> {
    const { id, ...data } = input
    const updated = await prisma.userProfile.update({
      where: { id },
      data: inputToData(data),
      include: { injuries: { orderBy: { createdAt: 'desc' } } }
    })
    return profileToDto(updated)
  },

  /**
   * Setea el nivel del perfil (lo invoca el repositorio de assessment
   * cuando se crea una nueva evaluación).
   */
  async setLevel(profileId: string, level: UserLevel): Promise<void> {
    await prisma.userProfile.update({
      where: { id: profileId },
      data: { level }
    })
  }
}
