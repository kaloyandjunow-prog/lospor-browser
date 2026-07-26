"use client"

import { useMemo, useState } from "react"
import { BookmarkPlus, Play, RotateCcw, Save } from "lucide-react"
import { clinicalDisplayLabel } from "@lospor/core/display"
import type {
  ResearchCohortDefinition,
  ResearchQueryResponse,
  SavedResearchCohort,
} from "@lospor/core/research"
import { apiJson } from "@/lib/client-api"
import {
  complicationChoices,
  optionChoices,
} from "@/lib/clinical-display"
import { CasesTable } from "./cases-table"
import { ClinicalMultiSelect } from "./clinical-multi-select"
import { DistributionChart } from "./distribution-chart"
import { MetricCard } from "./metric-card"
import { useLocale } from "./locale-provider"

type FormState = {
  from: string
  to: string
  ageMin: string
  ageMax: string
  bmiMin: string
  bmiMax: string
  sex: string
  asa: string
  emergency: string
  diagnosisCode: string
  diagnosisText: string
  comorbidityCode: string
  procedureCode: string
  procedureText: string
  technique: string
  position: string
  airway: string
  medication: string
  complication: string
  disposition: string
  completeness: string
}

const EMPTY: FormState = {
  from: "",
  to: "",
  ageMin: "",
  ageMax: "",
  bmiMin: "",
  bmiMax: "",
  sex: "",
  asa: "",
  emergency: "",
  diagnosisCode: "",
  diagnosisText: "",
  comorbidityCode: "",
  procedureCode: "",
  procedureText: "",
  technique: "",
  position: "",
  airway: "",
  medication: "",
  complication: "",
  disposition: "",
  completeness: "",
}

function list(value: string) {
  const values = value.split(",").map(item => item.trim()).filter(Boolean)
  return values.length ? values : undefined
}

