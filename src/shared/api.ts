/**
 * Contrato del bridge IPC entre el proceso main y el renderer.
 * Esta es la única fuente de verdad de lo que está expuesto en `window.parkourApi`.
 *
 * Reglas:
 *  - Sólo tipos planos serializables (JSON-friendly).
 *  - Cada feature suma su sub-namespace (ej: movements, profile, ...).
 *  - Toda llamada devuelve Promise — el IPC es asíncrono incluso si el handler es sync.
 */

import type { MovementDto } from './types/movement'
import type { MovementRecommendationDto } from './types/movementRecommendation'
import type { InjuryDto, ProfileDto } from './types/profile'
import type { AssessmentDto } from './types/assessment'
import type { RoutineDto, RoutineRecommendationDto } from './types/routine'
import type { SessionDto } from './types/session'
import type { SessionStatsDto } from './types/stats'
import type {
  PickedSpotPhoto,
  SpotDto,
  SpotObstacleDto,
  SpotPhotoDto
} from './types/spot'
import type { PickedVideo, VideoDto } from './types/video'
import type {
  AppSettingsDto,
  BackupResult,
  ExportResult,
  ImportResult
} from './types/settings'
import type { UpdateThemeInput } from './schemas/settings.schemas'
import type {
  GamificationStateDto,
  XpBreakdownDto,
  XpEventDto
} from './types/gamification'
import type { ClaimQuestResultDto, QuestsListDto } from './types/quest'
import type { ClaimQuestInput } from './schemas/quest.schemas'
import type {
  AchievementDto,
  AchievementsListDto
} from './types/achievement'
import type { DailyActivityDto, StreakStateDto } from './types/streak'
import type { ProgressInsightsDto } from './types/progressInsights'
import type {
  AuthAccountDto,
  AuthStateDto,
  SignInResultDto
} from './types/auth'
import type {
  LoginInput,
  RegisterInput
} from './schemas/auth.schemas'
import type { MarkActiveRecoveryInput } from './schemas/streak.schemas'
import type {
  CreateProfileInput,
  UpdateProfileInput
} from './schemas/profile.schemas'
import type {
  AddInjuryInput,
  UpdateInjuryInput
} from './schemas/injury.schemas'
import type { CreateAssessmentInput } from './schemas/assessment.schemas'
import type {
  GetMovementBySlugInput,
  SetMovementProgressInput
} from './schemas/movement.schemas'
import type {
  FinalizeSessionInput,
  StartSessionInput
} from './schemas/session.schemas'
import type {
  AddObstacleInput,
  AddSpotPhotoInput,
  CreateSpotInput,
  SetIdealMovementsInput,
  SetObstacleMovementsInput,
  SetSpotFavoriteInput,
  UpdateObstacleInput,
  UpdateSpotInput,
  UpdateSpotPhotoInput
} from './schemas/spot.schemas'
import type {
  CreateVideoInput,
  UpdateVideoInput
} from './schemas/video.schemas'

export interface ParkourApi {
  /** Health check del bridge: el preload responde 'pong' sin tocar el main. */
  ping: () => string

  movements: {
    getAll: () => Promise<MovementDto[]>
    getBySlug: (input: GetMovementBySlugInput) => Promise<MovementDto | null>
    setProgress: (input: SetMovementProgressInput) => Promise<MovementDto>
    recommendForActive: () => Promise<MovementRecommendationDto[]>
  }

  profile: {
    getActive: () => Promise<ProfileDto | null>
    create: (input: CreateProfileInput) => Promise<ProfileDto>
    update: (input: UpdateProfileInput) => Promise<ProfileDto>
    addInjury: (input: AddInjuryInput) => Promise<InjuryDto>
    updateInjury: (input: UpdateInjuryInput) => Promise<InjuryDto>
    deleteInjury: (input: { id: string }) => Promise<void>
  }

  assessment: {
    create: (input: CreateAssessmentInput) => Promise<AssessmentDto>
    listForActive: () => Promise<AssessmentDto[]>
    latest: () => Promise<AssessmentDto | null>
  }

  routines: {
    getAll: () => Promise<RoutineDto[]>
    getBySlug: (input: { slug: string }) => Promise<RoutineDto | null>
    recommendForActive: () => Promise<RoutineRecommendationDto | null>
  }

  sessions: {
    start: (input: StartSessionInput) => Promise<SessionDto>
    getActive: () => Promise<SessionDto | null>
    finalize: (input: FinalizeSessionInput) => Promise<SessionDto>
    cancel: (input: { id: string }) => Promise<void>
    listForActive: () => Promise<SessionDto[]>
    getById: (input: { id: string }) => Promise<SessionDto | null>
    getStats: () => Promise<SessionStatsDto>
  }

