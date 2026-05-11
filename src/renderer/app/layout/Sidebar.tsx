import { NavLink } from 'react-router-dom'
import { navItems } from '../nav'
import { cn } from '@/lib/utils'

export function Sidebar() {
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

      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground">v0.1.0 · MVP local-first</p>
      </div>
    </aside>
  )
}
