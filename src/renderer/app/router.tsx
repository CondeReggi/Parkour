import { createHashRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { AssessmentPage } from '@/features/assessment/AssessmentPage'
import { MovementsPage } from '@/features/movements/MovementsPage'
import { MovementDetailPage } from '@/features/movements/MovementDetailPage'
import { RoutinesPage } from '@/features/routines/RoutinesPage'
import { RoutineDetailPage } from '@/features/routines/RoutineDetailPage'
import { TrainingPage } from '@/features/training/TrainingPage'
import { ProgressPage } from '@/features/progress/ProgressPage'
import { SpotsPage } from '@/features/spots/SpotsPage'
import { SpotNewPage } from '@/features/spots/SpotNewPage'
import { SpotDetailPage } from '@/features/spots/SpotDetailPage'
import { VideosPage } from '@/features/videos/VideosPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { AchievementsPage } from '@/features/achievements/AchievementsPage'
import { LearningPathPage } from '@/features/learningPath/LearningPathPage'

/**
 * Hash router porque en producción Electron carga vía file:// y el
 * BrowserRouter no funciona ahí. Hash funciona idéntico en dev y prod.
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'assessment', element: <AssessmentPage /> },
      { path: 'movements', element: <MovementsPage /> },
      { path: 'movements/:slug', element: <MovementDetailPage /> },
      { path: 'learning-path', element: <LearningPathPage /> },
      { path: 'routines', element: <RoutinesPage /> },
      { path: 'routines/:slug', element: <RoutineDetailPage /> },
      { path: 'training', element: <TrainingPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'achievements', element: <AchievementsPage /> },
      { path: 'spots', element: <SpotsPage /> },
      { path: 'spots/new', element: <SpotNewPage /> },
      { path: 'spots/:id', element: <SpotDetailPage /> },
      { path: 'videos', element: <VideosPage /> },
      { path: 'settings', element: <SettingsPage /> }
    ]
  }
])
