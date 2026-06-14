import { NextResponse } from "next/server"
import { getGame } from "@/lib/db"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const game = await getGame(id)
  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 })
  }
  return NextResponse.json({ game })
}
