import { Check, Sparkles, Target } from 'lucide-react'
import type { QuestDto } from '@shared/types/quest'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQuests } from '../hooks/useQuests'
import { useClaimQuest } from '../hooks/useQuestMutations'

function QuestRow({ quest }: { quest: QuestDto }) {
  const claimMut = useClaimQuest()
  const pct = Math.min(
    100,
    Math.floor((quest.progress / Math.max(1, quest.target)) * 100)
  )
  const isClaimed = quest.status === 'claimed'
  const isCompleted = quest.status === 'completed'

  return (
    <li
      className={
        'space-y-2 ' +
        (isClaimed ? 'opacity-60' : '')
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{quest.title}</p>
            {isClaimed && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Check className="h-3 w-3" />
                Reclamada
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="default" className="text-[10px]">
                Completada
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{quest.description}</p>
        </div>
        <Badge variant="outline" className="flex-shrink-0 tabular-nums">
          +{quest.xpReward} XP
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <div
            className={
              'h-full transition-all ' +
              (isCompleted || isClaimed ? 'bg-primary' : 'bg-primary/70')
            }
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums flex-shrink-0">
          {quest.progress} / {quest.target}
        </span>
        {isCompleted && (
          <Button
            type="button"
            size="sm"
            className="h-7 px-2.5 text-xs flex-shrink-0"
            onClick={() => claimMut.mutate({ id: quest.id })}
            disabled={claimMut.isPending}
          >
            {claimMut.isPending ? 'Reclamando…' : 'Reclamar'}
          </Button>
        )}
      </div>
    </li>
  )
}

function QuestSection({
  label,
  icon: Icon,
  quests
}: {
  label: string
  icon: typeof Target
  quests: QuestDto[]
}) {
  if (quests.length === 0) return null
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <ul className="space-y-3.5">
        {quests.map((q) => (
          <QuestRow key={q.id} quest={q} />
        ))}
      </ul>
    </section>
  )
}

export function QuestsCard() {
  const { data, isLoading } = useQuests()

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="pt-5 pb-5">
          <p className="text-sm text-muted-foreground">Cargando misiones…</p>
        </CardContent>
      </Card>
    )
  }

  const { daily, weekly } = data
  const totalActive = daily.length + weekly.length
  const completed = [...daily, ...weekly].filter(
    (q) => q.status === 'completed'
  ).length

  if (totalActive === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Misiones</CardTitle>
          <CardDescription>
            No hay misiones disponibles. Creá un perfil para que se generen
            automáticamente.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Misiones
            </CardTitle>
            <CardDescription>
              Objetivos cortos que suman XP cuando los reclamás.
            </CardDescription>
          </div>
          {completed > 0 && (
            <Badge variant="default" className="text-[10px]">
              {completed} para reclamar
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <QuestSection label="Hoy" icon={Target} quests={daily} />
        <QuestSection label="Esta semana" icon={Target} quests={weekly} />
      </CardContent>
    </Card>
  )
}
