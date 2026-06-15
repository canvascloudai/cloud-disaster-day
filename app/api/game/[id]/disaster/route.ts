import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { getGame, saveGame } from "@/lib/db"
import { runChaos, stepSimulation } from "@/lib/cwm"
import { DISASTERS, DIFFICULTIES } from "@/lib/catalog"
import { scoreRound } from "@/lib/scoring"
import type { GameEvent } from "@/lib/types"

// Inject the next queued disaster: elevate traffic, run chaos, score the round.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const game = await getGame(id)
    if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 })
    if (game.status === "completed") {
      return NextResponse.json({ error: "Game already completed." }, { status: 409 })
    }

    const roundIndex = game.events.length
    const kind = game.disasterQueue[roundIndex]
    const disaster = kind ? DISASTERS[kind] : undefined
    if (!disaster) {
      return NextResponse.json({ error: "No disasters remaining." }, { status: 409 })
    }

    const diff = DIFFICULTIES[game.difficulty] ?? DIFFICULTIES.operator

    // Traffic escalates each round and scales with difficulty.
    const escalation = 1 + roundIndex * diff.escalationStep
    const surgeRPS = Math.round(
      game.baselineRPS * disaster.trafficMultiplier * diff.trafficScale * escalation,
    )
    const step = await stepSimulation(game.simulationId, surgeRPS, game.architecture)
    const chaos = await runChaos(
      game.simulationId,
      disaster.chaosScenarioId,
      game.architecture,
      disaster,
    )

    // Difficulty sets the survival threshold; harder tiers demand more resilience.
    const passed = chaos.resilienceScore >= diff.passThreshold
    const budgetPressure = game.budget > 0 ? game.spend / game.budget : 0
    const points = scoreRound(
      chaos.resilienceScore,
      passed,
      step.metrics,
      budgetPressure,
      diff.scoreMultiplier,
    )

    const event: GameEvent = {
      id: nanoid(8),
      at: Date.now(),
      disaster: kind,
      title: disaster.name,
      detail: chaos.summary,
      passed,
      resilienceScore: chaos.resilienceScore,
      pointsDelta: points,
      surgeRPS,
      metrics: step.metrics,
    }

    game.events.push(event)
    game.score += points
    game.metrics = step.metrics
    game.round = game.events.length
    game.usedFallback = game.usedFallback || step.usedFallback || chaos.usedFallback
    game.updatedAt = Date.now()

    await saveGame(game)
    return NextResponse.json({ game, event })
  } catch (err) {
    console.log("[v0] disaster error:", (err as Error).message)
    return NextResponse.json({ error: "Failed to run disaster." }, { status: 500 })
  }
}
