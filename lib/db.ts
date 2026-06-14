import "server-only"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import type { GameState, ScoreEntry } from "./types"

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME
// The table uses a composite primary key: PK (hash) + SK (range), both strings.
const PK = process.env.DYNAMODB_TABLE_PARTITION_KEY || "PK"
const SK = process.env.DYNAMODB_TABLE_SORT_KEY || "SK"

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

// Partition layout:
//   Games:  PK = "GAME#<id>",  SK = "GAME#<id>"
//   Scores: PK = "LEADERBOARD", SK = "<paddedScore>#<id>"  (one partition, sorted by score)
const gamePK = (id: string) => `GAME#${id}`
const LEADERBOARD_PK = "LEADERBOARD"

/** Zero-pad a score so DynamoDB's lexical range sort matches numeric order. */
function scoreSortKey(score: number, id: string): string {
  const padded = String(Math.max(0, Math.min(99999999, Math.round(score)))).padStart(8, "0")
  return `${padded}#${id}`
}

/** Persist (create or overwrite) a game's full state, including event history. */
export async function saveGame(game: GameState): Promise<GameState> {
  const item = { [PK]: gamePK(game.id), [SK]: gamePK(game.id), ...game }
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))
  return game
}

export async function getGame(id: string): Promise<GameState | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK]: gamePK(id), [SK]: gamePK(id) },
    }),
  )
  if (!res.Item) return null
  const { [PK]: _pk, [SK]: _sk, ...rest } = res.Item as Record<string, unknown>
  return rest as unknown as GameState
}

/** Record a final score row used to build the leaderboard. */
export async function saveScore(entry: ScoreEntry): Promise<ScoreEntry> {
  const item = {
    [PK]: LEADERBOARD_PK,
    [SK]: scoreSortKey(entry.score, entry.id),
    ...entry,
  }
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))
  return entry
}

/** Query the leaderboard partition, returning the top N scores descending. */
export async function getLeaderboard(limit = 25): Promise<ScoreEntry[]> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: { "#pk": PK },
      ExpressionAttributeValues: { ":pk": LEADERBOARD_PK },
      ScanIndexForward: false, // highest score first
      Limit: limit,
    }),
  )
  return (res.Items ?? []).map((it) => {
    const { [PK]: _pk, [SK]: _sk, ...rest } = it as Record<string, unknown>
    return rest as unknown as ScoreEntry
  })
}
