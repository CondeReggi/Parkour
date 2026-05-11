import { Link } from 'react-router-dom'
import { Activity, MapPin, Video, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface QuickLink {
  to: string
  label: string
  icon: LucideIcon
}

const LINKS: QuickLink[] = [
  { to: '/movements', label: 'Biblioteca', icon: Activity },
  { to: '/spots', label: 'Spots', icon: MapPin },
  { to: '/videos', label: 'Videos', icon: Video }
]

export function QuickLinksCard() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to}>
          <Card className="hover:border-foreground/30 transition-colors cursor-pointer">
            <CardContent className="pt-5 pb-5 flex items-center gap-3">
              <l.icon className="h-5 w-5 text-foreground/70" />
              <span className="text-sm font-medium">{l.label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
