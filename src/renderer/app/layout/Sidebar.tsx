import { Link, NavLink } from 'react-router-dom'
import { LogIn, LogOut, UserCircle2 } from 'lucide-react'
import { navItems } from '../nav'
import { cn } from '@/lib/utils'
import { useAuthState, useLogout } from '@/features/auth/hooks/useAuth'

export function Sidebar() {
  const { data: state } = useAuthState()
  const logoutMut = useLogout()

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-card flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">PK</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Parkour App</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Entrenamiento
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/*
       * Footer del sidebar: indicador de cuenta.
       *  - Sin sesión → invita a iniciar sesión.
       *  - Con sesión → avatar/nombre + botón logout.
       */}
      <div className="px-3 py-3 border-t border-border">
        {state?.account ? (
          <div className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border">
              {state.account.avatarUrl ? (
                <img
                  src={state.account.avatarUrl}
                  alt={state.account.displayName ?? state.account.email}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCircle2 className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">
                {state.account.displayName ?? state.account.email}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {state.account.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => logoutMut.mutate()}
              disabled={logoutMut.isPending}
              className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted/50"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4" />
              Modo local
            </span>
            <span className="inline-flex items-center gap-1 text-primary">
              <LogIn className="h-3 w-3" />
              Entrar
            </span>
          </Link>
        )}
        <p className="text-[10px] text-muted-foreground mt-2">
          v0.1.0 · MVP local-first
        </p>
      </div>
    </aside>
  )
}
