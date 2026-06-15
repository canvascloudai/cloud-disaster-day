import type { Metadata } from "next"
import {
  Boxes,
  Cloud,
  Database,
  Globe,
  Layers,
  ServerCog,
  ShieldCheck,
  Trophy,
  Zap,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Cloud Disaster Day — System Architecture",
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-secondary/60 px-3 py-2 text-[13px] font-medium text-foreground">
      {children}
    </div>
  )
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-2">
      <span className="mb-1 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center">
        <div className="h-px w-12 bg-primary" />
        <div className="size-0 border-y-4 border-l-[7px] border-y-transparent border-l-primary" />
      </div>
    </div>
  )
}

export default function ArchitectureDiagramPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-10">
      {/* Fixed-size canvas sized for a clean 16:9 export */}
      <div
        id="diagram"
        className="flex flex-col gap-8 rounded-xl border border-border bg-card p-10"
        style={{ width: 1280, height: 720 }}
      >
        {/* Title */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Cloud className="size-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Cloud Disaster Day — System Architecture</h1>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                AWS chaos simulation game · built with Vercel v0
              </p>
            </div>
          </div>
          <span className="rounded-full border border-border bg-secondary/60 px-3 py-1 font-mono text-[11px] text-muted-foreground">
            Next.js · DynamoDB · Cloud World Model
          </span>
        </header>

        {/* Three layers */}
        <div className="flex flex-1 items-stretch">
          {/* Layer 1: Client */}
          <section className="flex w-[280px] flex-col rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Client · Browser
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <Pill>
                <span className="flex items-center gap-2">
                  <Boxes className="size-4 text-primary" /> Architecture Builder
                </span>
              </Pill>
              <Pill>
                <span className="flex items-center gap-2">
                  <Zap className="size-4 text-primary" /> War Room Dashboard
                </span>
              </Pill>
              <Pill>
                <span className="flex items-center gap-2">
                  <Trophy className="size-4 text-primary" /> Results &amp; Leaderboard
                </span>
              </Pill>
            </div>
            <p className="mt-auto pt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              React UI · SWR data fetching · dark mission-control theme
            </p>
          </section>

          <div className="flex items-center">
            <Arrow label="HTTPS / JSON" />
          </div>

          {/* Layer 2: Vercel / Next.js */}
          <section className="flex flex-1 flex-col rounded-lg border border-primary/40 bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Vercel — Next.js App (App Router)
              </h2>
            </div>

            <div className="mb-3 rounded-md border border-border bg-secondary/40 p-3">
              <p className="text-[13px] font-semibold">App Router Pages &amp; Client Components</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                Server-rendered shell · interactive game phases
              </p>
            </div>

            <div className="rounded-md border border-border bg-secondary/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <ServerCog className="size-4 text-primary" />
                <p className="text-[13px] font-semibold">API Route Handlers</p>
              </div>
              <ul className="grid gap-1 font-mono text-[11px] text-muted-foreground">
                <li>POST /api/game — create simulation</li>
                <li>POST /api/game/[id]/disaster — run chaos</li>
                <li>POST /api/game/[id]/decision — reinforce</li>
                <li>POST /api/game/[id]/decommission — remove</li>
                <li>POST /api/game/[id]/complete — finalize score</li>
                <li>GET&nbsp;&nbsp;/api/leaderboard — top runs</li>
              </ul>
            </div>
          </section>

          {/* Arrows to services */}
          <section className="flex w-[300px] flex-col justify-between py-2" style={{ marginLeft: 72 }}>
            {/* Cloud World Model */}
            <div className="relative">
              <div className="absolute -left-[60px] top-1/2 -translate-y-1/2">
                <Arrow label="API key" />
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Cloud className="size-4 text-primary" />
                  <h3 className="text-[13px] font-semibold">Cloud World Model API</h3>
                </div>
                <ul className="grid gap-0.5 font-mono text-[11px] text-muted-foreground">
                  <li>create simulation</li>
                  <li>step — traffic + live metrics</li>
                  <li>chaos scenarios — resilience</li>
                </ul>
                <div className="mt-2 flex items-center gap-1.5 rounded border border-dashed border-border px-2 py-1 font-mono text-[10px] text-muted-foreground">
                  <ShieldCheck className="size-3 text-success" />
                  Local fallback engine (deterministic)
                </div>
              </div>
            </div>

            {/* DynamoDB */}
            <div className="relative">
              <div className="absolute -left-[60px] top-1/2 -translate-y-1/2">
                <Arrow label="AWS SDK" />
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Database className="size-4 text-warning" />
                  <h3 className="text-[13px] font-semibold">Amazon DynamoDB</h3>
                </div>
                <ul className="grid gap-0.5 font-mono text-[11px] text-muted-foreground">
                  <li>Composite key — PK / SK</li>
                  <li>Game state · event history</li>
                  <li>Scores · global leaderboard</li>
                </ul>
                <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-success" />
                  IAM auth via OIDC (no static keys)
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
