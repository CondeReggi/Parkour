import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import {
  spotFormSchema,
  type SpotFormValues
} from '@shared/schemas/spot.schemas'
import type {
  FloorType,
  RecommendedLevel,
  SpotDto,
  SpotType
} from '@shared/types/spot'
import { useCreateSpot, useUpdateSpot } from '../hooks/useSpotMutations'

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
import {
  FLOOR_OPTIONS,
  RECOMMENDED_LEVEL_OPTIONS,
  SPOT_RISK_OPTIONS,
  SPOT_TYPE_OPTIONS
} from './spotEnums'
import { SpotLocationPicker } from './SpotLocationPicker'
import { VisibilitySelector } from '@/features/sharing/components/VisibilitySelector'

const defaultValues: SpotFormValues = {
  name: '',
  locationText: null,
  description: null,
  floorType: null,
  riskLevel: 'moderate',
  recommendedHours: null,
  beginnerFriendly: false,
  notes: null,
  spotType: null,
  recommendedLevel: null,
  tags: [],
  isFavorite: false,
  latitude: null,
  longitude: null,
  visibility: 'private'
}

function spotToFormValues(s: SpotDto): SpotFormValues {
  return {
    name: s.name,
    locationText: s.locationText,
    description: s.description,
    floorType: s.floorType,
    riskLevel: s.riskLevel,
    recommendedHours: s.recommendedHours,
    beginnerFriendly: s.beginnerFriendly,
    notes: s.notes,
    spotType: s.spotType,
    recommendedLevel: s.recommendedLevel,
    tags: s.tags,
    isFavorite: s.isFavorite,
    latitude: s.latitude,
    longitude: s.longitude,
    visibility: s.visibility
  }
}

interface Props {
  initial?: SpotDto
  onCreated?: (spot: SpotDto) => void
}

export function SpotForm({ initial, onCreated }: Props) {
  const isEdit = !!initial
  const form = useForm<SpotFormValues>({
    resolver: zodResolver(spotFormSchema),
    defaultValues: initial ? spotToFormValues(initial) : defaultValues
  })

  useEffect(() => {
    if (initial) form.reset(spotToFormValues(initial))
  }, [initial, form])

  const createMut = useCreateSpot()
  const updateMut = useUpdateSpot()
  const mut = isEdit ? updateMut : createMut

  const [tagDraft, setTagDraft] = useState('')

  async function onSubmit(values: SpotFormValues) {
    if (isEdit && initial) {
      await updateMut.mutateAsync({ id: initial.id, ...values })
    } else {
      const created = await createMut.mutateAsync(values)
      onCreated?.(created)
    }
  }

  function addTag(current: string[], setValue: (v: string[]) => void) {
    const t = tagDraft.trim().toLowerCase()
    if (!t) return
    if (current.includes(t)) {
      setTagDraft('')
      return
    }
    setValue([...current, t])
    setTagDraft('')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos básicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del spot</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Plaza del centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locationText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Av. principal y Calle 5"
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Qué tipo de superficies y obstáculos tiene"
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clasificación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="spotType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de spot</FormLabel>
                    <Select
                      value={field.value ?? 'unspecified'}
                      onValueChange={(v) =>
                        field.onChange(v === 'unspecified' ? null : (v as SpotType))
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unspecified">Sin especificar</SelectItem>
                        {SPOT_TYPE_OPTIONS.map((o) => (
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
                name="recommendedLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel recomendado</FormLabel>
                    <Select
                      value={field.value ?? 'unspecified'}
                      onValueChange={(v) =>
                        field.onChange(
                          v === 'unspecified' ? null : (v as RecommendedLevel)
                        )
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unspecified">Sin especificar</SelectItem>
                        {RECOMMENDED_LEVEL_OPTIONS.map((o) => (
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="floorType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de piso</FormLabel>
                    <Select
                      value={field.value ?? 'unspecified'}
                      onValueChange={(v) =>
                        field.onChange(v === 'unspecified' ? null : (v as FloorType))
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FLOOR_OPTIONS.map((o) => (
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
                name="riskLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Riesgo estimado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SPOT_RISK_OPTIONS.map((o) => (
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

            <FormField
              control={form.control}
              name="recommendedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horarios recomendados</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: mañana temprano, atardecer"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="beginnerFriendly"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(c) => field.onChange(!!c)}
                      />
                      <span className="text-sm">Apto para principiantes</span>
                    </label>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isFavorite"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(c) => field.onChange(!!c)}
                      />
                      <span className="text-sm">Marcar como favorito</span>
                    </label>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags personales</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ej: techado, abierto, gomas, cerca de casa"
                        value={tagDraft}
                        onChange={(e) => setTagDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault()
                            addTag(field.value, field.onChange)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addTag(field.value, field.onChange)}
                        disabled={tagDraft.trim() === ''}
                      >
                        Agregar
                      </Button>
                    </div>
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {field.value.map((t) => (
                          <span
                            key={t}
                            className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground rounded-full pl-2.5 pr-1 py-0.5"
                          >
                            #{t}
                            <button
                              type="button"
                              onClick={() =>
                                field.onChange(field.value.filter((x) => x !== t))
                              }
                              className="rounded-full h-4 w-4 flex items-center justify-center hover:bg-muted-foreground/20"
                              aria-label={`Quitar tag ${t}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ubicación en el mapa</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="latitude"
              render={() => (
                <FormItem>
                  <FormControl>
                    <SpotLocationPicker
                      value={
                        form.watch('latitude') !== null &&
                        form.watch('longitude') !== null
                          ? {
                              latitude: form.watch('latitude') as number,
                              longitude: form.watch('longitude') as number
                            }
                          : null
                      }
                      onChange={(next) => {
                        // RHF setValue con validate para que el refine
                        // de coords del Zod corra al cambiar.
                        form.setValue('latitude', next?.latitude ?? null, {
                          shouldDirty: true,
                          shouldValidate: true
                        })
                        form.setValue('longitude', next?.longitude ?? null, {
                          shouldDirty: true,
                          shouldValidate: true
                        })
                      }}
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
            <CardTitle className="text-base">Notas personales</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Cómo se entrena acá, qué cuidar, qué evitar, anécdotas…"
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compartir</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <VisibilitySelector
                  value={field.value}
                  onChange={field.onChange}
                />
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
            {mut.isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear spot'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
