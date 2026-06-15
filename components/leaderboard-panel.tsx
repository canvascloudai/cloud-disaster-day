"use client"

import useSWR from "swr"
import type { ScoreEntry } from "@/lib/types"
import { grade } from "@/lib/scoring"
import { DIFFICULTIES } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import { Loader2, Trophy, Medal } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const RANK_COLOR = ["text-primary", "text-foreground", "text-warning"]

export function LeaderboardPanel({ highlightId }: { highlightId?: string }) {
  const { data, isLoading } = useSWR<{ entries: ScoreEntry[] }>(
    "/api/leaderboard",
    fetcher,
    { refreshInterval: 15000 },
  )
  const entries = data?.entries ?? []

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <Trophy className="size-5 text-primary" />
        <h2 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Global Leaderboard
        </h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading rankings…
        </div>
      ) : entries.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          No runs recorded yet. Be the first to survive Disaster Day.
        </p>
      ) : (
        <ol className="divide-y divide-border">
          {entries.map((e, i) => (
            <li
              key={e.id}
              className={cn(
                "flex items-center gap-3 p-3",
                e.id === highlightId && "bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "flex w-7 shrink-0 justify-center font-mono text-sm font-semibold",
                  RANK_COLOR[i] ?? "text-muted-foreground",
                )}
              >
                {i < 3 ? <Medal className="size-4" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.playerName}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {DIFFICULTIES[e.difficulty]?.name ?? "Operator"} · {e.survived}/
                  {e.totalDisasters} survived · {e.avgLatency}ms p95
                </p>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                grade {grade(e.resilience)}
              </span>
              <span className="w-20 text-right font-mono text-sm font-semibold tabular-nums text-primary">
                {e.score.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
