import { describe, expect, it } from "vitest"
import { buildCohort } from "./cohort-builder"

describe("cohort builder", () => {
  it("maps visible fields to the shared structured research contract", () => {
    const cohort = buildCohort({
      from: "2026-01-01",
      to: "2026-06-30",
      ageMin: "40",
      ageMax: "75",
      bmiMin: "",
      bmiMax: "",
      sex: "MALE",
      asa: "II, III",
      emergency: "false",
      diagnosisCode: "C61, I10",
      diagnosisText: "",
      comorbidityCode: "E11",
      procedureCode: "PROC-1",
      procedureText: "",
      technique: "GENERAL_BALANCED",
      position: "SUPINE",
      airway: "ORAL_ETT",
      medication: "propofol",
      complication: "",
      disposition: "WARD",
      completeness: "90",
    })

    expect(cohort).toEqual({
      version: 1,
      filters: expect.objectContaining({
        statuses: ["COMPLETE"],
        finalized: { from: "2026-01-01", to: "2026-06-30" },
        ageYears: { min: 40, max: 75 },
        sex: ["MALE"],
        asa: ["II", "III"],
        emergency: false,
        diagnosisCodes: ["C61", "I10"],
        comorbidityCodes: ["E11"],
        techniques: ["GENERAL_BALANCED"],
        dispositions: ["WARD"],
        minimumCompleteness: 90,
      }),
    })
  })

  it("does not emit empty optional filters", () => {
    const cohort = buildCohort({
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
    })
    expect(cohort).toEqual({ version: 1, filters: { statuses: ["COMPLETE"] } })
  })
})
