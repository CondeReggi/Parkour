/**
 * Agrupa una lista de timestamps ISO (endedAt de sesiones) en buckets
 * semanales. Devuelve siempre N buckets contiguos terminando en la semana
 * que contiene `now` — incluido si está vacía. La semana arranca en lunes.
 */

export interface ActivityBucket {
  /** Lunes de la semana del bucket (00:00 local). */
  start: Date
  /** Domingo de la semana del bucket (23:59:59 local). */
  end: Date
  count: number
  /** Etiqueta corta tipo "5 may" (día y mes del lunes). */
  label: string
}

function startOfWeek(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  // Lunes = 1; getDay devuelve 0=domingo. Distancia hacia atrás:
  const dayIdx = (c.getDay() + 6) % 7
  c.setDate(c.getDate() - dayIdx)
  return c
}

function shortLabel(d: Date): string {
  return d.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })
}

export function buildWeeklyActivity(
  isoTimestamps: string[],
  weeks: number,
  now: Date = new Date()
): ActivityBucket[] {
  const buckets: ActivityBucket[] = []
  const currentMonday = startOfWeek(now)

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(currentMonday)
    start.setDate(start.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    end.setMilliseconds(-1)
    buckets.push({ start, end, count: 0, label: shortLabel(start) })
  }

  if (buckets.length === 0) return buckets
  const firstStart = buckets[0]!.start.getTime()
  const lastEnd = buckets[buckets.length - 1]!.end.getTime()

  for (const iso of isoTimestamps) {
    const t = new Date(iso).getTime()
    if (Number.isNaN(t)) continue
    if (t < firstStart || t > lastEnd) continue
    const idx = Math.floor((t - firstStart) / (7 * 24 * 60 * 60 * 1000))
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx]!.count++
    }
  }

  return buckets
}
