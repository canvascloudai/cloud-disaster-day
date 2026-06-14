import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { getGame, saveGame } from "@/lib/db"
import { runChaos, stepSimulation } from "@/lib/cwm"
import { DISASTERS } from "@/lib/catalog"
import { scoreRound } from "@/lib/scoring"
import type { DisasterKind, GameEvent } from "@/lib/types"

// Inject a disaster: elevate traffic, run the chaos scenario, score the round.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const game = await getGame(id)
    if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 })
    if (game.status === "completed") {
      return NextResponse.json({ error: "Game already completed." }, { status: 409 })
    }

    const body = await req.json()
    const kind = String(body?.disaster) as DisasterKind
    const disaster = DISASTERS[kind]
    if (!disaster) {
      return NextResponse.json({ error: "Unknown disaster." }, { status: 400 })
    }
    if (game.events.some((e) => e.disaster === kind)) {
      return NextResponse.json(
        { error: "That disaster has already struck." },
        { status: 409 },
      )
    }

    // Spike the traffic for this disaster, then run the chaos scenario.
    const surgeRPS = Math.round(game.baselineRPS * disaster.trafficMultiplier)
    const step = await stepSimulation(game.simulationId, surgeRPS, game.architecture)
    const chaos = await runChaos(
      game.simulationId,
      disaster.chaosScenarioId,
      game.architecture,
      disaster,
    )

    const points = scoreRound(chaos.resilienceScore, chaos.passed, step.metrics)

    const event: GameEvent = {
      id: nanoid(8),
      at: Date.now(),
      disaster: kind,
      title: disaster.name,
      detail: chaos.summary,
      passed: chaos.passed,
      resilienceScore: chaos.resilienceScore,
      pointsDelta: points,
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
