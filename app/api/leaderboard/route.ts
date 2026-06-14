import { NextResponse } from "next/server"
import { getLeaderboard } from "@/lib/db"

export async function GET() {
  try {
    const entries = await getLeaderboard(25)
    return NextResponse.json({ entries })
  } catch (err) {
    console.log("[v0] leaderboard error:", (err as Error).message)
    return NextResponse.json({ entries: [] })
  }
}
