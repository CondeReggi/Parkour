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
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { PublicProfilePage } from '@/features/publicProfile/PublicProfilePage'
import { CommunityPage } from '@/features/community/CommunityPage'
import { MyPostsPage } from '@/features/community/MyPostsPage'
import { PostDetailPage } from '@/features/community/PostDetailPage'
import { PostEditorPage } from '@/features/community/PostEditorPage'

/**
 * Hash router porque en producción Electron carga vía file:// y el
 * BrowserRouter no funciona ahí. Hash funciona idéntico en dev y prod.
 */
export const router = createHashRouter([
  // Rutas de auth — fuera del AppLayout para que tengan su propio
  // shell centrado (sin sidebar). Son públicas: cualquier usuario las
  // puede visitar, esté logueado o no.
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    // Todo lo de adentro requiere sesión activa. Sin auth, el guard
    // redirige a /login antes de montar el layout.
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
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
      { path: 'settings', element: <SettingsPage /> },
      // Vista pública por username — `/u/:username`. Hoy resuelve sólo
      // perfiles locales, pero queda lista para el futuro sync remoto.
      // La edición vive dentro de /profile como una sección más.
      { path: 'u/:username', element: <PublicProfilePage /> },
      // Comunidad — base de publicaciones tipo foro/feed.
      { path: 'community', element: <CommunityPage /> },
      { path: 'community/mine', element: <MyPostsPage /> },
      { path: 'community/new', element: <PostEditorPage /> },
      { path: 'community/posts/:id', element: <PostDetailPage /> },
      { path: 'community/posts/:id/edit', element: <PostEditorPage /> }
    ]
  }
])
