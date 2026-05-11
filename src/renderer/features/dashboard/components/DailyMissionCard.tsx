import { useState } from 'react'
import { Check, Target } from 'lucide-react'
import type { QuestDto } from '@shared/types/quest'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog'
import { useQuests } from '@/features/quests/hooks/useQuests'
import { useClaimQuest } from '@/features/quests/hooks/useQuestMutations'
import { QuestsCard } from '@/features/quests/components/QuestsCard'
import { DashboardCardSkeleton } from './DashboardCardSkeleton'

/**
 * Elige la misión a destacar: primero las completed sin reclamar
 * (ordenadas por mayor recompensa), luego las pending con mayor
 * progreso relativo, luego las pending con mayor recompensa. Prefiere
 * dailies sobre weekly.
 */
function pickPrimary(daily: QuestDto[], weekly: QuestDto[]): QuestDto | null {
  const score = (q: QuestDto): number => {
    if (q.status === 'completed') return 1000 + q.xpReward
    if (q.status === 'claimed') return -1
    const ratio = q.target === 0 ? 0 : q.progress / q.target
    return 100 + ratio * 100 + q.xpReward / 10
  }
  const pool = [...daily.map((q) => ({ q, tier: 1 })), ...weekly.map((q) => ({ q, tier: 0 }))]
  const candidates = pool.filter((p) => p.q.status !== 'claimed')
  if (candidates.length === 0) return null
  candidates.sort((a, b) => {
    if (a.tier !== b.tier) return b.tier - a.tier
    return score(b.q) - score(a.q)
  })
  return candidates[0]?.q ?? null
}

export function DailyMissionCard() {
  const { data, isLoading } = useQuests()
  const claimMut = useClaimQuest()
  const [showAll, setShowAll] = useState(false)

  if (isLoading || !data) return <DashboardCardSkeleton lines={3} />

  const allActive = [...data.daily, ...data.weekly].filter(
    (q) => q.status !== 'claimed'
  )
  const primary = pickPrimary(data.daily, data.weekly)
  const completedCount = allActive.filter((q) => q.status === 'completed').length
  const remaining = allActive.length - (primary ? 1 : 0)

  return (
    <>
      <Card className="h-full">
        <CardContent className="pt-5 pb-5 space-y-4 h-full flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-md bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Misión del día
                </p>
                {primary ? (
                  <p className="text-sm font-medium leading-snug">
                    {primary.title}
                  </p>
                ) : (
                  <p className="text-sm font-medium leading-snug">
                    Todo al día
                  </p>
                )}
              </div>
            </div>
            {completedCount > 0 && (
              <Badge variant="default" className="text-[10px] flex-shrink-0">
                {completedCount} listas
              </Badge>
            )}
          </div>

          {primary ? (
            <>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                {primary.description}
              </p>

              <div className="space-y-1.5 mt-auto">
                <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={
                      'h-full transition-all duration-500 ' +
                      (primary.status === 'completed'
                        ? 'bg-primary'
                        : 'bg-primary/70')
                    }
                    style={{
                      width: `${
                        primary.target === 0
                          ? 0
                          : Math.min(
                              100,
                              Math.floor(
                                (primary.progress / primary.target) * 100
                              )
                            )
                      }%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] tabular-nums">
                  <span className="text-muted-foreground">
                    {primary.progress} / {primary.target}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    +{primary.xpReward} XP
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {primary.status === 'completed' ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => claimMut.mutate({ id: primary.id })}
                    disabled={claimMut.isPending}
                  >
                    <Check className="h-4 w-4" />
                    {claimMut.isPending ? 'Reclamando…' : 'Reclamar XP'}
                  </Button>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    {primary.type === 'daily'
                      ? 'Vence al final del día'
                      : 'Vence el domingo'}
                  </span>
                )}
                {remaining > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowAll(true)}
                  >
                    Ver {remaining} más
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-2 space-y-2 mt-auto">
              <p className="text-sm text-muted-foreground">
                Reclamaste todas las misiones activas. Volvé mañana por las
                nuevas.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
              >
                Ver historial
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-w-2xl max-h-[calc(100vh-4rem)] flex flex-col">
          <DialogHeader>
            <DialogTitle>Todas las misiones</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex-1 overflow-y-auto pb-2">
            <QuestsCard />
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAll(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
