import { describe, expect, it } from "vitest"
import type { ResearchExportRecord, ResearchPermissionSet } from "@lospor/core/research"
import {
  canDownloadResearchExport,
  canOfferOmopExport,
  canViewResearchNavigation,
  researchExportsNeedPolling,
} from "./research-ui-policy"

const permissions: ResearchPermissionSet = {
  query: true,
  inspectCases: false,
  compare: true,
  benchmark: true,
  savePrivateCohorts: true,
  shareInstitutionCohorts: false,
  export: false,
  exportOmop: false,
  manageAccess: false,
}

function exportRecord(overrides: Partial<ResearchExportRecord> = {}): ResearchExportRecord {
  return {
    id: "export-1",
    name: "Export",
    format: "csv",
    status: "PENDING",
    definition: { version: 1, filters: { statuses: ["COMPLETE"] } },
    rowCount: null,
    checksum: null,
    error: null,
    asOf: null,
    definitionHash: null,
    snapshotHash: null,
    matchingCases: null,
    sourceCommit: null,
    filename: null,
    contentType: null,
    byteSize: null,
    sourceVersion: "7.2.0",
    generatedAt: null,
    legacy: false,
    createdAt: "2026-07-27T00:00:00.000Z",
    completedAt: null,
    ...overrides,
  }
}

describe("research Browser policy", () => {
  it("hides case and export navigation outside their individual grants", () => {
    expect(canViewResearchNavigation(permissions, null)).toBe(true)
    expect(canViewResearchNavigation(permissions, "inspectCases")).toBe(false)
    expect(canViewResearchNavigation(permissions, "export")).toBe(false)
    expect(canViewResearchNavigation({ ...permissions, inspectCases: true }, "inspectCases")).toBe(true)
  })

  it("offers OMOP only when both export permissions are present", () => {
    expect(canOfferOmopExport({ ...permissions, exportOmop: true })).toBe(false)
    expect(canOfferOmopExport({ ...permissions, export: true, exportOmop: true })).toBe(true)
  })

  it("polls active jobs and downloads only complete nonlegacy artifacts", () => {
    expect(researchExportsNeedPolling([exportRecord()])).toBe(true)
    expect(researchExportsNeedPolling([exportRecord({ status: "RUNNING" })])).toBe(true)
    expect(researchExportsNeedPolling([exportRecord({ status: "COMPLETE" })])).toBe(false)
    expect(canDownloadResearchExport(exportRecord({ status: "COMPLETE" }))).toBe(true)
    expect(canDownloadResearchExport(exportRecord({ status: "FAILED" }))).toBe(false)
    expect(canDownloadResearchExport(exportRecord({ status: "COMPLETE", legacy: true }))).toBe(false)
  })
})
