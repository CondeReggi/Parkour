import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { ProfileDto } from '@shared/types/profile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LevelBadge } from '@/features/profile/components/LevelBadge'

interface Props {
  profile: ProfileDto
  hasActiveSession: boolean
}

export function HeroCard({ profile, hasActiveSession }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Hola, {profile.name}</h1>
            <p className="text-sm text-muted-foreground">
              {hasActiveSession
                ? 'Tenés un entrenamiento en curso.'
                : '¿Listo para entrenar?'}
            </p>
          </div>
          <LevelBadge level={profile.level} />
        </div>
        <div className="mt-5 flex justify-end">
          <Button asChild>
            <Link to="/training">
              <Play className="h-4 w-4" />
              {hasActiveSession ? 'Continuar entrenamiento' : 'Entrenar hoy'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
