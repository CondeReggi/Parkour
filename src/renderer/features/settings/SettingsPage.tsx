import { useState } from 'react'
import {
  Database,
  Download,
  FileJson,
  Moon,
  Skull,
  Sun,
  Upload,
  type LucideIcon
} from 'lucide-react'
import type { Theme } from '@shared/types/settings'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAppSettings, useSetTheme } from './hooks/useAppSettings'
import { useQueryClient } from '@tanstack/react-query'
import { AuthSection } from '@/features/auth/components/AuthSection'

type FeedbackKind = 'success' | 'error'
interface Feedback {
  kind: FeedbackKind
  message: string
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Nunca'
  return new Date(iso).toLocaleString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function SettingsPage() {
  const settingsQ = useAppSettings()
  const setThemeMut = useSetTheme()
  const qc = useQueryClient()

  const [busy, setBusy] = useState<null | 'export' | 'import' | 'backup' | 'restore'>(
    null
  )
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [confirmImport, setConfirmImport] = useState(false)

  const theme: Theme = settingsQ.data?.theme ?? 'dark'

  function clearFeedback() {
    setFeedback(null)
  }

  async function onPickTheme(next: Theme) {
    if (next === theme) return
    clearFeedback()
    try {
      await setThemeMut.mutateAsync(next)
    } catch (e) {
      setFeedback({
        kind: 'error',
        message: e instanceof Error ? e.message : String(e)
      })
    }
  }

  async function onExport() {
    clearFeedback()
    setBusy('export')
    try {
      const result = await window.parkourApi.settings.exportJson()
      if (result) {
        setFeedback({
          kind: 'success',
          message: `Datos exportados a ${result.filePath}`
        })
      }
    } catch (e) {
      setFeedback({
        kind: 'error',
        message: e instanceof Error ? e.message : String(e)
      })
    } finally {
      setBusy(null)
    }
  }

  async function doImport() {
    clearFeedback()
    setConfirmImport(false)
    setBusy('import')
    try {
      const result = await window.parkourApi.settings.importJson()
      if (result) {
        setFeedback({
          kind: 'success',
          message: `Importados ${result.recordCount} registros. Los datos previos del usuario fueron reemplazados.`
        })
        // Toda la cache de queries quedó obsoleta.
        await qc.invalidateQueries()
      }
    } catch (e) {
      setFeedback({
        kind: 'error',
        message: e instanceof Error ? e.message : String(e)
      })
    } finally {
      setBusy(null)
    }
  }

  async function onBackup() {
    clearFeedback()
    setBusy('backup')
    try {
      const result = await window.parkourApi.settings.backupDb()
      if (result) {
        setFeedback({
          kind: 'success',
          message: `Backup creado en ${result.filePath}`
        })
        await qc.invalidateQueries({ queryKey: ['settings'] })
      }
    } catch (e) {
      setFeedback({
        kind: 'error',
        message: e instanceof Error ? e.message : String(e)
      })
    } finally {
      setBusy(null)
    }
  }

  async function doRestore() {
    clearFeedback()
    setConfirmRestore(false)
    setBusy('restore')
    try {
      const result = await window.parkourApi.settings.restoreDb()
      if (result?.relaunching) {
        setFeedback({
          kind: 'success',
          message: 'Restauración exitosa. Reiniciando la app…'
        })
      }
    } catch (e) {
      setFeedback({
        kind: 'error',
        message: e instanceof Error ? e.message : String(e)
      })
      setBusy(null)
    }
    // Si relaunching=true, el proceso se va a terminar antes de que limpiemos.
  }

  return (
    <div className="px-8 py-6 max-w-3xl space-y-6">
      <PageHeader
        title="Configuración"
        description="Preferencias visuales y gestión de tus datos locales."
      />

      {feedback && (
        <Alert variant={feedback.kind === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      {/* === Apariencia === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apariencia</CardTitle>
          <CardDescription>
            Tres paletas pensadas para distintos momentos. Se guarda en la base
            local y se incluye en el backup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ThemeOption
              value="light"
              current={theme}
              onPick={onPickTheme}
              icon={Sun}
              title="Urban Light"
              subtitle="Claro, deportivo, profesional"
              disabled={setThemeMut.isPending}
            />
            <ThemeOption
              value="dark"
              current={theme}
              onPick={onPickTheme}
              icon={Moon}
              title="Asphalt Dark"
              subtitle="Noche urbana, foco, entrenamiento callejero"
              disabled={setThemeMut.isPending}
            />
            <ThemeOption
              value="gotham"
              current={theme}
              onPick={onPickTheme}
              icon={Skull}
              title="Gotham"
              subtitle="Paleta original, sobria y dura"
              disabled={setThemeMut.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* === Cuenta / Auth === */}
      <AuthSection />

      {/* === Datos del usuario (JSON) === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            Datos del usuario
          </CardTitle>
          <CardDescription>
            Exportar/importar tu perfil, lesiones, evaluaciones, progreso,
            sesiones, spots y videos en un archivo JSON. La biblioteca de
            movimientos y rutinas built-in no se incluyen — se regeneran del
            seed al instalar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={!!busy}
            >
              <Download className="h-4 w-4" />
              {busy === 'export' ? 'Exportando…' : 'Exportar a JSON'}
            </Button>

            {confirmImport ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Esto reemplaza tus datos actuales. ¿Seguir?
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={doImport}
                  disabled={!!busy}
                >
                  {busy === 'import' ? 'Importando…' : 'Sí, importar'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmImport(false)}
                  disabled={!!busy}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmImport(true)}
                disabled={!!busy}
              >
                <Upload className="h-4 w-4" />
                Importar desde JSON
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* === Backup binario === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup completo
          </CardTitle>
          <CardDescription>
            Copia binaria del archivo de la base local (.db). Es la forma más
            fiel de restaurar todo, incluido el contenido built-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Último backup:{' '}
            <Badge variant="outline" className="font-normal">
              {formatDate(settingsQ.data?.lastBackupAt ?? null)}
            </Badge>
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBackup}
              disabled={!!busy}
            >
              <Download className="h-4 w-4" />
              {busy === 'backup' ? 'Generando…' : 'Crear backup .db'}
            </Button>

            {confirmRestore ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Esto sobrescribe la base actual y reinicia la app. ¿Seguir?
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={doRestore}
                  disabled={!!busy}
                >
                  {busy === 'restore' ? 'Restaurando…' : 'Sí, restaurar'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRestore(false)}
                  disabled={!!busy}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmRestore(true)}
                disabled={!!busy}
              >
                <Upload className="h-4 w-4" />
                Restaurar desde backup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ThemeOptionProps {
  value: Theme
  current: Theme
  onPick: (t: Theme) => void
  icon: LucideIcon
  title: string
  subtitle: string
  disabled?: boolean
}

/**
 * Card pickable de un tema. Marca con borde primario cuando es la opción
 * activa. El click dispara la mutación del provider; no maneja loading
 * propio (el botón general queda disabled durante la mutación).
 */
function ThemeOption({
  value,
  current,
  onPick,
  icon: Icon,
  title,
  subtitle,
  disabled
}: ThemeOptionProps) {
  const isActive = current === value
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      disabled={disabled}
      className={cn(
        'group text-left rounded-md border p-4 transition-colors',
        'flex flex-col gap-2 min-h-[6rem]',
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/40 hover:bg-secondary/40',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
      aria-pressed={isActive}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className={cn(
            'h-8 w-8 rounded-md flex items-center justify-center',
            isActive
              ? 'bg-primary/15 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        {isActive && (
          <span className="text-[10px] uppercase tracking-wider text-primary">
            Activo
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          {subtitle}
        </p>
      </div>
    </button>
  )
}
