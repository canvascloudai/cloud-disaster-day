import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { getGame, saveGame, saveScore } from "@/lib/db"
import type { ScoreEntry } from "@/lib/types"

// Finalize a game and publish its result to the leaderboard.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const game = await getGame(id)
    if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 })

    if (game.status !== "completed") {
      game.status = "completed"
      game.updatedAt = Date.now()
      await saveGame(game)

      const survived = game.events.filter((e) => e.passed).length
      const avgResilience =
        game.events.length > 0
          ? Math.round(
              game.events.reduce((a, e) => a + e.resilienceScore, 0) / game.events.length,
            )
          : 0
      const avgLatency =
        game.events.length > 0
          ? Math.round(
              game.events.reduce((a, e) => a + e.metrics.latencyP95, 0) /
                game.events.length,
            )
          : 0

      const entry: ScoreEntry = {
        id: nanoid(10),
        kind: "score",
        playerName: game.playerName,
        difficulty: game.difficulty,
        score: game.score,
        resilience: avgResilience,
        survived,
        totalDisasters: game.events.length,
        avgLatency,
        costPerHour: game.metrics?.costPerHour ?? 0,
        createdAt: Date.now(),
      }
      await saveScore(entry)
    }

    return NextResponse.json({ game })
  } catch (err) {
    console.log("[v0] complete error:", (err as Error).message)
    return NextResponse.json({ error: "Failed to complete game." }, { status: 500 })
  }
}
