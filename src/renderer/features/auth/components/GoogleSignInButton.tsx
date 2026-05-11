import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  className?: string
  label?: string
}

/**
 * Botón con logo de Google inline (SVG, sin imágenes remotas). Estilo
 * sobrio que funciona en Urban Light, Asphalt Dark y Gotham:
 *  - Fondo `card` con borde y texto `foreground` (siempre legible).
 *  - El logo SVG mantiene sus 4 colores oficiales independientemente
 *    del tema (es la marca de Google y no la debemos repintar).
 */
export function GoogleSignInButton({
  onClick,
  loading,
  disabled,
  className,
  label = 'Continuar con Google'
}: Props) {
  const reduced = useReducedMotion()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={reduced ? undefined : { scale: 1.02 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className={cn(
        'inline-flex items-center justify-center gap-2.5 h-10 px-4 rounded-md border border-border bg-card text-card-foreground shadow-sm text-sm font-medium transition-colors',
        'hover:bg-secondary/60 disabled:opacity-60 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <GoogleLogo className="h-4 w-4" />
      )}
      <span>{loading ? 'Conectando…' : label}</span>
    </motion.button>
  )
}

/**
 * Logo "G" oficial de Google. Colores fijos a propósito — son parte de
 * la marca y no se pintan según tema.
 */
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}
