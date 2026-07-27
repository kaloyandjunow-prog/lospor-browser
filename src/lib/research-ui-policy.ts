import type { ResearchExportRecord, ResearchPermissionSet } from "@lospor/core/research"

export type ResearchNavigationPermission = "inspectCases" | "export" | null

export function canViewResearchNavigation(
  permissions: ResearchPermissionSet,
  required: ResearchNavigationPermission,
): boolean {
  return required === null || permissions[required]
}

export function researchExportsNeedPolling(records: ResearchExportRecord[]): boolean {
  return records.some(record => record.status === "PENDING" || record.status === "RUNNING")
}

export function canDownloadResearchExport(record: ResearchExportRecord): boolean {
  return record.status === "COMPLETE" && !record.legacy
}

export function canOfferOmopExport(permissions: ResearchPermissionSet): boolean {
  return permissions.export && permissions.exportOmop
}
