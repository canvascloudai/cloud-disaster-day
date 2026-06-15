import { getTableProof, getLeaderboard } from "@/lib/db"
import { Database, KeyRound, CheckCircle2, HardDrive, ListOrdered } from "lucide-react"

export const dynamic = "force-dynamic"

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export default async function DbProofPage() {
  let proof: Awaited<ReturnType<typeof getTableProof>> | null = null
  let scores: Awaited<ReturnType<typeof getLeaderboard>> = []
  let error: string | null = null

  try {
    ;[proof, scores] = await Promise.all([getTableProof(), getLeaderboard(8)])
  } catch (err) {
    error = (err as Error).message
  }

  return (
    <main className="flex min-h-dvh items-start justify-center bg-muted/40 p-8">
      <div
        id="proof"
        className="flex flex-col gap-5 rounded-xl border border-border bg-card p-8"
        style={{ width: 1100 }}
      >
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-border pb-4">
          <span className="flex size-10 items-center justify-center rounded-lg bg-warning/15 text-warning">
            <Database className="size-6" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Amazon DynamoDB — Live Usage Proof</h1>
            <p className="font-mono text-xs text-muted-foreground">
              Cloud Disaster Day · read live from the AWS SDK via Vercel OIDC (IAM)
            </p>
          </div>
        </header>

        {error && (
          <p className="rounded-md border border-critical/40 bg-critical/10 p-4 font-mono text-sm text-critical">
            Could not reach DynamoDB: {error}
          </p>
        )}

        {proof && (
          <>
            {/* Metadata grid */}
            <section className="grid grid-cols-4 gap-3">
              {[
                { label: "Table name", value: proof.tableName, icon: Database },
                { label: "Region", value: proof.region, icon: HardDrive },
                { label: "Status", value: proof.status, icon: CheckCircle2 },
                { label: "Billing mode", value: proof.billingMode, icon: ListOrdered },
                { label: "Item count", value: String(proof.itemCount), icon: ListOrdered },
                { label: "Table size", value: fmtBytes(proof.sizeBytes), icon: HardDrive },
                { label: "Table ARN", value: proof.arnMasked, icon: KeyRound, span: 2 },
              ].map((c) => (
                <div
                  key={c.label}
                  className={`rounded-lg border border-border bg-background p-3 ${c.span === 2 ? "col-span-2" : ""}`}
                >
                  <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <c.icon className="size-3" />
                    {c.label}
                  </div>
                  <div className="truncate font-mono text-sm font-medium">{c.value}</div>
                </div>
              ))}
            </section>

            <p className="-mt-1 font-mono text-[10px] text-muted-foreground">
              Note: DynamoDB reports ItemCount / TableSize from periodic snapshots (~every 6h), so they can lag the
              live records shown below.
            </p>

            {/* Key schema */}
            <section className="rounded-lg border border-border bg-background p-4">
              <h2 className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                <KeyRound className="size-3.5" /> Primary key schema (composite)
              </h2>
              <div className="flex flex-wrap gap-2">
                {proof.keySchema.map((k) => (
                  <span
                    key={k.name}
                    className="rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 font-mono text-sm"
                  >
                    {k.name} <span className="text-muted-foreground">· {k.type}</span>
                  </span>
                ))}
              </div>
            </section>

            {/* Sample keys */}
            <section className="rounded-lg border border-border bg-background p-4">
              <h2 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Sample item keys (live scan)
              </h2>
              <div className="grid gap-1">
                {proof.sampleKeys.map((k, i) => (
                  <div key={i} className="flex gap-4 font-mono text-xs text-muted-foreground">
                    <span className="w-44 truncate text-foreground">{k.PK}</span>
                    <span className="truncate">{k.SK}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Live leaderboard rows */}
            <section className="rounded-lg border border-border bg-background p-4">
              <h2 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Live leaderboard records (Query on LEADERBOARD partition)
              </h2>
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1 font-normal">Operator</th>
                    <th className="py-1 font-normal">Score</th>
                    <th className="py-1 font-normal">Survived</th>
                    <th className="py-1 font-normal">Resilience</th>
                    <th className="py-1 font-normal">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((s) => (
                    <tr key={s.id} className="border-t border-border/60">
                      <td className="py-1.5">{s.playerName}</td>
                      <td className="py-1.5 text-primary">{s.score}</td>
                      <td className="py-1.5">
                        {s.survived}/{s.totalDisasters}
                      </td>
                      <td className="py-1.5">{s.resilience}</td>
                      <td className="py-1.5 text-muted-foreground">{s.difficulty}</td>
                    </tr>
                  ))}
                  {scores.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-2 text-muted-foreground">
                        No scores yet — play a round to populate this partition.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
