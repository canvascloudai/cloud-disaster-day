import type {
  ServiceDef,
  DisasterDef,
  DisasterKind,
  Difficulty,
  DifficultyConfig,
} from "./types"

/** The AWS services a player can compose into an architecture. */
export const AWS_SERVICES: ServiceDef[] = [
  {
    key: "ec2",
    name: "EC2 Compute",
    short: "EC2",
    cwmType: "compute",
    description: "General-purpose compute instances for your application tier.",
    costHint: "medium",
    costPerHour: 4,
  },
  {
    key: "eks",
    name: "EKS / Kubernetes",
    short: "EKS",
    cwmType: "kubernetes",
    description: "Auto-scaling container orchestration that absorbs traffic spikes.",
    costHint: "high",
    costPerHour: 9,
  },
  {
    key: "dynamodb",
    name: "DynamoDB",
    short: "DynamoDB",
    cwmType: "database",
    description: "Serverless NoSQL key-value store with on-demand throughput.",
    costHint: "medium",
    costPerHour: 3,
  },
  {
    key: "rds",
    name: "RDS (Aurora)",
    short: "RDS",
    cwmType: "database",
    description: "Managed relational database with automated backups and failover.",
    costHint: "high",
    costPerHour: 11,
  },
  {
    key: "elasticache",
    name: "ElastiCache",
    short: "Cache",
    cwmType: "cache",
    description: "In-memory cache that shields databases from read pressure.",
    costHint: "medium",
    costPerHour: 5,
  },
  {
    key: "sqs",
    name: "SQS Queue",
    short: "SQS",
    cwmType: "queue",
    description: "Managed message queue that buffers bursts and smooths backlogs.",
    costHint: "low",
    costPerHour: 1.5,
  },
  {
    key: "elb",
    name: "Load Balancer",
    short: "ELB",
    cwmType: "network",
    description: "Distributes traffic across instances and availability zones.",
    costHint: "low",
    costPerHour: 2,
  },
  {
    key: "cloudfront",
    name: "CloudFront CDN",
    short: "CDN",
    cwmType: "network",
    description: "Edge caching that offloads origin traffic during spikes.",
    costHint: "medium",
    costPerHour: 3,
  },
  {
    key: "s3",
    name: "S3 Storage",
    short: "S3",
    cwmType: "storage",
    description: "Durable object storage for backups, assets, and recovery points.",
    costHint: "low",
    costPerHour: 1,
  },
  {
    key: "backup",
    name: "AWS Backup",
    short: "Backup",
    cwmType: "storage",
    description: "Point-in-time snapshots enabling recovery from data corruption.",
    costHint: "low",
    costPerHour: 1.5,
  },
  {
    key: "waf",
    name: "WAF / Shield",
    short: "WAF",
    cwmType: "security",
    description: "Filters malicious traffic and absorbs volumetric attacks.",
    costHint: "medium",
    costPerHour: 4,
  },
]

export const SERVICE_BY_KEY: Record<string, ServiceDef> = Object.fromEntries(
  AWS_SERVICES.map((s) => [s.key, s]),
)

