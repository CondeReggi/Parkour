import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useActiveProfile } from '@/features/profile/hooks/useActiveProfile'
import { LevelBadge } from '@/features/profile/components/LevelBadge'
import { AssessmentForm } from './components/AssessmentForm'
import { PastAssessments } from './components/PastAssessments'

export function AssessmentPage() {
  const { data: profile, isLoading } = useActiveProfile()

  if (isLoading) {
    return (
      <div className="px-8 py-6">
        <PageHeader title="Evaluación inicial" />
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="px-8 py-6 max-w-2xl">
        <PageHeader title="Evaluación inicial" />
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Necesitás crear tu perfil antes de hacer la evaluación.</span>
            <Button asChild size="sm">
              <Link to="/profile">Ir a Perfil</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="px-8 py-6 max-w-3xl">
      <PageHeader
        title="Evaluación inicial"
        description="Completá lo que puedas. Cada evaluación recalcula tu nivel."
      >
        <LevelBadge level={profile.level} />
      </PageHeader>

      <div className="space-y-6">
        <AssessmentForm />
        <PastAssessments />
      </div>
    </div>
  )
}
