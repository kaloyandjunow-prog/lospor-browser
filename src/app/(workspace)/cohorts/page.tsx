import { CohortBuilder } from "@/components/cohort-builder"
import { PageHeading } from "@/components/page-heading"
import { SavedCohorts } from "@/components/saved-cohorts"

export default function CohortsPage() {
  return (
    <>
      <PageHeading
        title="Cohort builder"
        titleBg="Създаване на кохорта"
        description="Combine controlled clinical filters. Queries are read-only and restricted to your authorized scope."
        descriptionBg="Комбинирайте контролирани клинични филтри. Заявките са само за четене и в разрешения обхват."
      />
      <CohortBuilder />
      <SavedCohorts />
    </>
  )
}
