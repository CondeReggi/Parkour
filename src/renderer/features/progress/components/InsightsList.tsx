import {
  Activity,
  Compass,
  Flame,
  Sparkles,
  TrendingUp,
  Wrench,
  type LucideIcon
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { InsightDto, InsightKind } from '@shared/types/progressInsights'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { listContainerVariants, listItemVariants } from '@/lib/motion'
import { insightToneClasses, insightIconColor } from '../lib/labels'

const KIND_ICON: Record<InsightKind, LucideIcon> = {
  improving: TrendingUp,
  stagnant: Activity,
  reinforce: Wrench,
  fatigue: Flame,
  consistency: Sparkles,
  close_to_master: Sparkles,
  focus_category: Compass
}

export function InsightsList({ insights }: { insights: InsightDto[] }) {
  if (insights.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lectura de la semana</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          className="space-y-2.5"
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {insights.map((i, idx) => {
            const Icon = KIND_ICON[i.kind]
            return (
              <motion.div
                key={`${i.kind}-${idx}`}
                variants={listItemVariants}
                className={cn(
                  'rounded-md border p-3 flex items-start gap-3',
                  insightToneClasses(i.tone)
                )}
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 bg-background/60',
                    insightIconColor(i.tone)
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium leading-tight">{i.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {i.detail}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </CardContent>
    </Card>
  )
}
