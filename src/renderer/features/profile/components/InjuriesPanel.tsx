import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import type { BodyPart, InjuryDto, InjurySeverity } from '@shared/types/profile'
import { useAddInjury, useDeleteInjury } from '../hooks/useInjuryMutations'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

const BODY_PARTS: { value: BodyPart; label: string }[] = [
  { value: 'ankle', label: 'Tobillo' },
  { value: 'knee', label: 'Rodilla' },
  { value: 'wrist', label: 'Muñeca' },
  { value: 'shoulder', label: 'Hombro' },
  { value: 'back', label: 'Espalda' },
  { value: 'neck', label: 'Cuello' },
  { value: 'other', label: 'Otra' }
]

const SEVERITIES: { value: InjurySeverity; label: string }[] = [
  { value: 'mild', label: 'Leve' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'severe', label: 'Severa' }
]

const severityVariant = (s: InjurySeverity): 'default' | 'secondary' | 'destructive' => {
  if (s === 'severe') return 'destructive'
  if (s === 'moderate') return 'default'
  return 'secondary'
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(iso))

interface Props {
  profileId: string
  injuries: InjuryDto[]
}

export function InjuriesPanel({ profileId, injuries }: Props) {
  const [bodyPart, setBodyPart] = useState<BodyPart>('ankle')
  const [severity, setSeverity] = useState<InjurySeverity>('mild')
  const [description, setDescription] = useState('')

  const addMut = useAddInjury()
  const delMut = useDeleteInjury()

  async function handleAdd() {
    await addMut.mutateAsync({
      profileId,
      bodyPart,
      severity,
      description: description.trim() === '' ? null : description.trim(),
      isActive: true
    })
    setDescription('')
    setBodyPart('ankle')
    setSeverity('mild')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Lesiones</CardTitle>
          <Badge variant="outline">
            {injuries.filter((i) => i.isActive).length} activas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {injuries.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No registraste ninguna lesión.
          </p>
        )}

        {injuries.length > 0 && (
          <ul className="space-y-2">
            {injuries.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {BODY_PARTS.find((b) => b.value === i.bodyPart)?.label ?? i.bodyPart}
                    </span>
                    <Badge variant={severityVariant(i.severity)} className="text-[10px]">
                      {SEVERITIES.find((s) => s.value === i.severity)?.label ?? i.severity}
                    </Badge>
                    {!i.isActive && (
                      <Badge variant="outline" className="text-[10px]">
                        Resuelta
                      </Badge>
                    )}
                  </div>
                  {i.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{i.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Desde {formatDate(i.startedAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={delMut.isPending}
                  onClick={() => {
                    if (confirm('¿Borrar esta lesión?')) {
                      void delMut.mutate({ id: i.id })
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Agregar lesión
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Select value={bodyPart} onValueChange={(v) => setBodyPart(v as BodyPart)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BODY_PARTS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={(v) => setSeverity(v as InjurySeverity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {addMut.error && (
            <Alert variant="destructive">
              <AlertDescription>{addMut.error.message}</AlertDescription>
            </Alert>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={addMut.isPending}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            {addMut.isPending ? 'Agregando…' : 'Agregar lesión'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
