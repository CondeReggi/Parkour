import { RouterProvider } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { QueryProvider } from './app/providers/QueryProvider'
import { ThemeProvider } from './app/providers/ThemeProvider'
import { router } from './app/router'

/**
 * `MotionConfig reducedMotion="user"` hace que Framer Motion respete el
 * setting `prefers-reduced-motion` del SO automáticamente: cuando está
 * activo, ignora x/y/scale/rotate y deja sólo opacity, sin que tengamos
 * que detectarlo manualmente en cada componente.
 */
export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <RouterProvider router={router} />
        </MotionConfig>
      </ThemeProvider>
    </QueryProvider>
  )
}
