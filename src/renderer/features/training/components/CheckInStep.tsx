import { Battery, Clock, Compass, MapPin } from 'lucide-react'
import type { MainGoal } from '@shared/types/profile'
import type { SessionPlace } from '@shared/types/session'
import type { SpotDto } from '@shared/types/spot'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { SafetyChecklist } from '../lib/safety'
import { SafetyChecklistForm } from './SafetyChecklistForm'

export interface CheckInValues {
  energy: number
  pain: number
  fatigue: number
  sleepQuality: number
  confidence: number
  floor: SafetyChecklist['floor']
  environment: SafetyChecklist['environment']
  timeAvailableMin: number
  goalOfDay: MainGoal | null
  place: SessionPlace | null
  spotId: string | null
}

export const DEFAULT_CHECK_IN: CheckInValues = {
  energy: 6,
  pain: 0,
  fatigue: 4,
  sleepQuality: 7,
  confidence: 7,
  floor: 'good',
  environment: 'safe',
  timeAvailableMin: 60,
  goalOfDay: null,
  place: null,
  spotId: null
}

const TIME_OPTIONS = [20, 30, 45, 60, 75, 90, 120]

const GOAL_OPTIONS: { value: MainGoal | 'inherit'; label: string }[] = [
  { value: 'inherit', label: 'Lo del perfil' },
  { value: 'technique', label: 'Técnica' },
  { value: 'mobility', label: 'Movilidad' },
  { value: 'strength', label: 'Fuerza' },
  { value: 'general', label: 'General' }
]

const PLACE_OPTIONS: { value: SessionPlace; label: string }[] = [
  { value: 'home', label: 'En casa' },
  { value: 'spot', label: 'En un spot' },
  { value: 'other', label: 'Otro lugar' }
]

interface SliderRowProps {
  label: string
  hint: string
  value: number
  onChange: (v: number) => void
}

function SliderRow({ label, hint, value, onChange }: SliderRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label}
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            {hint}
          </span>
        </label>
        <span className="text-sm font-mono w-8 text-right tabular-nums">
          {value}
        </span>
      </div>
      <Slider
        min={0}
        max={10}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v ?? 0)}
      />
    </div>
  )
}

interface Props {
  value: CheckInValues
  onChange: (next: CheckInValues) => void
  spots: SpotDto[] | undefined
  onContinue: () => void
}

export function CheckInStep({ value, onChange, spots, onContinue }: Props) {
  const set = <K extends keyof CheckInValues>(key: K, v: CheckInValues[K]) =>
    onChange({ ...value, [key]: v })

  function setSafety(next: SafetyChecklist) {
    onChange({
      ...value,
      pain: next.pain,
      fatigue: next.fatigue,
      sleepQuality: next.sleepQuality,
      confidence: next.confidence,
      floor: next.floor,
      environment: next.environment
    })
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Cómo estás hoy?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <SliderRow
            label="Energía"
            hint="0 = en cero, 10 = al máximo"
            value={value.energy}
            onChange={(v) => set('energy', v)}
          />
          <SliderRow
            label="Dolor"
            hint="0 = nada, 10 = mucho"
            value={value.pain}
            onChange={(v) => set('pain', v)}
          />
          <SliderRow
            label="Fatiga"
            hint="0 = descansado, 10 = agotado"
            value={value.fatigue}
            onChange={(v) => set('fatigue', v)}
          />
          <SliderRow
            label="Calidad del sueño"
            hint="0 = pésimo, 10 = excelente"
            value={value.sleepQuality}
            onChange={(v) => set('sleepQuality', v)}
          />
          <SliderRow
            label="Confianza"
            hint="0 = muy poca, 10 = mucha"
            value={value.confidence}
            onChange={(v) => set('confidence', v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Qué querés hacer hoy?</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Tiempo disponible
            </label>
            <Select
              value={String(value.timeAvailableMin)}
              onValueChange={(v) => set('timeAvailableMin', Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((t) => (
                  <SelectItem key={t} value={String(t)}>
                    {t} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-muted-foreground" />
              Objetivo del día
            </label>
            <Select
              value={value.goalOfDay ?? 'inherit'}
              onValueChange={(v) =>
                set('goalOfDay', v === 'inherit' ? null : (v as MainGoal))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Lugar
            </label>
            <Select
              value={value.place ?? ''}
              onValueChange={(v) => {
                const place = v as SessionPlace
                set('place', place)
                if (place !== 'spot') set('spotId', null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elegí dónde" />
              </SelectTrigger>
              <SelectContent>
                {PLACE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {value.place === 'spot' && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Battery className="h-3.5 w-3.5 text-muted-foreground" />
                ¿Qué spot?
              </label>
              <Select
                value={value.spotId ?? ''}
                onValueChange={(v) => set('spotId', v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elegí un spot" />
                </SelectTrigger>
                <SelectContent>
                  {(spots ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                  {(!spots || spots.length === 0) && (
                    <SelectItem value="__none" disabled>
                      No tenés spots registrados
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <SafetyChecklistForm
        value={{
          pain: value.pain,
          fatigue: value.fatigue,
          sleepQuality: value.sleepQuality,
          confidence: value.confidence,
          floor: value.floor,
          environment: value.environment
        }}
        onChange={setSafety}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={onContinue}>
          Ver recomendación
        </Button>
      </div>
    </div>
  )
}
