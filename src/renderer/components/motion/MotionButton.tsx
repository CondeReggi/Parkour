import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Variants identicos al `<Button>` de shadcn, replicados acá para no
 * tener que envolver motion(Button) (que rompe la API `asChild` del
 * original). El comportamiento visual es el mismo, lo que cambia es que
 * tiene hover scale sutil y tap scale (skip si reduced-motion).
 */
const motionButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

/**
 * Omitimos los handlers de drag/animation de React que colisionan con los
 * de Framer Motion. No los usamos en práctica, y mantenerlos rompe la
 * inferencia de tipos al pasar props a `motion.button`.
 */
type ButtonAttrs = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDragOver'
  | 'onDragEnter'
  | 'onDragLeave'
  | 'onDragExit'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onTransitionEnd'
>

export interface MotionButtonProps
  extends ButtonAttrs,
    VariantProps<typeof motionButtonVariants> {}

export const MotionButton = React.forwardRef<
  HTMLButtonElement,
  MotionButtonProps
>(({ className, variant, size, type, ...props }, ref) => {
  const reduced = useReducedMotion()
  return (
    <motion.button
      ref={ref}
      type={type ?? 'button'}
      whileHover={reduced ? undefined : { scale: 1.02 }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
      className={cn(motionButtonVariants({ variant, size, className }))}
      {...props}
    />
  )
})
MotionButton.displayName = 'MotionButton'
