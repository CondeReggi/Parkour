import { useMemo } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MotionPage } from '@/components/motion/MotionPage'
import { MotionList, MotionListItem } from '@/components/motion/MotionList'
import { useAchievementsList } from './hooks/useAchievements'
import { AchievementCard } from './components/AchievementCard'
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER
} from './components/achievementEnums'
import type { AchievementCategory, AchievementDto } from '@shared/types/achievement'

export function AchievementsPage() {
  const { data, isLoading, error } = useAchievementsList()

  const grouped = useMemo(() => {
    const map = new Map<AchievementCategory, AchievementDto[]>()
    if (!data) return map
    for (const a of [...data.unlocked, ...data.locked]) {
      const arr = map.get(a.category) ?? []
      arr.push(a)
      map.set(a.category, arr)
    }
    // Dentro de cada categoría: primero desbloqueados (orden por fecha desc),
    // después bloqueados (orden del catálogo).
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
        if (a.unlocked && b.unlocked) {
          const ta = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0
          const tb = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0
          return tb - ta
        }
        return 0
      })
    }
    return map
  }, [data])

  return (
    <MotionPage className="px-8 py-6 max-w-5xl space-y-6">
      <PageHeader
        title="Logros"
        description="Hitos que se desbloquean automáticamente cuando alcanzás cierto progreso."
      >
        {data && (
          <Badge variant="outline" className="tabular-nums">
            {data.unlockedCount} / {data.totalCount}
          </Badge>
        )}
      </PageHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : String(error)}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {data && data.totalCount === 0 && (
        <Alert>
          <AlertDescription>
            Todavía no hay logros disponibles.
          </AlertDescription>
        </Alert>
      )}

      {data &&
        CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat) ?? []
          if (items.length === 0) return null
          const unlockedInCat = items.filter((i) => i.unlocked).length
          return (
            <section key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_LABEL[cat]}
                </h2>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  {unlockedInCat} / {items.length}
                </Badge>
              </div>
              <MotionList className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((a) => (
                  <MotionListItem key={a.slug}>
                    <AchievementCard achievement={a} />
                  </MotionListItem>
                ))}
              </MotionList>
            </section>
          )
        })}
    </MotionPage>
  )
}
