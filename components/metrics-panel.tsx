"use client"

import type { SimMetrics } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Activity, AlertTriangle, DollarSign, Gauge, Timer, Cpu } from "lucide-react"

function band(value: number, warn: number, crit: number) {
  if (value >= crit) return "critical"
  if (value >= warn) return "warning"
  return "success"
}

const BAND_TEXT: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  critical: "text-critical",
}
const BAND_BAR: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  critical: "bg-critical",
}

function Stat({
  icon: Icon,
  label,
  value,
  unit,
  pct,
  status,
}: {
  icon: typeof Activity
  label: string
  value: string
  unit?: string
  pct: number
  status: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={cn("font-mono text-2xl font-semibold tabular-nums", BAND_TEXT[status])}>
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all duration-500", BAND_BAR[status])}
          style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
        />
      </div>
    </div>
  )
}

export function MetricsPanel({ metrics }: { metrics: SimMetrics }) {
  const errStatus = band(metrics.errorRate, 5, 25)
  const cpuStatus = band(metrics.cpuUsage, 70, 90)
  const latStatus = band(metrics.latencyP95, 250, 500)
  const costStatus = band(metrics.costPerHour, 8, 20)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <Stat
        icon={AlertTriangle}
        label="Error Rate"
        value={metrics.errorRate.toFixed(1)}
        unit="%"
        pct={metrics.errorRate}
        status={errStatus}
      />
      <Stat
        icon={Cpu}
        label="CPU Load"
        value={metrics.cpuUsage.toFixed(0)}
        unit="%"
        pct={metrics.cpuUsage}
        status={cpuStatus}
      />
      <Stat
        icon={Timer}
        label="p95 Latency"
        value={metrics.latencyP95.toFixed(0)}
        unit="ms"
        pct={(metrics.latencyP95 / 600) * 100}
        status={latStatus}
      />
      <Stat
        icon={Gauge}
        label="p99 Latency"
        value={metrics.latencyP99.toFixed(0)}
        unit="ms"
        pct={(metrics.latencyP99 / 900) * 100}
        status={band(metrics.latencyP99, 400, 800)}
      />
      <Stat
        icon={Activity}
        label="Throughput"
        value={Math.round(metrics.throughput).toLocaleString()}
        unit="rps"
        pct={(metrics.throughput / 12000) * 100}
        status="success"
      />
      <Stat
        icon={DollarSign}
        label="Cost / hour"
        value={`$${metrics.costPerHour.toFixed(2)}`}
        pct={(metrics.costPerHour / 30) * 100}
        status={costStatus}
      />
    </div>
  )
}
