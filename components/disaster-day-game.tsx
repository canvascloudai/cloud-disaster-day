"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { GameState, Difficulty } from "@/lib/types"
import { DIFFICULTIES } from "@/lib/catalog"
import { ArchitectureBuilder, type BuilderResource } from "@/components/architecture-builder"
import { WarRoom } from "@/components/war-room"
import { ResultsScreen } from "@/components/results-screen"
import { LeaderboardPanel } from "@/components/leaderboard-panel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  CloudLightning,
  Trophy,
  ArrowRight,
  ShieldHalf,
  Activity,
  Boxes,
  Shield,
  Swords,
  Skull,
  Wallet,
  ExternalLink,
} from "lucide-react"

type Phase = "start" | "build" | "war" | "results"

const STARTER_STACK: BuilderResource[] = [
  { uid: "s1", serviceKey: "elb", count: 1, multiAz: false },
  { uid: "s2", serviceKey: "ec2", count: 2, multiAz: false },
  { uid: "s3", serviceKey: "dynamodb", count: 1, multiAz: false },
]

export function DisasterDayGame() {
  const [phase, setPhase] = useState<Phase>("start")
  const [playerName, setPlayerName] = useState("")
  const [difficulty, setDifficulty] = useState<Difficulty>("operator")
  const [resources, setResources] = useState<BuilderResource[]>(STARTER_STACK)
  const [game, setGame] = useState<GameState | null>(null)
  const [busy, setBusy] = useState(false)

  async function launch() {
    setBusy(true)
    try {
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName,
          difficulty,
          architecture: resources.map((r) => ({
            serviceKey: r.serviceKey,
            count: r.count,
            multiAz: r.multiAz,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to launch")
      setGame(data.game)
      setPhase("war")
      if (data.game.usedFallback) {
        toast.info("Running on the local simulation engine.")
      } else {
        toast.success("Simulation live on Cloud World Model.")
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function runDisaster() {
    if (!game) return
    setBusy(true)
    try {
      const res = await fetch(`/api/game/${game.id}/disaster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      setGame(data.game)
      const ev = data.event
      if (ev.passed) {
        toast.success(`${ev.title} survived! +${ev.pointsDelta}`)
      } else {
        toast.error(`${ev.title} caused an outage. +${ev.pointsDelta}`)
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function applyDecision(serviceKey: string, multiAz: boolean) {
    if (!game) return
    setBusy(true)
    try {
      const res = await fetch(`/api/game/${game.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceKey, multiAz }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      setGame(data.game)
      toast.success("Architecture reinforced. Metrics recalculated.")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function decommission(resourceId: string) {
    if (!game) return
    setBusy(true)
    try {
      const res = await fetch(`/api/game/${game.id}/decommission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      setGame(data.game)
      toast.success(
        `Decommissioned. Freed $${Math.abs(data.freed).toFixed(0)}/hr · −${data.penalty} migration penalty.`,
      )
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function finish() {
    if (!game) return
    setBusy(true)
    try {
      const res = await fetch(`/api/game/${game.id}/complete`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      setGame(data.game)
      setPhase("results")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setGame(null)
    setResources(STARTER_STACK)
    setPhase("build")
  }

  return (
    <div className="min-h-dvh grid-bg">
      <div className="scanlines min-h-dvh">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6">
          {phase === "start" && (
            <StartScreen
              difficulty={difficulty}
              onDifficulty={setDifficulty}
              onStart={() => setPhase("build")}
            />
          )}
          {phase === "build" && (
            <ArchitectureBuilder
              playerName={playerName}
              onPlayerName={setPlayerName}
              difficulty={difficulty}
              resources={resources}
              onChange={setResources}
              onLaunch={launch}
              onBack={() => setPhase("start")}
              launching={busy}
            />
          )}
          {phase === "war" && game && (
            <WarRoom
              game={game}
              busy={busy}
              onDisaster={runDisaster}
              onDecision={applyDecision}
              onDecommission={decommission}
              onFinish={finish}
            />
          )}
          {/* onDisaster now reads the next disaster from the server queue */}
          {phase === "results" && game && (
            <ResultsScreen
              game={game}
              onPlayAgain={reset}
              onViewLeaderboard={() => {
                document.getElementById("open-leaderboard")?.click()
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CloudLightning className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="font-mono text-sm font-semibold tracking-tight">CLOUD DISASTER DAY</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              SRE war-room sim
            </p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger
            render={<Button id="open-leaderboard" variant="outline" size="sm" />}
          >
            <Trophy className="size-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Leaderboard</DialogTitle>
            </DialogHeader>
            <LeaderboardPanel />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}

const DIFFICULTY_META: Record<
  Difficulty,
  { icon: typeof Shield; accent: string; ring: string }
> = {
  recruit: {
    icon: Shield,
    accent: "text-success",
    ring: "border-success/60 bg-success/5",
  },
  operator: {
    icon: Swords,
    accent: "text-primary",
    ring: "border-primary/60 bg-primary/5",
  },
  chaos_lord: {
    icon: Skull,
    accent: "text-critical",
    ring: "border-critical/60 bg-critical/5",
  },
}

function StartScreen({
  difficulty,
  onDifficulty,
  onStart,
}: {
  difficulty: Difficulty
  onDifficulty: (d: Difficulty) => void
  onStart: () => void
}) {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="pt-6">
        <a
          href="https://cloudworldmodel.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <span className="size-2 animate-pulse rounded-full bg-critical" />
          Powered by the Cloud World Model
          <ExternalLink className="size-3 opacity-60 transition-opacity group-hover:opacity-100" />
        </a>
        <h1 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Build it. Break it. <span className="text-primary">Survive it.</span>
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
          Design an AWS architecture on a strict hourly budget, then defend it
          against a randomized barrage of escalating disasters. The Cloud World
          Model simulates every outcome. How long can your stack stay up?
        </p>

        <div className="mt-7">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Select threat level
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.values(DIFFICULTIES)).map((d) => {
              const meta = DIFFICULTY_META[d.key]
              const Icon = meta.icon
              const active = difficulty === d.key
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => onDifficulty(d.key)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    active ? meta.ring : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <Icon className={cn("size-5", meta.accent)} />
                  <p className="mt-2 text-sm font-semibold">{d.name}</p>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {d.tagline}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                    <Wallet className="size-3.5" />${d.budget}/hr · {d.disasterCount} disasters · {d.scoreMultiplier}× pts
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <Button size="lg" className="mt-6" onClick={onStart}>
          Start Building
          <ArrowRight className="size-4" />
        </Button>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Feature icon={Boxes} title="11 AWS services" desc="Compose compute, data, edge, cache and more." />
          <Feature icon={ShieldHalf} title="Randomized chaos" desc="A fresh disaster order every single run." />
          <Feature icon={Activity} title="Live telemetry" desc="Latency, errors and cost in real time." />
        </div>
      </div>

      <LeaderboardPanel />
    </div>
  )
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Activity
  title: string
  desc: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Icon className="size-5 text-primary" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  )
}
