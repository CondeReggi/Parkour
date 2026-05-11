/**
 * Modal mínimo (sin radix). Si más adelante se justifica radix-dialog,
 * la API de este componente está pensada para reemplazarse sin cambiar
 * los call sites.
 *
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogContent>...</DialogContent>
 *   </Dialog>
 *
 * Cierra con click en backdrop o tecla Escape. No bloquea el scroll del body
 * salvo que esté abierto.
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogContextValue {
  onOpenChange: (open: boolean) => void
}
const DialogContext = React.createContext<DialogContextValue | null>(null)

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <DialogContext.Provider value={{ onOpenChange }}>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-8"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false)
        }}
      >
        {children}
      </div>
    </DialogContext.Provider>,
    document.body
  )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  showClose?: boolean
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, showClose = true, ...props }, ref) => {
    const ctx = React.useContext(DialogContext)
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative my-auto w-full max-w-2xl rounded-xl border bg-card text-card-foreground shadow-2xl',
          className
        )}
        onMouseDown={(e) => e.stopPropagation()}
        {...props}
      >
        {showClose && ctx && (
          <button
            type="button"
            onClick={() => ctx.onOpenChange(false)}
            className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    )
  }
)
DialogContent.displayName = 'DialogContent'

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}
      {...props}
    />
  )
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
}

export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6', className)} {...props} />
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-row-reverse items-center gap-2 p-6 pt-4',
        className
      )}
      {...props}
    />
  )
}
