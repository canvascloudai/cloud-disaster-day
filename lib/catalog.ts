import type { ServiceDef, DisasterDef, DisasterKind } from "./types"

/** The AWS services a player can compose into an architecture. */
export const AWS_SERVICES: ServiceDef[] = [
  {
    key: "ec2",
    name: "EC2 Compute",
    short: "EC2",
    cwmType: "compute",
    description: "General-purpose compute instances for your application tier.",
    costHint: "medium",
  },
  {
    key: "eks",
    name: "EKS / Kubernetes",
    short: "EKS",
    cwmType: "kubernetes",
    description: "Auto-scaling container orchestration that absorbs traffic spikes.",
    costHint: "high",
  },
  {
    key: "dynamodb",
    name: "DynamoDB",
    short: "DynamoDB",
    cwmType: "database",
    description: "Serverless NoSQL key-value store with on-demand throughput.",
    costHint: "medium",
  },
  {
    key: "rds",
    name: "RDS (Aurora)",
    short: "RDS",
    cwmType: "database",
    description: "Managed relational database with automated backups and failover.",
    costHint: "high",
  },
  {
    key: "elasticache",
    name: "ElastiCache",
    short: "Cache",
    cwmType: "cache",
    description: "In-memory cache that shields databases from read pressure.",
    costHint: "medium",
  },
  {
    key: "sqs",
    name: "SQS Queue",
    short: "SQS",
    cwmType: "queue",
    description: "Managed message queue that buffers bursts and smooths backlogs.",
    costHint: "low",
  },
  {
    key: "elb",
    name: "Load Balancer",
    short: "ELB",
    cwmType: "network",
    description: "Distributes traffic across instances and availability zones.",
    costHint: "low",
  },
  {
    key: "cloudfront",
    name: "CloudFront CDN",
    short: "CDN",
    cwmType: "network",
    description: "Edge caching that offloads origin traffic during spikes.",
    costHint: "medium",
  },
  {
    key: "s3",
    name: "S3 Storage",
    short: "S3",
    cwmType: "storage",
    description: "Durable object storage for backups, assets, and recovery points.",
    costHint: "low",
  },
  {
    key: "backup",
    name: "AWS Backup",
    short: "Backup",
    cwmType: "storage",
    description: "Point-in-time snapshots enabling recovery from data corruption.",
    costHint: "low",
  },
  {
    key: "waf",
    name: "WAF / Shield",
    short: "WAF",
    cwmType: "security",
    description: "Filters malicious traffic and absorbs volumetric attacks.",
    costHint: "medium",
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

/** Fixed order disasters strike during a run. */
export const DISASTER_ORDER: DisasterKind[] = [
  "traffic_spike",
  "dynamo_throttle",
  "queue_backlog",
  "region_outage",
  "db_corruption",
  "cost_explosion",
]