/** The six disasters, mapped to real Cloud World Model chaos scenarios. */
export const DISASTERS: Record<DisasterKind, DisasterDef> = {
  traffic_spike: {
    kind: "traffic_spike",
    name: "Traffic Spike",
    tagline: "viral_event // 12x baseline",
    description:
      "A product goes viral and traffic explodes. Without elastic compute and edge caching, your fleet saturates and latency spirals.",
    trafficMultiplier: 12,
    mitigatedBy: ["kubernetes", "compute", "network", "cache"],
    chaosScenarioId: "cpu_stress",
  },
  dynamo_throttle: {
    kind: "dynamo_throttle",
    name: "DynamoDB Throttling",
    tagline: "provisioned_throughput_exceeded",
    description:
      "Hot partitions push DynamoDB past its throughput ceiling. Reads start failing unless a cache absorbs the load.",
    trafficMultiplier: 6,
    mitigatedBy: ["cache", "queue", "database"],
    chaosScenarioId: "database_overload",
  },
  region_outage: {
    kind: "region_outage",
    name: "Region Outage",
    tagline: "us-east-1 // availability_zone_loss",
    description:
      "An entire availability zone goes dark. Only multi-AZ, load-balanced architectures stay reachable.",
    trafficMultiplier: 3,
    mitigatedBy: ["network", "compute", "kubernetes"],
    chaosScenarioId: "zone_failure",
  },
  queue_backlog: {
    kind: "queue_backlog",
    name: "Queue Backlog",
    tagline: "consumers_lagging // depth_rising",
    description:
      "Downstream consumers fall behind and messages pile up. A buffering queue and scalable workers keep the system from collapsing.",
    trafficMultiplier: 5,
    mitigatedBy: ["queue", "kubernetes", "compute"],
    chaosScenarioId: "network_partition",
  },
  db_corruption: {
    kind: "db_corruption",
    name: "Database Corruption",
    tagline: "checksum_mismatch // data_integrity_loss",
    description:
      "A bad write corrupts primary data. Recovery depends on backups, snapshots, and a resilient database tier.",
    trafficMultiplier: 2,
    mitigatedBy: ["storage", "database"],
    chaosScenarioId: "database_crash",
  },
  cost_explosion: {
    kind: "cost_explosion",
    name: "Cost Explosion",
    tagline: "runaway_autoscaling // budget_breach",
    description:
      "Emergency autoscaling under load sends the bill soaring. Lean, cache-heavy designs ride it out; over-provisioned fleets bleed money.",
    trafficMultiplier: 8,
    mitigatedBy: ["cache", "queue", "network"],
    chaosScenarioId: "cascading_failure",
  },
}

export const ALL_DISASTERS: DisasterKind[] = [
  "traffic_spike",
  "dynamo_throttle",
  "queue_backlog",
  "region_outage",
  "db_corruption",
  "cost_explosion",
]

/** The three difficulty tiers that reshape budget, disaster count, and scoring. */
export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  recruit: {
    key: "recruit",
    name: "Recruit",
    tagline: "Generous budget · 4 disasters · forgiving",
    budget: 95,
    disasterCount: 4,
    trafficScale: 0.8,
    escalationStep: 0.05,
    passThreshold: 62,
    scoreMultiplier: 1,
  },
  operator: {
    key: "operator",
    name: "Operator",
    tagline: "Tight budget · 6 disasters · realistic",
    budget: 65,
    disasterCount: 6,
    trafficScale: 1,
    escalationStep: 0.12,
    passThreshold: 70,
    scoreMultiplier: 1.6,
  },
  chaos_lord: {
    key: "chaos_lord",
    name: "Chaos Lord",
    tagline: "Lean budget · 8 disasters · escalating hell",
    budget: 48,
    disasterCount: 8,
    trafficScale: 1.35,
    escalationStep: 0.22,
    passThreshold: 78,
    scoreMultiplier: 2.6,
  },
}

/** Deterministic-ish shuffle using Math.random (server-side, per game). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Build the randomized disaster queue for a run. Uses all six disasters
 * shuffled; if the difficulty demands more rounds than there are disasters,
 * additional random disasters are appended (repeats allowed).
 */
export function buildDisasterQueue(difficulty: Difficulty): DisasterKind[] {
  const count = DIFFICULTIES[difficulty].disasterCount
  const queue = shuffle(ALL_DISASTERS).slice(0, Math.min(count, ALL_DISASTERS.length))
  while (queue.length < count) {
    queue.push(ALL_DISASTERS[Math.floor(Math.random() * ALL_DISASTERS.length)])
  }
  return queue
}

/** Operating cost of a single resource in $/hr (Multi-AZ doubles it). */
export function resourceCostPerHour(resource: {
  serviceKey: string
  count: number
  multiAz: boolean
}): number {
  const def = SERVICE_BY_KEY[resource.serviceKey]
  if (!def) return 0
  const azFactor = resource.multiAz ? 2 : 1
  return def.costPerHour * resource.count * azFactor
}

/** Total operating cost of an architecture in $/hr. */
export function architectureCostPerHour(
  arch: Array<{ serviceKey: string; count: number; multiAz: boolean }>,
): number {
  return Math.round(arch.reduce((sum, r) => sum + resourceCostPerHour(r), 0) * 100) / 100
}
