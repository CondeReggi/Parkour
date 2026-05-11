/**
 * Configuración central de navegación. Punto único para agregar/quitar secciones.
 * El sidebar y el router consumen ambos esta lista.
 */

import {
  Activity,
  Award,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  MapPin,
  PlayCircle,
  Settings,
  TrendingUp,
  User,
  Video,
  Waypoints
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Perfil', icon: User },
  { to: '/assessment', label: 'Evaluación', icon: ClipboardCheck },
  { to: '/movements', label: 'Movimientos', icon: Activity },
  { to: '/learning-path', label: 'Camino', icon: Waypoints },
  { to: '/routines', label: 'Rutinas', icon: ListChecks },
  { to: '/training', label: 'Entrenar hoy', icon: PlayCircle },
  { to: '/progress', label: 'Progreso', icon: TrendingUp },
  { to: '/achievements', label: 'Logros', icon: Award },
  { to: '/spots', label: 'Spots', icon: MapPin },
  { to: '/videos', label: 'Videos', icon: Video },
  { to: '/settings', label: 'Configuración', icon: Settings }
]