  spots: {
    getAll: () => Promise<SpotDto[]>
    getById: (input: { id: string }) => Promise<SpotDto | null>
    create: (input: CreateSpotInput) => Promise<SpotDto>
    update: (input: UpdateSpotInput) => Promise<SpotDto>
    delete: (input: { id: string }) => Promise<void>
    setFavorite: (input: SetSpotFavoriteInput) => Promise<SpotDto>
    addObstacle: (input: AddObstacleInput) => Promise<SpotObstacleDto>
    updateObstacle: (input: UpdateObstacleInput) => Promise<SpotObstacleDto>
    deleteObstacle: (input: { id: string }) => Promise<void>
    setObstacleMovements: (input: SetObstacleMovementsInput) => Promise<SpotObstacleDto>
    setIdealMovements: (input: SetIdealMovementsInput) => Promise<SpotDto>
    addPhoto: (input: AddSpotPhotoInput) => Promise<SpotPhotoDto>
    updatePhoto: (input: UpdateSpotPhotoInput) => Promise<SpotPhotoDto>
    deletePhoto: (input: { id: string }) => Promise<void>
    /** Abre el file picker nativo para una imagen. null si el usuario cancela. */
    pickPhoto: () => Promise<PickedSpotPhoto | null>
  }

  videos: {
    getAll: () => Promise<VideoDto[]>
    getById: (input: { id: string }) => Promise<VideoDto | null>
    create: (input: CreateVideoInput) => Promise<VideoDto>
    update: (input: UpdateVideoInput) => Promise<VideoDto>
    delete: (input: { id: string }) => Promise<void>
    /** Abre el file picker nativo. Devuelve null si el usuario cancela. */
    pickFile: () => Promise<PickedVideo | null>
  }

  settings: {
    get: () => Promise<AppSettingsDto>
    setTheme: (input: UpdateThemeInput) => Promise<AppSettingsDto>
    /** Devuelve null si el usuario cancela el dialog. */
    exportJson: () => Promise<ExportResult | null>
    /** Devuelve null si el usuario cancela el dialog. */
    importJson: () => Promise<ImportResult | null>
    /** Devuelve null si el usuario cancela el dialog. */
    backupDb: () => Promise<BackupResult | null>
    /** Si retorna { relaunching: true }, la app va a cerrarse en milisegundos. */
    restoreDb: () => Promise<{ relaunching: true } | null>
  }

  gamification: {
    /** Nivel y progreso del perfil activo. Sin perfil activo, level=1 y XP=0. */
    getState: () => Promise<GamificationStateDto>
    /** Últimos N eventos de XP del perfil activo, más recientes primero. */
    listEvents: () => Promise<XpEventDto[]>
    /** Distribución de XP por fuente + recompensa por evento (tarifario). */
    getBreakdown: () => Promise<XpBreakdownDto>
  }

  quests: {
    /**
     * Misiones activas (daily + weekly) del perfil activo. Si no hay
     * misiones para el período actual, las genera automáticamente.
     */
    listForActive: () => Promise<QuestsListDto>
    /** Reclama una misión completada. Otorga XP y devuelve el resultado. */
    claim: (input: ClaimQuestInput) => Promise<ClaimQuestResultDto>
  }

  achievements: {
    /** Catálogo completo cruzado con el estado del perfil activo. */
    listForActive: () => Promise<AchievementsListDto>
    /** Últimos N logros desbloqueados, más recientes primero. */
    recentForActive: () => Promise<AchievementDto[]>
  }

  streak: {
    /** Racha inteligente del perfil activo + recomendación del día. */
    getState: () => Promise<StreakStateDto>
    /**
     * Marca el día indicado (default hoy) como recuperación activa.
     * Idempotente: marcar dos veces el mismo día devuelve la fila ya
     * existente sin cambios.
     */
    markActiveRecovery: (
      input: MarkActiveRecoveryInput
    ) => Promise<DailyActivityDto>
  }

  progress: {
    /**
     * Insights de progreso del perfil activo: resumen semanal,
     * comparación con la semana anterior, categoría top, movimientos
     * cerca de dominar y texto interpretativo.
     */
    getInsights: () => Promise<ProgressInsightsDto>
  }

  auth: {
    /**
     * Estado completo de auth: mode (local | authenticated), cuenta
     * actual (sin tokens) y datos de la sesión. Es lo que consume la
     * UI para decidir si mostrar login/registro o el contenido normal.
     */
    getState: () => Promise<AuthStateDto>
    /** Registra una cuenta local con email + password. */
    register: (input: RegisterInput) => Promise<SignInResultDto>
    /** Login con email + password. */
    login: (input: LoginInput) => Promise<SignInResultDto>
    /**
     * Inicia el flujo OAuth con Google. El proceso main levanta un
     * servidor local, abre el navegador del SO y espera el callback.
     */
    signInWithGoogle: () => Promise<SignInResultDto>
    /** Cierra sesión: revoca la session activa, conserva la cuenta. */
    logout: () => Promise<void>
    /** Limpia sesión sin tirar error: "decidí seguir sin cuenta". */
    continueLocal: () => Promise<void>
    /**
     * Asocia el perfil activo a la cuenta autenticada (si la hay).
     * Devuelve la cuenta actualizada o null si no hay sesión.
     */
    linkCurrentProfile: () => Promise<AuthAccountDto | null>
  }
}
