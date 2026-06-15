"use client"

import { useState } from "react"
import type { GameState } from "@/lib/types"
import {
  DISASTERS,
  AWS_SERVICES,
  SERVICE_BY_KEY,
  DIFFICULTIES,
  resourceCostPerHour,
} from "@/lib/catalog"
import { MetricsPanel } from "@/components/metrics-panel"
import { ServiceIcon } from "@/components/service-icon"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  AlertOctagon,
  ShieldPlus,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Flag,
  Wrench,
} from "lucide-react"

export function WarRoom({
  game,
  busy,
  onDisaster,
  onDecision,
  onFinish,
}: {
  game: GameState
  busy: boolean
  onDisaster: () => void
  onDecision: (serviceKey: string, multiAz: boolean) => void
  onFinish: () => void
}) {
  const [reinforceOpen, setReinforceOpen] = useState(false)
  const [multiAz, setMultiAz] = useState(false)

  const nextKind = game.disasterQueue[game.events.length]
  const nextDisaster = nextKind ? DISASTERS[nextKind] : null
  const allDone = game.events.length >= game.totalRounds
  const metrics = game.metrics
  const diff = DIFFICULTIES[game.difficulty] ?? DIFFICULTIES.operator
  const remaining = Math.max(0, game.budget - game.spend)
  const budgetPct = Math.min(100, (game.spend / game.budget) * 100)

  const pickService = (key: string) => {
    onDecision(key, multiAz)
    setReinforceOpen(false)
    setMultiAz(false)
  }

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Operator
            </p>
            <p className="font-medium">{game.playerName}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Round
            </p>
            <p className="font-mono font-medium">
              {Math.min(game.events.length + (allDone ? 0 : 1), game.totalRounds)} / {game.totalRounds}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Tier
            </p>
            <p className="font-mono font-medium">{diff.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {game.usedFallback && (
            <Badge variant="outline" className="border-warning/40 text-warning">
              local engine
            </Badge>
          )}
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Score
            </p>
            <p className="font-mono text-xl font-semibold text-primary tabular-nums">
              {game.score.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Budget + round progress */}
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-mono uppercase tracking-wider text-muted-foreground">
              Round progress
            </span>
            <span className="font-mono text-muted-foreground">
              {game.events.length}/{game.totalRounds}
            </span>
          </div>
          <Progress value={(game.events.length / game.totalRounds) * 100} className="h-1.5" />
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-mono uppercase tracking-wider text-muted-foreground">
              Budget remaining
            </span>
            <span className="font-mono tabular-nums text-foreground">
              ${remaining.toFixed(0)} / ${game.budget}/hr
            </span>
          </div>
          <Progress value={budgetPct} className="h-1.5" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main column: metrics + disaster control */}
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-mono text-sm uppercase tracking-widest text-muted-foreground">
              Live Telemetry
            </h2>
            {metrics ? (
              <MetricsPanel metrics={metrics} />
            ) : (
              <p className="text-sm text-muted-foreground">Awaiting first reading…</p>
            )}
          </section>

          {/* Disaster control */}
          <section>
            <h2 className="mb-3 font-mono text-sm uppercase tracking-widest text-muted-foreground">
              Disaster Control
            </h2>
            {allDone ? (
              <div className="rounded-lg border border-success/40 bg-success/5 p-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 size-10 text-success" />
                <p className="text-lg font-medium">All disasters weathered</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lock in your run to publish it to the global leaderboard.
                </p>
                <Button className="mt-4" size="lg" onClick={onFinish} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}
                  Submit Final Score
                </Button>
              </div>
            ) : (
              nextDisaster && (
                <div className="relative overflow-hidden rounded-lg border border-critical/40 bg-gradient-to-b from-critical/10 to-card p-5">
                  <div className="flex items-start gap-4">
                    <span
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-lg bg-critical/15 text-critical",
                        busy && "animate-pulse-ring",
                      )}
                    >
                      <AlertOctagon className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-balance">
                          {nextDisaster.name}
                        </h3>
                        <Badge variant="outline" className="border-critical/40 text-critical">
                          incoming
                        </Badge>
                      </div>
                      <p className="font-mono text-xs text-critical/80">
                        {nextDisaster.tagline}
                      </p>
                      <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                        {nextDisaster.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                        <span>
                          traffic surge ×
                          {(
                            nextDisaster.trafficMultiplier *
                            diff.trafficScale *
                            (1 + game.events.length * diff.escalationStep)
                          ).toFixed(1)}
                        </span>
                        {game.events.length > 0 && (
                          <span className="text-warning">escalating</span>
                        )}
                        <span>survival ≥ {diff.passThreshold} resilience</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Dialog open={reinforceOpen} onOpenChange={setReinforceOpen}>
                      <DialogTrigger
                        render={
                          <Button variant="outline" className="flex-1" disabled={busy} />
                        }
                      >
                        <ShieldPlus className="size-4" />
                        Reinforce Architecture
                      </DialogTrigger>
                      <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Reinforce before impact</DialogTitle>
                          <DialogDescription>
                            Add a service to harden your stack. The Cloud World Model
                            re-evaluates your design before the disaster hits.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
                          <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            <Wrench className="size-4 text-primary" />
                            Budget left
                          </span>
                          <span className="font-mono tabular-nums">
                            ${remaining.toFixed(0)}/hr
                          </span>
                        </div>
                        <label className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
                          <span>Deploy as Multi-AZ (×2 cost)</span>
                          <Switch checked={multiAz} onCheckedChange={setMultiAz} />
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {AWS_SERVICES.map((svc) => {
                            const counters = nextDisaster.mitigatedBy.includes(svc.cwmType)
                            const cost = resourceCostPerHour({
                              serviceKey: svc.key,
                              count: 1,
                              multiAz,
                            })
                            const affordable = game.spend + cost <= game.budget
                            return (
                              <button
                                key={svc.key}
                                type="button"
                                disabled={!affordable}
                                onClick={() => pickService(svc.key)}
                                className={cn(
                                  "flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors",
                                  affordable && "hover:bg-accent",
                                  !affordable && "cursor-not-allowed opacity-40",
                                  counters
                                    ? "border-success/50 bg-success/5"
                                    : "border-border bg-card",
                                )}
                              >
                                <ServiceIcon type={svc.cwmType} className="size-4 text-primary" />
                                <span className="flex-1 truncate">{svc.short}</span>
                                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                                  ${cost.toFixed(0)}
                                </span>
                                {counters && (
                                  <Badge
                                    variant="outline"
                                    className="border-success/40 text-success"
                                  >
                                    counter
                                  </Badge>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      className="flex-1 bg-critical text-destructive-foreground hover:bg-critical/90"
                      onClick={() => onDisaster()}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Zap className="size-4" />
                      )}
                      Face the Disaster
                    </Button>
                  </div>
                </div>
              )
            )}
          </section>
        </div>

        {/* Side column: architecture + event log */}
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 font-mono text-sm uppercase tracking-widest text-muted-foreground">
              Architecture ({game.architecture.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {game.architecture.map((r) => {
                const svc = SERVICE_BY_KEY[r.serviceKey]
                return (
                  <span
                    key={r.id}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs"
                  >
                    <ServiceIcon type={r.type} className="size-3.5 text-primary" />
                    {svc?.short ?? r.name}
                    {r.count > 1 && <span className="text-muted-foreground">×{r.count}</span>}
                    {r.multiAz && (
                      <span className="font-mono text-[10px] text-success">AZ</span>
                    )}
                  </span>
                )
              })}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 font-mono text-sm uppercase tracking-widest text-muted-foreground">
              Event Log
            </h2>
            <ScrollArea className="h-[320px] pr-3">
              {game.events.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No incidents yet. The first wave is coming.
                </p>
              ) : (
                <ol className="space-y-3">
                  {[...game.events].reverse().map((e) => (
                    <li
                      key={e.id}
                      className="rounded-md border border-border bg-secondary/30 p-3"
                    >
                      <div className="flex items-center gap-2">
                        {e.passed ? (
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                        ) : (
                          <XCircle className="size-4 shrink-0 text-critical" />
                        )}
                        <span className="flex-1 truncate text-sm font-medium">{e.title}</span>
                        <span
                          className={cn(
                            "font-mono text-xs font-semibold",
                            e.passed ? "text-success" : "text-critical",
                          )}
                        >
                          +{e.pointsDelta}
                        </span>
                      </div>
                      <p className="mt-1.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                        {e.detail}
                      </p>
                      <div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span>resilience {e.resilienceScore}</span>
                        <span>err {e.metrics.errorRate.toFixed(0)}%</span>
                        <span>p95 {e.metrics.latencyP95}ms</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </ScrollArea>
          </section>
        </div>
      </div>
    </div>
  )
}
