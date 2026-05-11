import type { Injury } from '@prisma/client'
import { prisma } from '../db/client'
import type { BodyPart, InjuryDto, InjurySeverity } from '@shared/types/profile'
import type {
  AddInjuryInput,
  UpdateInjuryInput
} from '@shared/schemas/injury.schemas'

function toDto(i: Injury): InjuryDto {
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

export const injuryRepository = {
  async add(input: AddInjuryInput): Promise<InjuryDto> {
    const created = await prisma.injury.create({
      data: {
        profileId: input.profileId,
        bodyPart: input.bodyPart,
        description: input.description ?? null,
        severity: input.severity,
        isActive: input.isActive,
        notes: input.notes ?? null
      }
    })
    return toDto(created)
  },

  async update(input: UpdateInjuryInput): Promise<InjuryDto> {
    const { id, ...rest } = input
    const updated = await prisma.injury.update({
      where: { id },
      data: {
        ...(rest.bodyPart !== undefined && { bodyPart: rest.bodyPart }),
        ...(rest.description !== undefined && { description: rest.description }),
        ...(rest.severity !== undefined && { severity: rest.severity }),
        ...(rest.isActive !== undefined && {
          isActive: rest.isActive,
          resolvedAt: rest.isActive ? null : new Date()
        }),
        ...(rest.notes !== undefined && { notes: rest.notes })
      }
    })
    return toDto(updated)
  },

  async remove(id: string): Promise<void> {
    await prisma.injury.delete({ where: { id } })
  }
}
