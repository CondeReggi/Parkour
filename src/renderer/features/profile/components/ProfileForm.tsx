import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  profileFormSchema,
  type ProfileFormValues
} from '@shared/schemas/profile.schemas'
import type { ProfileDto, WeekDay } from '@shared/types/profile'
import {
  useCreateProfile,
  useUpdateProfile
} from '../hooks/useProfileMutations'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

const DAYS: { value: WeekDay; label: string }[] = [
  { value: 'mon', label: 'Lun' },
  { value: 'tue', label: 'Mar' },
  { value: 'wed', label: 'Mié' },
  { value: 'thu', label: 'Jue' },
  { value: 'fri', label: 'Vie' },
  { value: 'sat', label: 'Sáb' },
  { value: 'sun', label: 'Dom' }
]

const EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'Nunca hice parkour' },
  { value: 'lt6m', label: 'Menos de 6 meses' },
  { value: '6_12m', label: 'Entre 6 y 12 meses' },
  { value: '1_2y', label: 'Entre 1 y 2 años' },
  { value: 'gt2y', label: 'Más de 2 años' }
] as const

const GOAL_OPTIONS = [
  { value: 'technique', label: 'Mejorar técnica' },
  { value: 'mobility', label: 'Movilidad' },
  { value: 'strength', label: 'Fuerza' },
  { value: 'general', label: 'General' }
] as const

const INTENSITY_OPTIONS = [
  { value: 'low', label: 'Baja' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'high', label: 'Alta' }
] as const

const DOMINANT_LEG_OPTIONS = [
  { value: 'right', label: 'Derecha' },
  { value: 'left', label: 'Izquierda' },
  { value: 'both', label: 'Ambidiestro' }
] as const

const WEAK_SIDE_OPTIONS = [
  { value: 'none', label: 'Ninguno' },
  { value: 'right', label: 'Derecho' },
  { value: 'left', label: 'Izquierdo' }
] as const

const defaultValues: ProfileFormValues = {
  name: '',
  age: null,
  heightCm: null,
  weightKg: null,
  parkourExperience: 'none',
  previousSports: null,
  dominantLeg: 'right',
  weakSide: 'none',
  daysAvailable: [],
  sessionDurationMin: 60,
  mainGoal: 'technique',
  preferredIntensity: 'moderate'
}

function profileToFormValues(p: ProfileDto): ProfileFormValues {
  return {
    name: p.name,
    age: p.age,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    parkourExperience: p.parkourExperience,
    previousSports: p.previousSports,
    dominantLeg: p.dominantLeg,
    weakSide: p.weakSide ?? 'none',
    daysAvailable: p.daysAvailable,
    sessionDurationMin: p.sessionDurationMin,
    mainGoal: p.mainGoal,
    preferredIntensity: p.preferredIntensity
  }
}

interface Props {
  initial?: ProfileDto
}

export function ProfileForm({ initial }: Props) {
  const isEdit = !!initial
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initial ? profileToFormValues(initial) : defaultValues
  })

  // Si llegan datos del perfil después del primer render, refresco el form.
  useEffect(() => {
    if (initial) form.reset(profileToFormValues(initial))
  }, [initial, form])

  const createMut = useCreateProfile()
  const updateMut = useUpdateProfile()
  const mut = isEdit ? updateMut : createMut

  async function onSubmit(values: ProfileFormValues) {
    if (isEdit && initial) {
      await updateMut.mutateAsync({ id: initial.id, ...values })
    } else {
      await createMut.mutateAsync(values)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Edad</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="—"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heightCm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Altura (cm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="—"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weightKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="—"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Experiencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="parkourExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experiencia en parkour</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPERIENCE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="previousSports"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deportes previos</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Qué hiciste antes (opcional)"
                      rows={2}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : e.target.value)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dominantLeg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pierna dominante</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOMINANT_LEG_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weakSide"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lado débil</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WEAK_SIDE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disponibilidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="daysAvailable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Días disponibles para entrenar</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => {
                      const checked = field.value.includes(d.value)
                      return (
                        <label
                          key={d.value}
                          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-secondary/50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              if (c) {
                                field.onChange([...field.value, d.value])
                              } else {
                                field.onChange(field.value.filter((v) => v !== d.value))
                              }
                            }}
                          />
                          <span className="text-sm">{d.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sessionDurationMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración de cada sesión (minutos)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={10}
                      max={240}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value || 0))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Objetivos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="mainGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo principal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GOAL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredIntensity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intensidad preferida</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INTENSITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {mut.error && (
          <Alert variant="destructive">
            <AlertDescription>{mut.error.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear perfil'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
