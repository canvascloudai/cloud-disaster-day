import {
  Server,
  Database,
  HardDrive,
  Network,
  Zap,
  ListOrdered,
  Boxes,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import type { CwmResourceType } from "@/lib/types"

const ICONS: Record<CwmResourceType, LucideIcon> = {
  compute: Server,
  database: Database,
  storage: HardDrive,
  network: Network,
  cache: Zap,
  queue: ListOrdered,
  kubernetes: Boxes,
  security: ShieldCheck,
}

export function ServiceIcon({
  type,
  className,
}: {
  type: CwmResourceType
  className?: string
}) {
  const Icon = ICONS[type] ?? Server
  return <Icon className={className} aria-hidden="true" />
}
