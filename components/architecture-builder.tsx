"use client"

import { useMemo } from "react"
import {
  AWS_SERVICES,
  SERVICE_BY_KEY,
  DIFFICULTIES,
  architectureCostPerHour,
  resourceCostPerHour,
} from "@/lib/catalog"
import type { Difficulty } from "@/lib/types"
import { ServiceIcon } from "@/components/service-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Minus, Trash2, Rocket, Loader2, ArrowLeft, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BuilderResource {
  uid: string
  serviceKey: string
  count: number
  multiAz: boolean
}

const COST_DOT: Record<string, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-critical",
}

export function ArchitectureBuilder({
  playerName,
  onPlayerName,
  difficulty,
  resources,
  onChange,
  onLaunch,
  onBack,
  launching,
}: {
  playerName: string
  onPlayerName: (v: string) => void
  difficulty: Difficulty
  resources: BuilderResource[]
  onChange: (next: BuilderResource[]) => void
  onLaunch: () => void
  onBack: () => void
  launching: boolean
}) {
  const diff = DIFFICULTIES[difficulty]
  const addService = (key: string) => {
    onChange([
      ...resources,
      { uid: crypto.randomUUID(), serviceKey: key, count: 1, multiAz: false },
    ])
  }
  const update = (uid: string, patch: Partial<BuilderResource>) =>
    onChange(resources.map((r) => (r.uid === uid ? { ...r, ...patch } : r)))
  const remove = (uid: string) => onChange(resources.filter((r) => r.uid !== uid))

  const coverage = useMemo(() => {
    const types = new Set(resources.map((r) => SERVICE_BY_KEY[r.serviceKey]?.cwmType))
    return types
  }, [resources])

  const spend = useMemo(() => architectureCostPerHour(resources), [resources])
  const overBudget = spend > diff.budget
  const budgetPct = Math.min(100, (spend / diff.budget) * 100)

  const canLaunch =
    resources.length > 0 && playerName.trim().length > 0 && !overBudget && !launching

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
      {/* Catalog */}
      <section>
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Change threat level
        </button>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
              AWS Service Catalog
            </h2>
            <Badge variant="outline" className="font-mono text-[10px] uppercase">
              {diff.name}
            </Badge>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {coverage.size}/8 layers
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {AWS_SERVICES.map((svc) => (
            <button
              key={svc.key}
              type="button"
              onClick={() => addService(svc.key)}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent"
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                <ServiceIcon type={svc.cwmType} className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-card-foreground">
                    {svc.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ${svc.costPerHour}/hr
                    </span>
                    <span
                      className={cn("size-2 rounded-full", COST_DOT[svc.costHint])}
                      title={`${svc.costHint} cost`}
                    />
                  </span>
                </span>
                <span className="mt-1 block text-pretty text-xs leading-relaxed text-muted-foreground">
                  {svc.description}
                </span>
              </span>
              <Plus className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>
          ))}
        </div>
      </section>

      {/* Selected architecture */}
      <aside className="flex flex-col rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <Label htmlFor="player" className="text-xs uppercase tracking-widest text-muted-foreground">
            Operator callsign
          </Label>
          <Input
            id="player"
            value={playerName}
            maxLength={40}
            placeholder="e.g. midnight-oncall"
            onChange={(e) => onPlayerName(e.target.value)}
            className="mt-2 font-mono"
          />
        </div>

        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            Your Architecture
          </h2>
          <Badge variant="secondary" className="font-mono">
            {resources.reduce((a, r) => a + r.count, 0)} nodes
          </Badge>
        </div>

        {/* Budget meter */}
        <div className="px-4 pt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-muted-foreground">
              <Wallet className="size-3.5" />
              Operating budget
            </span>
            <span
              className={cn(
                "font-mono tabular-nums",
                overBudget ? "text-critical" : "text-foreground",
              )}
            >
              ${spend.toFixed(0)} / ${diff.budget}/hr
            </span>
          </div>
          <Progress
            value={budgetPct}
            className={cn("h-1.5", overBudget && "[&>*]:bg-critical")}
          />
          {overBudget && (
            <p className="mt-1.5 font-mono text-[11px] text-critical">
              Over budget by ${(spend - diff.budget).toFixed(0)}/hr — trim the stack to launch.
            </p>
          )}
        </div>

        <div className="flex-1 space-y-2 p-4">
          {resources.length === 0 && (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Add services from the catalog to design your stack.
            </p>
          )}
          {resources.map((r) => {
            const svc = SERVICE_BY_KEY[r.serviceKey]
            if (!svc) return null
            return (
              <div
                key={r.uid}
                className="rounded-md border border-border bg-secondary/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <ServiceIcon type={svc.cwmType} className="size-4 text-primary" />
                  <span className="flex-1 truncate text-sm font-medium">{svc.short}</span>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    ${resourceCostPerHour(r).toFixed(0)}/hr
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(r.uid)}
                    className="text-muted-foreground transition-colors hover:text-critical"
                    aria-label={`Remove ${svc.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-7"
                      onClick={() => update(r.uid, { count: Math.max(1, r.count - 1) })}
                      aria-label="Decrease count"
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center font-mono text-sm">{r.count}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-7"
                      onClick={() => update(r.uid, { count: Math.min(10, r.count + 1) })}
                      aria-label="Increase count"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    Multi-AZ
                    <Switch
                      checked={r.multiAz}
                      onCheckedChange={(v) => update(r.uid, { multiAz: v })}
                    />
                  </label>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-border p-4">
          <Button
            className="w-full font-medium"
            size="lg"
            disabled={!canLaunch}
            onClick={onLaunch}
          >
            {launching ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Provisioning…
              </>
            ) : (
              <>
                <Rocket className="size-4" />
                Launch Simulation
              </>
            )}
          </Button>
          {resources.length === 0 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Add at least one service to begin.
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
