import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { createSimulation, stepSimulation } from "@/lib/cwm"
import { saveGame } from "@/lib/db"
import { SERVICE_BY_KEY } from "@/lib/catalog"
import type { ArchResource, GameState } from "@/lib/types"
import { DISASTER_ORDER } from "@/lib/catalog"

interface IncomingResource {
  serviceKey: string
  count?: number
  multiAz?: boolean
}

const BASELINE_RPS = 800

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const playerName = String(body?.playerName || "").trim().slice(0, 40) || "Anonymous SRE"
    const incoming = (body?.architecture ?? []) as IncomingResource[]

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json(
        { error: "Architecture must contain at least one resource." },
        { status: 400 },
      )
    }

    // Normalize the architecture into resources the simulator understands.
    const architecture: ArchResource[] = []
    for (const r of incoming) {
      const def = SERVICE_BY_KEY[r.serviceKey]
      if (!def) continue
      architecture.push({
        id: nanoid(8),
        serviceKey: def.key,
        type: def.cwmType,
        name: def.name,
        count: Math.max(1, Math.min(10, Number(r.count) || 1)),
        multiAz: Boolean(r.multiAz),
      })
    }

    if (architecture.length === 0) {
      return NextResponse.json({ error: "No valid resources provided." }, { status: 400 })
    }

    const gameIdValue = nanoid(10)
    const { simulationId, usedFallback: createFallback } = await createSimulation(
      `cdd-${gameIdValue}`,
      architecture,
    )

    // Establish a baseline metrics reading at normal traffic.
    const { metrics, usedFallback: stepFallback } = await stepSimulation(
      simulationId,
      BASELINE_RPS,
      architecture,
    )

    const now = Date.now()
    const game: GameState = {
      id: gameIdValue,
      kind: "game",
      playerName,
      status: "in_progress",
      architecture,
      simulationId,
      baselineRPS: BASELINE_RPS,
      round: 0,
      totalRounds: DISASTER_ORDER.length,
      score: 0,
      metrics,
      events: [],
      decisions: [],
      usedFallback: createFallback || stepFallback,
      createdAt: now,
      updatedAt: now,
    }

    await saveGame(game)
    return NextResponse.json({ game })
  } catch (err) {
    console.log("[v0] game create error:", (err as Error).message)
    return NextResponse.json({ error: "Failed to create game." }, { status: 500 })
  }
}
