import { cookies } from "next/headers"
import { clinicalDisplayLabel, type ClinicalLocale } from "@lospor/core/display"
import type { ResearchQualityResponse } from "@lospor/core/research"
import { apiServerJson } from "@/lib/api"
import { messages, type TranslationKey } from "@/lib/i18n"
import { PageHeading } from "@/components/page-heading"

export default async function QualityPage() {
  const quality = await apiServerJson<ResearchQualityResponse>("/v1/research/quality")
  const store = await cookies()
  const locale: ClinicalLocale = store.get("lospor_database_locale")?.value === "bg" ? "bg" : "en"
  const message = (key: TranslationKey) => messages[locale][key]

  return (
    <>
      <PageHeading
        title="Data quality"
        titleBg="Качество на данните"
        description="Completeness, terminology mapping, finalization integrity, and timeline consistency."
        descriptionBg="Пълнота, терминологично съответствие, финализация и времева последователност."
      />
      <section className="grid metrics-grid">
        <QualityMetric label={message("allCases")} value={quality.totalCases} />
        <QualityMetric label={message("finalizedCases")} value={quality.finalizedCases} />
        <QualityMetric label={message("snapshotCoverage")} value={`${quality.snapshotCoverage.toFixed(1)}%`} good={quality.snapshotCoverage >= 99} locale={locale} />
        <QualityMetric label={message("relationalDrift")} value={quality.relationalDriftCases} good={quality.relationalDriftCases === 0} locale={locale} />
        <QualityMetric label={message("impossibleTimelines")} value={quality.impossibleTimelineCases} good={quality.impossibleTimelineCases === 0} locale={locale} />
      </section>
      <section className="grid equal-columns" style={{ marginTop: 14 }}>
        <div className="panel">
          <div className="panel-header"><h3>{message("terminologyMapping")}</h3></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>{message("domain")}</th><th>{message("mapped")}</th><th>{message("sourceOnly")}</th><th>{message("unmapped")}</th><th>{message("coverage")}</th></tr></thead>
              <tbody>{quality.mappings.map(row => (
                <tr key={row.domain}>
                  <td><strong>{clinicalDisplayLabel("researchDomain", row.domain, locale)}</strong></td>
                  <td className="number">{row.mapped}</td>
                  <td className="number">{row.sourceOnly}</td>
                  <td className="number">{row.unmapped}</td>
                  <td className="number"><span className={`pill ${row.coverage >= 90 ? "good" : "warn"}`}>{row.coverage.toFixed(1)}%</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><h3>{message("lowestCompleteness")}</h3></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>{message("section")}</th><th>{message("field")}</th><th>{message("present")}</th><th>{message("absent")}</th><th>{message("complete")}</th></tr></thead>
              <tbody>{[...quality.fields].sort((a, b) => a.completeness - b.completeness).slice(0, 25).map(row => (
                <tr key={`${row.section}.${row.field}`}>
                  <td>{clinicalDisplayLabel("researchSection", row.section, locale)}</td>
                  <td>
                    <strong>{clinicalDisplayLabel("researchField", row.field, locale)}</strong><br />
                    <code className="mono">{row.field}</code>
                  </td>
                  <td className="number">{row.present}</td>
                  <td className="number">{row.absent}</td>
                  <td className="number"><span className={`pill ${row.completeness >= 90 ? "good" : row.completeness >= 70 ? "warn" : "bad"}`}>{row.completeness.toFixed(1)}%</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </section>
      <div className="notice" style={{ marginTop: 14 }}>{message("qualityScopeNote")}</div>
    </>
  )
}

function QualityMetric({
  label,
  value,
  good,
  locale = "en",
}: {
  label: string
  value: string | number
  good?: boolean
  locale?: ClinicalLocale
}) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {good !== undefined && (
        <div className={`metric-note ${good ? "" : "error"}`}>
          {good
            ? messages[locale].expectedRange
            : messages[locale].reviewRequired}
        </div>
      )}
    </div>
  )
}
