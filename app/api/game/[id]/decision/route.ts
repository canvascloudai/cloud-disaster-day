import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { getGame, saveGame } from "@/lib/db"
import { createSimulation, stepSimulation } from "@/lib/cwm"
import { SERVICE_BY_KEY, resourceCostPerHour, architectureCostPerHour } from "@/lib/catalog"
import type { ArchResource } from "@/lib/types"

// Apply an architecture decision (add a new service) mid-game.
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
    const def = SERVICE_BY_KEY[String(body?.serviceKey)]
    if (!def) return NextResponse.json({ error: "Unknown service." }, { status: 400 })

    const multiAz = Boolean(body?.multiAz)
    const newResource: ArchResource = {
      id: nanoid(8),
      serviceKey: def.key,
      type: def.cwmType,
      name: def.name,
      count: 1,
      multiAz,
    }

    // Enforce the budget ceiling: reinforcements can't exceed $/hr budget.
    const addedCost = resourceCostPerHour({ serviceKey: def.key, count: 1, multiAz })
    const newSpend = Math.round((game.spend + addedCost) * 100) / 100
    if (newSpend > game.budget) {
      return NextResponse.json(
        {
          error: `${def.name}${multiAz ? " (Multi-AZ)" : ""} costs $${addedCost.toFixed(0)}/hr — that would push you to $${newSpend.toFixed(0)}/hr, over your $${game.budget}/hr budget.`,
        },
        { status: 400 },
      )
    }

    const architecture = [...game.architecture, newResource]

    // Rebuild the simulation with the upgraded architecture.
    const { simulationId, usedFallback: createFallback } = await createSimulation(
      `cdd-${game.id}-r${game.round}`,
      architecture,
    )
    const { metrics, usedFallback: stepFallback } = await stepSimulation(
      simulationId,
      game.baselineRPS,
      architecture,
    )

    game.architecture = architecture
    game.simulationId = simulationId
    game.metrics = metrics
    game.spend = architectureCostPerHour(architecture)
    game.usedFallback = game.usedFallback || createFallback || stepFallback
    game.decisions.push({
      at: Date.now(),
      label: `Added ${def.name}${multiAz ? " (Multi-AZ)" : ""}`,
      cost: addedCost,
    })
    game.updatedAt = Date.now()

    await saveGame(game)
    return NextResponse.json({ game })
  } catch (err) {
    console.log("[v0] decision error:", (err as Error).message)
    return NextResponse.json({ error: "Failed to apply decision." }, { status: 500 })
  }
}
