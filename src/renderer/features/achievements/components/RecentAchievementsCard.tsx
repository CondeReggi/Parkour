import { Link } from 'react-router-dom'
import { ArrowRight, Award } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRecentAchievements } from '../hooks/useAchievements'
import { CATEGORY_ICON, CATEGORY_LABEL } from './achievementEnums'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'short'
  })
}

export function RecentAchievementsCard() {
  const { data, isLoading } = useRecentAchievements()

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Logros recientes
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link to="/achievements">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <ul className="space-y-3 animate-pulse">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-md bg-muted/70 flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3 rounded bg-muted/60 w-2/3" />
                  <div className="h-2.5 rounded bg-muted/40 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        )}
        {!isLoading && (!data || data.length === 0) && (
          <div className="text-center py-4 space-y-2">
            <div className="mx-auto h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center">
              <Award className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Todavía no desbloqueaste logros. Sumá tu primer hito hoy.
            </p>
          </div>
        )}
        {data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((a) => {
              const Icon = CATEGORY_ICON[a.category]
              return (
                <li
                  key={a.slug}
                  className="flex items-start gap-2.5"
                >
                  <div className="h-7 w-7 rounded-md bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      {a.xpReward > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] tabular-nums flex-shrink-0"
                        >
                          +{a.xpReward} XP
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {CATEGORY_LABEL[a.category]}
                      {a.unlockedAt && ' · ' + formatDate(a.unlockedAt)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
