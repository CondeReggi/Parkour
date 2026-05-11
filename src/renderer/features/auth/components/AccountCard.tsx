import { LogOut, ShieldCheck, UserCircle2 } from 'lucide-react'
import type { AuthAccountDto } from '@shared/types/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  account: AuthAccountDto
  onSignOut: () => void
  signingOut?: boolean
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Card "tu cuenta" — se muestra cuando hay sesión iniciada. Incluye
 * avatar (si Google lo devolvió), email, nombre, badge de provider y
 * botón de cerrar sesión.
 *
 * Nota sobre avatares: la URL viene del CDN de Google (lh3.googleusercontent.com).
 * No la cacheamos localmente — si el usuario está offline, el avatar
 * cae al fallback con ícono `UserCircle2`.
 */
export function AccountCard({ account, onSignOut, signingOut }: Props) {
  return (
    <div className="flex items-start gap-4">
      <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border">
        {account.avatarUrl ? (
          <img
            src={account.avatarUrl}
            alt={account.displayName ?? account.email}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Si el avatar no carga (offline, blocked), mostramos
              // el placeholder.
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <UserCircle2 className="h-7 w-7 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold leading-tight truncate">
            {account.displayName ?? account.email}
          </p>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <ShieldCheck className="h-3 w-3" />
            Google
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {account.email}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Último login: {formatDate(account.lastLoginAt)}
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onSignOut}
        disabled={signingOut}
        className="text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? 'Cerrando…' : 'Cerrar sesión'}
      </Button>
    </div>
  )
}
