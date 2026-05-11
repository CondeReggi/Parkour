import { useEffect } from 'react'
import { useAppSettings } from '@/features/settings/hooks/useAppSettings'

/**
 * Lee AppSettings.theme y aplica las clases correctas al <html>.
 *
 * Mapeo:
 *  - 'light'  → sin clases de tema.
 *  - 'dark'   → clase `dark` (paleta Asphalt Dark, por defecto en globals.css).
 *  - 'gotham' → clases `dark` + `theme-gotham` (la paleta zinc original
 *               vive en `.dark.theme-gotham` y sobreescribe los tokens de
 *               Asphalt Dark cuando ambas clases están presentes).
 *
 * `dark` siempre está cuando el tema es oscuro en cualquiera de sus
 * variantes, así Tailwind sigue evaluando correctamente las utilities
 * `dark:`. La sub-variante (gotham vs asphalt) se sirve por CSS vars.
 *
 * Mientras carga la setting, mantenemos el tema inicial del index.html
 * para evitar flash. No renderiza UI propia — sólo efectos.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settingsQ = useAppSettings()
  const theme = settingsQ.data?.theme

  useEffect(() => {
    if (!theme) return
    const root = document.documentElement
    const isDarkFamily = theme === 'dark' || theme === 'gotham'
    root.classList.toggle('dark', isDarkFamily)
    root.classList.toggle('theme-gotham', theme === 'gotham')
    // La clase 'light' la dejamos sólo para que terceros que la inspeccionen
    // sepan en qué tema estamos; Tailwind no la usa.
    root.classList.toggle('light', theme === 'light')
  }, [theme])

  return <>{children}</>
}
