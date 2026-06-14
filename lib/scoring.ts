import type { SimMetrics } from "./types"

/**
 * Points awarded for surviving a single disaster round.
 * Combines chaos resilience with live operational metrics (uptime, latency, cost).
 */
export function scoreRound(
  resilience: number,
  passed: boolean,
  metrics: SimMetrics,
): number {
  const uptime = Math.max(0, 100 - metrics.errorRate) // % successful
  const latencyScore = clamp(100 - metrics.latencyP95 / 6, 0, 100)
  const costScore = clamp(100 - metrics.costPerHour * 2.5, 0, 100)

  const base =
    resilience * 6 + uptime * 1.5 + latencyScore * 0.8 + costScore * 0.6
  const bonus = passed ? 150 : 0
  return Math.max(0, Math.round(base + bonus))
}

/** Letter grade for a resilience value. */
export function grade(resilience: number): string {
  if (resilience >= 90) return "S"
  if (resilience >= 80) return "A"
  if (resilience >= 70) return "B"
  if (resilience >= 55) return "C"
  if (resilience >= 40) return "D"
  return "F"
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Health status derived from operational metrics, for UI coloring. */
export function metricStatus(metrics: SimMetrics): "healthy" | "degraded" | "critical" {
  if (metrics.errorRate >= 25 || metrics.cpuUsage >= 90 || metrics.latencyP95 >= 500)
    return "critical"
  if (metrics.errorRate >= 5 || metrics.cpuUsage >= 70 || metrics.latencyP95 >= 250)
    return "degraded"
  return "healthy"
}