function number(value: string) {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function buildCohort(form: FormState): ResearchCohortDefinition {
  const ageMin = number(form.ageMin)
  const ageMax = number(form.ageMax)
  const bmiMin = number(form.bmiMin)
  const bmiMax = number(form.bmiMax)
  return {
    version: 1,
    filters: {
      statuses: ["COMPLETE"],
      ...(form.from || form.to ? { finalized: {
        ...(form.from ? { from: form.from } : {}),
        ...(form.to ? { to: form.to } : {}),
      } } : {}),
      ...(ageMin !== undefined || ageMax !== undefined ? { ageYears: {
        ...(ageMin !== undefined ? { min: ageMin } : {}),
        ...(ageMax !== undefined ? { max: ageMax } : {}),
      } } : {}),
      ...(bmiMin !== undefined || bmiMax !== undefined ? { bmi: {
        ...(bmiMin !== undefined ? { min: bmiMin } : {}),
        ...(bmiMax !== undefined ? { max: bmiMax } : {}),
      } } : {}),
      ...(form.sex ? { sex: [form.sex] } : {}),
      ...(form.asa ? { asa: list(form.asa) } : {}),
      ...(form.emergency ? { emergency: form.emergency === "true" } : {}),
      ...(form.diagnosisCode ? { diagnosisCodes: list(form.diagnosisCode) } : {}),
      ...(form.diagnosisText ? { diagnosisText: form.diagnosisText } : {}),
      ...(form.comorbidityCode ? { comorbidityCodes: list(form.comorbidityCode) } : {}),
      ...(form.procedureCode ? { procedureCodes: list(form.procedureCode) } : {}),
      ...(form.procedureText ? { procedureText: form.procedureText } : {}),
      ...(form.technique ? { techniques: list(form.technique) } : {}),
      ...(form.position ? { positions: list(form.position) } : {}),
      ...(form.airway ? { airwayDevices: list(form.airway) } : {}),
      ...(form.medication ? { medications: list(form.medication) } : {}),
      ...(form.complication ? { complications: list(form.complication) } : {}),
      ...(form.disposition ? { dispositions: list(form.disposition) } : {}),
      ...(form.completeness ? { minimumCompleteness: number(form.completeness) } : {}),
    },
  }
}

export function CohortBuilder() {
  const { locale, message } = useLocale()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [result, setResult] = useState<ResearchQueryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [visibility, setVisibility] = useState<"PRIVATE" | "INSTITUTION">("PRIVATE")
  const [saved, setSaved] = useState<SavedResearchCohort | null>(null)
  const cohort = useMemo(() => buildCohort(form), [form])
  const techniqueOptions = useMemo(() => optionChoices("TECHNIQUE", locale), [locale])
  const positionOptions = useMemo(() => optionChoices("POSITION", locale), [locale])
  const airwayOptions = useMemo(() => optionChoices("AIRWAY_MANAGEMENT", locale).filter(option => option.group === "Device"), [locale])
  const complicationOptions = useMemo(() => complicationChoices(locale), [locale])
  const dispositionOptions = useMemo(() => optionChoices("DISPOSITION", locale), [locale])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function run(skip = 0) {
    setLoading(true)
    setError("")
    try {
      setResult(await apiJson<ResearchQueryResponse>("/research/query", {
        method: "POST",
        body: JSON.stringify({
          cohort,
          pagination: { skip, take: 25 },
          metrics: [
            "caseCount",
            "meanAgeYears",
            "meanBmi",
            "meanDurationMinutes",
            "emergencyRate",
            "complicationRate",
            "ponvRate",
            "meanAldrete",
            "mappingCoverage",
            "fieldCompleteness",
          ],
          distributions: ["asa", "procedure", "diagnosis", "technique", "disposition"],
        }),
      }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Query failed")
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    if (!saveName.trim()) return
    setLoading(true)
    setError("")
    try {
      const record = await apiJson<SavedResearchCohort>("/research/cohorts", {
        method: "POST",
        body: JSON.stringify({
          name: saveName,
          visibility,
          definition: cohort,
        }),
      })
      setSaved(record)
      setSaveOpen(false)
      setSaveName("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid">
      <section className="panel">
        <div className="panel-header">
          <h3>{message("structuredFilters")}</h3>
          <div className="toolbar">
            <button
              className="button"
              type="button"
              onClick={() => {
                setForm(EMPTY)
                setResult(null)
                setError("")
              }}
            >
              <RotateCcw size={15} /> {message("reset")}
            </button>
            <button className="button" type="button" onClick={() => setSaveOpen(value => !value)}>
              <BookmarkPlus size={15} /> {message("save")}
            </button>
            <button className="button primary" type="button" onClick={() => run()} disabled={loading}>
              <Play size={15} /> {loading ? message("running") : message("runQuery")}
            </button>
          </div>
        </div>
        <div className="panel-body">
          <div className="filter-grid">
            <Field label={message("finalizedFrom")}> <input className="input" type="date" value={form.from} onChange={e => set("from", e.target.value)} /></Field>
            <Field label={message("finalizedTo")}> <input className="input" type="date" value={form.to} onChange={e => set("to", e.target.value)} /></Field>
            <Field label={message("ageFrom")}> <input className="input" inputMode="numeric" value={form.ageMin} onChange={e => set("ageMin", e.target.value)} /></Field>
            <Field label={message("ageTo")}> <input className="input" inputMode="numeric" value={form.ageMax} onChange={e => set("ageMax", e.target.value)} /></Field>
            <Field label={message("bmiFrom")}> <input className="input" inputMode="decimal" value={form.bmiMin} onChange={e => set("bmiMin", e.target.value)} /></Field>
            <Field label={message("bmiTo")}> <input className="input" inputMode="decimal" value={form.bmiMax} onChange={e => set("bmiMax", e.target.value)} /></Field>
            <Field label={message("sex")}> 
              <select className="select" value={form.sex} onChange={e => set("sex", e.target.value)}>
                <option value="">{message("any")}</option><option value="MALE">{message("male")}</option><option value="FEMALE">{message("female")}</option><option value="OTHER">{message("other")}</option>
              </select>
            </Field>
            <Field label={message("asaComma")}> <input className="input" placeholder="II, III" value={form.asa} onChange={e => set("asa", e.target.value)} /></Field>
            <Field label={message("emergency")}> 
              <select className="select" value={form.emergency} onChange={e => set("emergency", e.target.value)}>
                <option value="">{message("any")}</option><option value="true">{message("emergency")}</option><option value="false">{message("elective")}</option>
              </select>
            </Field>
            <Field label={message("diagnosisIcd")}> <input className="input" placeholder="C61, I10" value={form.diagnosisCode} onChange={e => set("diagnosisCode", e.target.value)} /></Field>
            <Field label={message("diagnosisContains")}> <input className="input" value={form.diagnosisText} onChange={e => set("diagnosisText", e.target.value)} /></Field>
            <Field label={message("comorbidityIcd")}> <input className="input" placeholder="I10, E11" value={form.comorbidityCode} onChange={e => set("comorbidityCode", e.target.value)} /></Field>
            <Field label={message("procedureCode")}> <input className="input" value={form.procedureCode} onChange={e => set("procedureCode", e.target.value)} /></Field>
            <Field label={message("procedureContains")}> <input className="input" value={form.procedureText} onChange={e => set("procedureText", e.target.value)} /></Field>
            <Field label={message("techniqueIds")}>
              <ClinicalMultiSelect
                value={form.technique}
                options={techniqueOptions}
                onChange={value => set("technique", value)}
                emptyLabel={message("any")}
                searchLabel={message("searchOptions")}
              />
            </Field>
            <Field label={message("positionIds")}>
              <ClinicalMultiSelect
                value={form.position}
                options={positionOptions}
                onChange={value => set("position", value)}
                emptyLabel={message("any")}
                searchLabel={message("searchOptions")}
              />
            </Field>
            <Field label={message("airwayDevices")}>
              <ClinicalMultiSelect
                value={form.airway}
                options={airwayOptions}
                onChange={value => set("airway", value)}
                emptyLabel={message("any")}
                searchLabel={message("searchOptions")}
              />
            </Field>
            <Field label={message("medicationInn")}> <input className="input" value={form.medication} onChange={e => set("medication", e.target.value)} /></Field>
            <Field label={message("complicationContains")}>
              <ClinicalMultiSelect
                value={form.complication}
                options={complicationOptions}
                onChange={value => set("complication", value)}
                emptyLabel={message("any")}
                searchLabel={message("searchOptions")}
              />
            </Field>
            <Field label={message("disposition")}>
              <ClinicalMultiSelect
                value={form.disposition}
                options={dispositionOptions}
                onChange={value => set("disposition", value)}
                emptyLabel={message("any")}
                searchLabel={message("searchOptions")}
              />
            </Field>
            <Field label={message("minimumCompleteness")}> <input className="input" type="number" min="0" max="100" value={form.completeness} onChange={e => set("completeness", e.target.value)} /></Field>
          </div>
          {saveOpen && (
            <div className="toolbar" style={{ marginTop: 14 }}>
              <input className="input" style={{ maxWidth: 280 }} placeholder={message("cohortName")} value={saveName} onChange={e => setSaveName(e.target.value)} />
              <select className="select" style={{ width: 160 }} value={visibility} onChange={e => setVisibility(e.target.value as typeof visibility)}>
                <option value="PRIVATE">{message("private")}</option>
                <option value="INSTITUTION">{message("institution")}</option>
              </select>
              <button className="button primary" type="button" onClick={save} disabled={loading || !saveName.trim()}>
                <Save size={15} /> {message("saveCohort")}
              </button>
            </div>
          )}
          {saved && <div className="notice" style={{ marginTop: 12 }}>{message("saved")}: “{saved.name}”.</div>}
          {error && <div className="notice error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        {loading && <div className="loading-line" />}
      </section>

      {result && (
        <>
          <section className="grid metrics-grid">
            {result.metrics.slice(0, 8).map(item => <MetricCard key={item.id} metric={item} />)}
          </section>
          <section className="grid equal-columns">
            {result.distributions.slice(0, 4).map(item => (
              <div className="panel" key={item.id}>
                <div className="panel-header"><h3>{clinicalDisplayLabel("researchDistribution", item.id, locale)}</h3></div>
                <div className="panel-body"><DistributionChart distribution={item} /></div>
              </div>
            ))}
          </section>
          <section className="panel">
            <div className="panel-header">
              <h3>{message("matchingCases")}</h3>
              <span className="pill info">{result.matchingCases} {message("casesLabel")}</span>
            </div>
            <CasesTable cases={result.cases} />
            <div className="toolbar end" style={{ padding: 12 }}>
              <button
                className="button"
                type="button"
                disabled={result.pagination.skip === 0 || loading}
                onClick={() => run(Math.max(0, result.pagination.skip - result.pagination.take))}
              >
                {message("previous")}
              </button>
              <span className="scope-label">
                {result.pagination.skip + 1}–{Math.min(result.pagination.total, result.pagination.skip + result.pagination.take)} of {result.pagination.total}
              </span>
              <button
                className="button"
                type="button"
                disabled={!result.pagination.hasMore || loading}
                onClick={() => run(result.pagination.skip + result.pagination.take)}
              >
                {message("next")}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="field"><label>{label}</label>{children}</div>
}
