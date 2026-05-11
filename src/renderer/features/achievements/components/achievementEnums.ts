import {
  Activity,
  Calendar,
  HeartPulse,
  MapPin,
  Trophy,
  Video,
  type LucideIcon
} from 'lucide-react'
import type { AchievementCategory } from '@shared/types/achievement'

export const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  sessions: 'Sesiones',
  movements: 'Movimientos',
  videos: 'Videos',
  spots: 'Spots',
  consistency: 'Constancia',
  wellness: 'Bienestar'
}

export const CATEGORY_ICON: Record<AchievementCategory, LucideIcon> = {
  sessions: Activity,
  movements: Trophy,
  videos: Video,
  spots: MapPin,
  consistency: Calendar,
  wellness: HeartPulse
}

export const CATEGORY_ORDER: AchievementCategory[] = [
  'sessions',
  'movements',
  'consistency',
  'wellness',
  'videos',
  'spots'
]
