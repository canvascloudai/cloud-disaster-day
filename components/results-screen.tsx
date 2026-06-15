"use client"

import type { GameState } from "@/lib/types"
import { grade } from "@/lib/scoring"
import { DISASTERS, DIFFICULTIES } from "@/lib/catalog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react"

const GRADE_COLOR: Record<string, string> = {
  S: "text-primary",
  A: "text-success",
  B: "text-success",
  C: "text-warning",
  D: "text-warning",
  F: "text-critical",
}

export function ResultsScreen({
  game,
  onPlayAgain,
  onViewLeaderboard,
}: {
  game: GameState
  onPlayAgain: () => void
  onViewLeaderboard: () => void
}) {
  const survived = game.events.filter((e) => e.passed).length
  const avgResilience =
    game.events.length > 0
      ? Math.round(game.events.reduce((a, e) => a + e.resilienceScore, 0) / game.events.length)
      : 0
  const g = grade(avgResilience)
  const diff = DIFFICULTIES[game.difficulty] ?? DIFFICULTIES.operator

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            After-action report
          </p>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {diff.name} · {diff.scoreMultiplier}×
          </Badge>
        </div>
        <div className={cn("mt-2 font-mono text-7xl font-bold leading-none", GRADE_COLOR[g])}>
          {g}
        </div>
        <p className="mt-4 font-mono text-4xl font-semibold tabular-nums text-primary">
          {game.score.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">total points</p>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6 text-center">
          <div>
            <p className="font-mono text-2xl font-semibold">
              {survived}/{game.events.length}
            </p>
            <p className="text-xs text-muted-foreground">disasters survived</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold">{avgResilience}</p>
            <p className="text-xs text-muted-foreground">avg resilience</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold">
              ${game.spend?.toFixed(0) ?? "0"}
              <span className="text-base text-muted-foreground">/${game.budget}</span>
            </p>
            <p className="text-xs text-muted-foreground">budget $/hr</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Disaster Breakdown
        </h2>
        <ul className="space-y-2">
          {game.events.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-md border border-border bg-secondary/30 p-3"
            >
              {e.passed ? (
                <CheckCircle2 className="size-5 shrink-0 text-success" />
              ) : (
                <XCircle className="size-5 shrink-0 text-critical" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{DISASTERS[e.disaster].name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  resilience {e.resilienceScore} · err {e.metrics.errorRate.toFixed(0)}% · p95{" "}
                  {e.metrics.latencyP95}ms
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono",
                  e.passed ? "border-success/40 text-success" : "border-critical/40 text-critical",
                )}
              >
                +{e.pointsDelta}
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="flex-1" size="lg" onClick={onPlayAgain}>
          <RotateCcw className="size-4" />
          Build a New Stack
        </Button>
        <Button variant="outline" className="flex-1" size="lg" onClick={onViewLeaderboard}>
          <Trophy className="size-4" />
          View Leaderboard
        </Button>
      </div>
    </div>
  )
}
