import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { cardVariants, hoverLift } from '@/lib/motion'

interface MotionCardProps extends HTMLMotionProps<'div'> {
  /**
   * Si la card es clickeable, opt-in al efecto de lift en hover. Por
   * default no — no queremos lift en cards informativas.
   */
  interactive?: boolean
  /**
   * Si la card ya está dentro de un MotionList, dejar `asListItem` para
   * que herede los variants del padre y aporte al stagger en vez de
   * arrancar su propia animación independiente.
   */
  asListItem?: boolean
  children?: React.ReactNode
}

/**
 * `<MotionCard>` reemplaza al `<Card>` cuando querés que entre con
 * animación. Mantiene la apariencia de shadcn (bg-card, border, shadow,
 * radius). Si `asListItem` está en true, NO setea initial/animate — el
 * `MotionList` padre maneja el stagger.
 */
export const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, interactive, asListItem, children, ...rest }, ref) => {
    const motionProps: Partial<HTMLMotionProps<'div'>> = asListItem
      ? {}
      : {
          initial: 'hidden',
          animate: 'visible',
          variants: cardVariants
        }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl border bg-card text-card-foreground shadow',
          className
        )}
        whileHover={interactive ? hoverLift : undefined}
        {...motionProps}
        {...rest}
      >
        {children}
      </motion.div>
    )
  }
)
MotionCard.displayName = 'MotionCard'
