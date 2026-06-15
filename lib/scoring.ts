import type { SimMetrics } from "./types"

/**
 * Points awarded for surviving a single disaster round.
 * Combines chaos resilience with live operational metrics (uptime, latency, cost),
 * scaled by difficulty and penalized for spending close to the budget ceiling.
 *
 * @param budgetPressure ratio of current spend to budget (0–1+); over 1 means over budget.
 * @param scoreMultiplier difficulty multiplier applied to the round total.
 */
export function scoreRound(
  resilience: number,
  passed: boolean,
  metrics: SimMetrics,
  budgetPressure = 0,
  scoreMultiplier = 1,
): number {
  const uptime = Math.max(0, 100 - metrics.errorRate) // % successful
  const latencyScore = clamp(100 - metrics.latencyP95 / 6, 0, 100)
  // Reward efficient designs: the closer to (or over) budget, the less the cost bonus.
  const efficiencyScore = clamp(100 - budgetPressure * 90, 0, 100)

  const base =
    resilience * 6 + uptime * 1.5 + latencyScore * 0.8 + efficiencyScore * 0.6
  const bonus = passed ? 150 : 0
  // Going over budget bleeds points.
  const overBudgetPenalty = budgetPressure > 1 ? (budgetPressure - 1) * 400 : 0
  const total = (base + bonus - overBudgetPenalty) * scoreMultiplier
  return Math.max(0, Math.round(total))
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
