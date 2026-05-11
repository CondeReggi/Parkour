import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createAssessmentInputSchema,
  type CreateAssessmentInput
} from '@shared/schemas/assessment.schemas'
import { useCreateAssessment } from '../hooks/useAssessments'
import { LevelBadge } from '@/features/profile/components/LevelBadge'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const defaults: CreateAssessmentInput = {
  pushUps: null,
  squats: null,
  plankSeconds: null,
  pullUps: null,
  ankleMobility: 5,
  hipMobility: 5,
  wristMobility: 5,
  confidence: 5,
  fear: 5,
  pain: 0,
  fatigue: 5,
  notes: null
}

type NumericField = Exclude<keyof CreateAssessmentInput, 'notes'>

function NumberInputCell({
  form,
  name,
  label,
  placeholder,
  unit
}: {
  form: ReturnType<typeof useForm<CreateAssessmentInput>>
  name: 'pushUps' | 'squats' | 'plankSeconds' | 'pullUps'
  label: string
  placeholder?: string
  unit?: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {unit && <span className="text-muted-foreground">({unit})</span>}
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={placeholder ?? '—'}
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
  )
}

function SliderCell({
  form,
  name,
  label,
  hint
}: {
  form: ReturnType<typeof useForm<CreateAssessmentInput>>
  name: NumericField
  label: string
  hint?: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>
              {label}
              {hint && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">{hint}</span>
              )}
            </FormLabel>
            <span className="text-sm font-mono w-8 text-right">{field.value ?? '—'}</span>
          </div>
          <FormControl>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[field.value ?? 0]}
              onValueChange={([v]) => field.onChange(v ?? 0)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function AssessmentForm() {
  const form = useForm<CreateAssessmentInput>({
    resolver: zodResolver(createAssessmentInputSchema),
    defaultValues: defaults
  })

  const mut = useCreateAssessment()

  async function onSubmit(values: CreateAssessmentInput) {
    await mut.mutateAsync(values)
    // Reset a los defaults para que la próxima evaluación arranque limpia.
    form.reset(defaults)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fuerza</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <NumberInputCell form={form} name="pushUps" label="Flexiones" unit="máx en 1 min" />
            <NumberInputCell form={form} name="squats" label="Sentadillas" unit="máx en 1 min" />
            <NumberInputCell form={form} name="plankSeconds" label="Plancha" unit="seg" />
            <NumberInputCell form={form} name="pullUps" label="Dominadas" unit="máx" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movilidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SliderCell form={form} name="ankleMobility" label="Tobillos" hint="0 = rígidos, 10 = excelentes" />
            <SliderCell form={form} name="hipMobility" label="Cadera" hint="0 = rígida, 10 = excelente" />
            <SliderCell form={form} name="wristMobility" label="Muñecas" hint="0 = rígidas, 10 = excelentes" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado mental</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SliderCell form={form} name="confidence" label="Confianza" hint="0 = muy poca, 10 = mucha" />
            <SliderCell form={form} name="fear" label="Miedo" hint="0 = nada, 10 = mucho" />
            <SliderCell form={form} name="pain" label="Dolor" hint="0 = nada, 10 = mucho" />
            <SliderCell form={form} name="fatigue" label="Fatiga" hint="0 = descansado, 10 = agotado" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Algo que querés recordar de cómo te sentís hoy"
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

        {mut.error && (
          <Alert variant="destructive">
            <AlertDescription>{mut.error.message}</AlertDescription>
          </Alert>
        )}

        {mut.isSuccess && mut.data && (
          <Alert>
            <AlertTitle className="flex items-center gap-2">
              Evaluación guardada
              <LevelBadge level={mut.data.computedLevel} />
            </AlertTitle>
            <AlertDescription>
              El nivel de tu perfil quedó como{' '}
              <span className="font-medium text-foreground">{mut.data.computedLevel}</span>{' '}
              en base a esta evaluación.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? 'Guardando…' : 'Guardar evaluación'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
