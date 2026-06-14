import "server-only"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import type { GameState, ScoreEntry } from "./types"

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME
const PK = process.env.DYNAMODB_TABLE_PARTITION_KEY || "id"

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN as string,
    clientConfig: { region: process.env.AWS_REGION },
  }),
})

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
})

const gameId = (id: string) => `game#${id}`
const scoreId = (id: string) => `score#${id}`

/** Persist (create or overwrite) a game's full state, including event history. */
export async function saveGame(game: GameState): Promise<GameState> {
  const item = { [PK]: gameId(game.id), ...game }
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))
  return game
}

export async function getGame(id: string): Promise<GameState | null> {
  const res = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { [PK]: gameId(id) } }),
  )
  if (!res.Item) return null
  const { [PK]: _pk, ...rest } = res.Item as Record<string, unknown>
  return rest as unknown as GameState
}

/** Record a final score row used to build the leaderboard. */
export async function saveScore(entry: ScoreEntry): Promise<ScoreEntry> {
  const item = { [PK]: scoreId(entry.id), ...entry }
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))
  return entry
}

/** Scan score rows and return the top N, sorted by score descending. */
export async function getLeaderboard(limit = 25): Promise<ScoreEntry[]> {
  const res = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "#kind = :kind",
      ExpressionAttributeNames: { "#kind": "kind" },
      ExpressionAttributeValues: { ":kind": "score" },
    }),
  )
  const items = (res.Items ?? []).map((it) => {
    const { [PK]: _pk, ...rest } = it as Record<string, unknown>
    return rest as unknown as ScoreEntry
  })
  return items.sort((a, b) => b.score - a.score).slice(0, limit)
}
