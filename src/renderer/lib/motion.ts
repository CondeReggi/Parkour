/**
 * Capa central de variants y curvas para Framer Motion.
 *
 * Objetivos:
 *  - Animaciones cortas, urbanas, sin rebotes.
 *  - Misma curva de easing en todos lados (expo-out tipo "deportiva").
 *  - Stagger discreto para listas.
 *  - Compatible con `MotionConfig reducedMotion="user"` envuelto en App.tsx:
 *    cuando el SO pide reduced motion, Framer ignora x/y/scale y deja solo
 *    opacity — no hay que tocar nada acá.
 */

import type { Transition, Variants } from 'framer-motion'

/** Duraciones canónicas en segundos. Usar siempre estas. */
export const DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  /** Barras de progreso: lo suficientemente largo para que el ojo lo siga. */
  progress: 0.6
} as const

/**
 * Curvas de easing.
 *  - `out`: expo-out, "entrada deportiva". Default en aparición.
 *  - `inOut`: material-ish, para reversibles.
 *  - `spring`: para micro-interacciones (hover/tap); como objeto no array.
 */
export const EASE = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.4, 0, 0.2, 1]
} as const

export const SPRING_SOFT: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
  mass: 0.6
}

// =========================================================
// Variants para páginas
// =========================================================

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASE.out,
      when: 'beforeChildren'
    }
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: DURATION.fast, ease: EASE.inOut }
  }
}

// =========================================================
// Variants para cards
// =========================================================

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.out }
  }
}

// =========================================================
// Variants para listas con stagger
// =========================================================

/**
 * Contenedor: dispara `visible` con stagger entre hijos.
 * `delayChildren` arranca después de un mini-respiro para que la página
 * "respire" antes que la lista.
 */
export const listContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
}

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.out }
  }
}

// =========================================================
// Variants primitivos reutilizables
// =========================================================

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.normal, ease: EASE.out }
  }
}

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE.out }
  }
}

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.normal, ease: EASE.out }
  }
}

// =========================================================
// Barras de progreso
// =========================================================

/**
 * Transición canónica para animar width/scaleX de una barra.
 * Pensado para usarse en `motion.div` con `initial={{ width: 0 }}`
 * `animate={{ width: '<pct>%' }}`.
 */
export const progressTransition: Transition = {
  duration: DURATION.progress,
  ease: EASE.out
}

// =========================================================
// Micro-interacciones (hover/tap)
// =========================================================

/** Lift sutil para cards clickeables. */
export const hoverLift = {
  y: -2,
  transition: { duration: DURATION.fast, ease: EASE.out }
}

/** Scale sutil para botones. */
export const tapScale = {
  scale: 0.97,
  transition: { duration: 0.08, ease: EASE.inOut }
}

export const hoverScaleSm = {
  scale: 1.02,
  transition: { duration: DURATION.fast, ease: EASE.out }
}
