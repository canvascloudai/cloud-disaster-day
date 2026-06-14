import "server-only"
import type { ArchResource, SimMetrics, DisasterDef } from "./types"

const BASE_URL = "https://cloudworldmodel.ai"
const API_KEY = process.env.CWM_API_KEY

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (API_KEY) h["Authorization"] = `Bearer ${API_KEY}`
  return h
}

async function cwmFetch(path: string, init?: RequestInit, timeoutMs = 20000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers || {}) },
      signal: controller.signal,
      cache: "no-store",
    })
    return res
  } finally {
    clearTimeout(t)
  }
}

/** Build the resource payload the Cloud World Model API expects. */
function toCwmResources(arch: ArchResource[]) {
  return arch.map((r) => ({
    id: r.id,
    type: r.type,
    name: r.name,
  }))
}

export interface CreateSimResult {
  simulationId: string | null
  usedFallback: boolean
}

/** Create a simulation in the Cloud World Model. Returns null id on failure. */
export async function createSimulation(
  name: string,
  arch: ArchResource[],
): Promise<CreateSimResult> {
  if (!API_KEY) return { simulationId: null, usedFallback: true }
  try {
    const res = await cwmFetch("/api/simulations", {
      method: "POST",
      body: JSON.stringify({ name, resources: toCwmResources(arch) }),
    })
    if (!res.ok) return { simulationId: null, usedFallback: true }
    const data = await res.json()
    return { simulationId: data?.id ?? null, usedFallback: !data?.id }
  } catch {
    return { simulationId: null, usedFallback: true }
  }
}

export interface StepResult {
  metrics: SimMetrics
  events: unknown[]
  usedFallback: boolean
}

function normalizeMetrics(m: Record<string, unknown> | undefined): SimMetrics {
  return {
    latencyP50: Number(m?.latencyP50 ?? 0),
    latencyP95: Number(m?.latencyP95 ?? 0),
    latencyP99: Number(m?.latencyP99 ?? 0),
    cpuUsage: Number(m?.cpuUsage ?? 0),
    memoryUsage: Number(m?.memoryUsage ?? 0),
    throughput: Number(m?.throughput ?? 0),
    errorRate: Number(m?.errorRate ?? 0),
    costPerHour: Number(m?.costPerHour ?? 0),
    connectionPressure: Number(m?.connectionPressure ?? 0),
  }
}

/** Advance the simulation one tick at a given traffic level. */
export async function stepSimulation(
  simulationId: string | null,
  trafficRPS: number,
  arch: ArchResource[],
): Promise<StepResult> {
  if (simulationId && API_KEY) {
    try {
      const res = await cwmFetch(`/api/simulations/${simulationId}/step`, {
        method: "POST",
        body: JSON.stringify({ trafficRPS }),
      })
      if (res.ok) {
        const data = await res.json()
        return {
          metrics: normalizeMetrics(data?.metrics),
          events: data?.events ?? [],
          usedFallback: false,
        }
      }
    } catch {
      // fall through to local engine
    }
  }
  return { metrics: localMetrics(arch, trafficRPS), events: [], usedFallback: true }
}

export interface ChaosResult {
  passed: boolean
  resilienceScore: number
  usedFallback: boolean
  summary: string
}

/** Run a Cloud World Model chaos scenario against a simulation. */
export async function runChaos(
  simulationId: string | null,
  scenarioId: string | undefined,
  arch: ArchResource[],
  disaster: DisasterDef,
): Promise<ChaosResult> {
  if (simulationId && scenarioId && API_KEY) {
    try {
      const res = await cwmFetch("/api/chaos/run", {
        method: "POST",
        body: JSON.stringify({ simulationId, scenarioId }),
      })
      if (res.ok) {
        const data = await res.json()
        const score =
          Number(data?.resilienceScore ?? data?.score ?? data?.result?.score ?? NaN)
        const threshold = Number(data?.passThreshold ?? 75)
        const passed =
          typeof data?.passed === "boolean"
            ? data.passed
            : Number.isFinite(score)
              ? score >= threshold
              : false
        if (Number.isFinite(score)) {
          return {
            passed,
            resilienceScore: Math.round(score),
            usedFallback: false,
            summary:
              typeof data?.summary === "string"
                ? data.summary
                : `Chaos scenario "${scenarioId}" completed.`,
          }
        }
      }
    } catch {
      // fall through to local engine
    }
  }
  return localChaos(arch, disaster)
}

