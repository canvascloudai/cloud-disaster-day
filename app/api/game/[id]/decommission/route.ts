import { NextResponse } from "next/server"
import { getGame, saveGame } from "@/lib/db"
import { createSimulation, stepSimulation } from "@/lib/cwm"
import {
  SERVICE_BY_KEY,
  DIFFICULTIES,
  resourceCostPerHour,
  architectureCostPerHour,
} from "@/lib/catalog"

// Decommission a resource mid-game. Frees budget but incurs a migration penalty.
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
    const resourceId = String(body?.resourceId)
    const target = game.architecture.find((r) => r.id === resourceId)
    if (!target) {
      return NextResponse.json({ error: "Resource not found." }, { status: 400 })
    }
    if (game.architecture.length <= 1) {
      return NextResponse.json(
        { error: "You must keep at least one resource running." },
        { status: 400 },
      )
    }

    const def = SERVICE_BY_KEY[target.serviceKey]
    const freed = resourceCostPerHour(target)
    const architecture = game.architecture.filter((r) => r.id !== resourceId)

    // Rebuild the simulation with the slimmed-down architecture.
    const { simulationId, usedFallback: createFallback } = await createSimulation(
      `cdd-${game.id}-r${game.round}-dec`,
      architecture,
    )
    const { metrics, usedFallback: stepFallback } = await stepSimulation(
      simulationId,
      game.baselineRPS,
      architecture,
    )

    // Ripping out infra under fire isn't free: apply a difficulty-scaled penalty.
    const diff = DIFFICULTIES[game.difficulty] ?? DIFFICULTIES.operator
    const penalty = Math.round(60 * diff.scoreMultiplier)

    game.architecture = architecture
    game.simulationId = simulationId
    game.metrics = metrics
    game.spend = architectureCostPerHour(architecture)
    game.score = Math.max(0, game.score - penalty)
    game.usedFallback = game.usedFallback || createFallback || stepFallback
    game.decisions.push({
      at: Date.now(),
      label: `Decommissioned ${def?.name ?? target.name}${target.multiAz ? " (Multi-AZ)" : ""}`,
      cost: -freed,
    })
    game.updatedAt = Date.now()

    await saveGame(game)
    return NextResponse.json({ game, penalty, freed })
  } catch (err) {
    console.log("[v0] decommission error:", (err as Error).message)
    return NextResponse.json({ error: "Failed to decommission." }, { status: 500 })
  }
}
