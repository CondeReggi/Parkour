import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useActiveProfile } from './hooks/useActiveProfile'
import { ProfileForm } from './components/ProfileForm'
import { InjuriesPanel } from './components/InjuriesPanel'
import { LevelBadge } from './components/LevelBadge'
import { PublicProfileSection } from '@/features/publicProfile/components/PublicProfileSection'

export function ProfilePage() {
  const { data: profile, isLoading, error } = useActiveProfile()

  return (
    <div className="px-8 py-6 max-w-3xl">
      <PageHeader
        title="Perfil"
        description={
          profile
            ? 'Tus datos personales, experiencia, lesiones y tu perfil público.'
            : 'Empezá creando tu perfil. Estos datos se usan para personalizar las rutinas.'
        }
      >
        {profile && <LevelBadge level={profile.level} />}
      </PageHeader>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {error instanceof Error ? error.message : String(error)}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground">Cargando perfil…</p>
      )}

      {!isLoading && (
        <div className="space-y-6">
          <ProfileForm initial={profile ?? undefined} />
          {profile && (
            <InjuriesPanel profileId={profile.id} injuries={profile.injuries} />
          )}
          {/*
            Perfil público — sección que vive junto al perfil personal.
            En modo local muestra un CTA a /login en lugar del editor.
          */}
          <PublicProfileSection />
        </div>
      )}
    </div>
  )
}
