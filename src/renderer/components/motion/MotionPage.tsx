import { motion, type HTMLMotionProps } from 'framer-motion'
import { pageVariants } from '@/lib/motion'

interface MotionPageProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  children: React.ReactNode
}

/**
 * Wrapper de entrada de página. Aplica fade + leve slide vertical.
 *
 * Uso:
 *   <MotionPage className="px-8 py-6 max-w-5xl">
 *     ...contenido...
 *   </MotionPage>
 *
 * Las páginas siguen siendo dueñas de su layout / paddings; este wrapper
 * sólo agrega la animación.
 */
export function MotionPage({ children, ...rest }: MotionPageProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={pageVariants}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
