/** Resource categories understood by the Cloud World Model API. */
export type CwmResourceType =
  | "compute"
  | "database"
  | "storage"
  | "network"
  | "cache"
  | "queue"
  | "kubernetes"
  | "security"

/** The six disasters the game throws at the player. */
export type DisasterKind =
  | "traffic_spike"
  | "dynamo_throttle"
  | "region_outage"
  | "queue_backlog"
  | "db_corruption"
  | "cost_explosion"

export type CostHint = "low" | "medium" | "high"

/** A selectable AWS service in the architecture catalog. */
export interface ServiceDef {
  key: string
  name: string
  short: string
  cwmType: CwmResourceType
  description: string
  costHint: CostHint
}

/** A provisioned resource inside a player's architecture. */
export interface ArchResource {
  id: string
  serviceKey: string
  type: CwmResourceType
  name: string
  count: number
  multiAz: boolean
}

/** Definition of a disaster, including which resource types defend against it. */
export interface DisasterDef {
  kind: DisasterKind
  name: string
  tagline: string
  description: string
  trafficMultiplier: number
  mitigatedBy: CwmResourceType[]
  chaosScenarioId: string | null
}

/** Operational metrics returned by the simulator (or the local engine). */
export interface SimMetrics {
  latencyP50: number
  latencyP95: number
  latencyP99: number
  cpuUsage: number
  memoryUsage: number
  throughput: number
  errorRate: number
  costPerHour: number
  connectionPressure: number
}

/** A single disaster outcome recorded in the event log. */
export interface GameEvent {
  id: string
  at: number
  disaster: DisasterKind
  title: string
  detail: string
  passed: boolean
  resilienceScore: number
  pointsDelta: number
  metrics: SimMetrics
}

/** A mid-game architecture decision. */
export interface Decision {
  at: number
  label: string
  cost: number
}

export type GameStatus = "in_progress" | "completed"

/** Full persisted game state (stored in DynamoDB). */
export interface GameState {
  id: string
  kind: "game"
  playerName: string
  status: GameStatus
  architecture: ArchResource[]
  simulationId: string | null
  baselineRPS: number
  round: number
  totalRounds: number
  score: number
  metrics: SimMetrics
  events: GameEvent[]
  decisions: Decision[]
  usedFallback: boolean
  createdAt: number
  updatedAt: number
}

/** A leaderboard row written when a game completes. */
export interface ScoreEntry {
  id: string
  kind: "score"
  playerName: string
  score: number
  resilience: number
  survived: number
  totalDisasters: number
  avgLatency: number
  costPerHour: number
  createdAt: number
}