/* -------------------------------------------------------------------------- */
/* Deterministic local fallback engine                                         */
/* Keeps the game fully playable when the API key/credits are unavailable.     */
/* -------------------------------------------------------------------------- */

function countByType(arch: ArchResource[]) {
  const counts: Record<string, number> = {}
  for (const r of arch) counts[r.type] = (counts[r.type] ?? 0) + r.count
  return counts
}

export function localMetrics(arch: ArchResource[], trafficRPS: number): SimMetrics {
  const c = countByType(arch)
  const compute = (c.compute ?? 0) + (c.kubernetes ?? 0)
  const cache = c.cache ?? 0
  const network = c.network ?? 0
  const db = c.database ?? 0
  const queue = c.queue ?? 0

  // Effective capacity grows with compute, cache and edge.
  const capacity = Math.max(1, compute * 1400 + cache * 2600 + network * 1800 + 400)
  const load = trafficRPS / capacity

  const cpuUsage = Math.min(100, Math.round(load * 70))
  const memoryUsage = Math.min(100, Math.round(load * 55 + 4))
  const errorRate = Math.max(0, Math.min(100, Math.round((load - 1) * 60)))
  const latencyP50 = Math.round(18 + load * 60)
  const latencyP95 = Math.round(latencyP50 * 2.1 + (db === 0 ? 40 : 0))
  const latencyP99 = Math.round(latencyP95 * 1.6)
  const throughput = Math.min(trafficRPS, capacity)
  const connectionPressure = db === 0 ? 80 : Math.min(100, Math.round(load * 50))

  // Cost scales with resource footprint and any emergency scaling under load.
  const baseCost =
    compute * 0.32 + db * 0.45 + cache * 0.28 + network * 0.12 + queue * 0.06 + 0.2
  const scaleFactor = 1 + Math.max(0, load - 0.6) * 1.4
  const costPerHour = Math.round(baseCost * scaleFactor * 100) / 100

  return {
    latencyP50,
    latencyP95,
    latencyP99,
    cpuUsage,
    memoryUsage,
    throughput,
    errorRate,
    costPerHour,
    connectionPressure,
  }
}

export function localChaos(arch: ArchResource[], disaster: DisasterDef): ChaosResult {
  const c = countByType(arch)
  // Mitigation: how many of the categories that counter this disaster are present.
  let score = 35
  for (const t of disaster.mitigatedBy) {
    if ((c[t] ?? 0) > 0) score += 18
  }
  // Redundancy bonus: multi-AZ resources and multiple instances.
  const redundancy = arch.filter((r) => r.multiAz || r.count > 1).length
  score += Math.min(20, redundancy * 6)

  // Region outage specifically rewards multi-AZ.
  if (disaster.kind === "region_outage") {
    const multiAz = arch.some((r) => r.multiAz)
    score += multiAz ? 14 : -20
  }
  // Cost explosion rewards lean, cache-heavy designs.
  if (disaster.kind === "cost_explosion") {
    const heavy = arch.filter((r) => r.count > 2).length
    score -= heavy * 6
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const passed = score >= 70
  return {
    passed,
    resilienceScore: score,
    usedFallback: true,
    summary: passed
      ? `Architecture absorbed the ${disaster.name.toLowerCase()} with resilience ${score}.`
      : `Architecture struggled against the ${disaster.name.toLowerCase()} (resilience ${score}).`,
  }
}
