import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  initialBody?: string
  onSubmit: (body: string) => Promise<void> | void
  onCancel?: () => void
  submitting?: boolean
  error?: string | null
  /** Placeholder dinámico. Sirve para distinguir formulario principal de respuestas. */
  placeholder?: string
  /** Label del submit. Default "Comentar". */
  submitLabel?: string
  autoFocus?: boolean
}

/**
 * Form reutilizable de comentario. Lo usan:
 *  - El form principal abajo del listado.
 *  - El form de respuesta debajo de cada comentario top-level.
 *  - El form de edición inline.
 *
 * El parent maneja el submit (crear/actualizar) y los reset.
 */
export function CommentForm({
  initialBody = '',
  onSubmit,
  onCancel,
  submitting,
  error,
  placeholder = 'Escribí tu comentario…',
  submitLabel = 'Comentar',
  autoFocus
}: Props) {
  const [body, setBody] = useState(initialBody)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (trimmed.length === 0) return
    await onSubmit(trimmed)
    setBody('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={2000}
        disabled={submitting}
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={submitting || body.trim().length === 0}
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Enviando…' : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </Button>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto">
          {body.length}/2000
        </span>
      </div>
    </form>
  )
}
