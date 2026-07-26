import type {
  ResearchQualityResponse,
  ResearchQueryResponse,
} from "@lospor/core/research"
import { apiServerJson } from "@/lib/api"
import { PageHeading } from "@/components/page-heading"
import { MetricCard } from "@/components/metric-card"
import { DistributionChart } from "@/components/distribution-chart"
import { CasesTable } from "@/components/cases-table"

export default async function OverviewPage() {
  const [query, quality] = await Promise.all([
    apiServerJson<ResearchQueryResponse>("/v1/research/query", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cohort: { version: 1, filters: { statuses: ["COMPLETE"] } },
        pagination: { skip: 0, take: 8 },
        metrics: [
          "caseCount",
          "meanAgeYears",
          "meanDurationMinutes",
          "complicationRate",
          "ponvRate",
          "mappingCoverage",
          "fieldCompleteness",
        ],
        distributions: ["asa", "procedure"],
      }),
    }),
    apiServerJson<ResearchQualityResponse>("/v1/research/quality"),
  ])
  const asa = query.distributions.find(item => item.id === "asa")
  const procedures = query.distributions.find(item => item.id === "procedure")

  return (
    <>
      <PageHeading
        title="Research overview"
        titleBg="Изследователско обобщение"
        description="Finalized perioperative activity inside your authorized data scope."
        descriptionBg="Завършена периоперативна дейност в рамките на разрешения обхват."
      />
      <section className="grid metrics-grid">
        {query.metrics.slice(0, 4).map(item => <MetricCard key={item.id} metric={item} />)}
      </section>
      <section className="grid equal-columns" style={{ marginTop: 14 }}>
        <div className="panel">
          <div className="panel-header"><h3>ASA physical status</h3></div>
          <div className="panel-body">
            {asa ? <DistributionChart distribution={asa} /> : <div className="empty">No ASA data</div>}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><h3>Most frequent procedures</h3></div>
          <div className="panel-body">
            {procedures
              ? <DistributionChart distribution={procedures} />
              : <div className="empty">No procedure data</div>}
          </div>
        </div>
      </section>
      <section className="grid metrics-grid" style={{ marginTop: 14 }}>
        {query.metrics.slice(4).map(item => <MetricCard key={item.id} metric={item} />)}
        <div className="metric">
          <div className="metric-label">Snapshot coverage</div>
          <div className="metric-value">{quality.snapshotCoverage.toFixed(1)}%</div>
          <div className="metric-note">{quality.finalizedCases} finalized cases</div>
        </div>
      </section>
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-header">
          <h3>Recently finalized cases</h3>
          <span className="pill info">{query.matchingCases} total</span>
        </div>
        <CasesTable cases={query.cases} />
      </section>
    </>
  )
}
