import { ExportWorkspace } from "@/components/export-workspace"
import { PageHeading } from "@/components/page-heading"

export default function ExportsPage() {
  return (
    <>
      <PageHeading
        title="Governed exports"
        titleBg="Управлявани експорти"
        description="Create complete pseudonymous research files and retain a verifiable export history."
        descriptionBg="Създавайте пълни псевдонимизирани файлове и проверима история."
      />
      <ExportWorkspace />
    </>
  )
}
