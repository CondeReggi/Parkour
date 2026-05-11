import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import {
  listContainerVariants,
  listItemVariants
} from '@/lib/motion'

interface MotionListProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  children: React.ReactNode
}

/**
 * Contenedor de lista con stagger. Cualquier hijo envuelto en
 * `MotionListItem` aparece en cascada cuando el contenedor pasa al
 * estado `visible`. Pensado para grids de cards.
 */
export function MotionList({ children, ...rest }: MotionListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={listContainerVariants}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

interface MotionListItemProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  children: React.ReactNode
}

/**
 * Item individual. Hereda el `visible` del padre `MotionList` y se
 * dispara escalonadamente vía la transición staggerChildren del
 * contenedor. No setear `initial`/`animate` acá: lo hace el padre.
 */
export function MotionListItem({ children, ...rest }: MotionListItemProps) {
  return (
    <motion.div variants={listItemVariants} {...rest}>
      {children}
    </motion.div>
  )
}
