import type {
  EnvState,
  FloorState,
  SafetyChecklist
} from '../lib/safety'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const FLOOR_OPTIONS: { value: FloorState; label: string }[] = [
  { value: 'good', label: 'Bueno (seco, firme)' },
  { value: 'wet', label: 'Húmedo / resbaladizo' },
  { value: 'dangerous', label: 'Peligroso (muy resbaladizo, hielo)' }
]

const ENV_OPTIONS: { value: EnvState; label: string }[] = [
  { value: 'safe', label: 'Seguro (sin obstáculos imprevistos)' },
  { value: 'some_risks', label: 'Algunos riesgos (gente, mascotas, mojado)' },
  { value: 'unsafe', label: 'Inseguro (muy concurrido, sin visibilidad)' }
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
          <span className="ml-2 text-xs text-muted-foreground font-normal">{hint}</span>
        </label>
        <span className="text-sm font-mono w-8 text-right">{value}</span>
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
  value: SafetyChecklist
  onChange: (next: SafetyChecklist) => void
}

export function SafetyChecklistForm({ value, onChange }: Props) {
  const set = <K extends keyof SafetyChecklist>(key: K, v: SafetyChecklist[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cómo te sentís</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
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
          <CardTitle className="text-base">Entorno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Estado del piso</label>
            <Select value={value.floor} onValueChange={(v) => set('floor', v as FloorState)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FLOOR_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Obstáculos del entorno</label>
            <Select
              value={value.environment}
              onValueChange={(v) => set('environment', v as EnvState)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENV_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
