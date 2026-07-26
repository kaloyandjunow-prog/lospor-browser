"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"
import {
  BarChart3,
  Database,
  FileDown,
  Files,
  GitCompareArrows,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
} from "lucide-react"
import { clinicalDisplayLabel } from "@lospor/core/display"
import type { ResearchMetadata } from "@lospor/core/research"
import type { SessionUser } from "@/lib/api"
import { LanguageButton, useLocale } from "./locale-provider"
import { formatResearchScope } from "@/lib/research-scope"

const items = [
  { href: "/overview", key: "overview", icon: LayoutDashboard },
  { href: "/cohorts", key: "cohorts", icon: SlidersHorizontal },
  { href: "/compare", key: "compare", icon: GitCompareArrows },
  { href: "/cases", key: "cases", icon: Files },
  { href: "/quality", key: "quality", icon: ShieldCheck },
  { href: "/benchmarks", key: "benchmarks", icon: BarChart3 },
  { href: "/exports", key: "exports", icon: FileDown },
] as const

export function WorkspaceShell({
  user,
  metadata,
  children,
}: {
  user: SessionUser
  metadata: ResearchMetadata
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale, message } = useLocale()
  const active = [...items, { href: "/governance", key: "governance" as const, icon: Database }]
    .find(item => pathname.startsWith(item.href))
  const scopeLabel = formatResearchScope(metadata.scope, message("allInstitutions"))
  const scopeTitle = metadata.scope.institutionLabels.join(", ")

  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link href="/overview" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="" />
          <span>
            <strong>{message("brand")}</strong>
            <small>{message("researchWorkspace")}</small>
          </span>
        </Link>
        <nav className="side-nav" aria-label="Research navigation">
          {items.map(item => {
            const Icon = item.icon
            const selected = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${selected ? " active" : ""}`}
              >
                <Icon aria-hidden="true" />
                <span>{message(item.key)}</span>
              </Link>
            )
          })}
          {metadata.permissions.manageAccess && (
            <Link
              href="/governance"
              className={`nav-link${pathname.startsWith("/governance") ? " active" : ""}`}
            >
              <Stethoscope aria-hidden="true" />
              <span>{message("governance")}</span>
            </Link>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="account-name">{user.name}</div>
          <div className="account-meta">
            {user.institutionName ?? clinicalDisplayLabel("userRole", user.role, locale)}
          </div>
          <div className="side-actions">
            <LanguageButton />
            <button
              type="button"
              className="icon-button"
              title={message("signOut")}
              onClick={async () => {
                await fetch("/api/auth/session", { method: "DELETE" }).catch(() => null)
                router.replace("/login")
                router.refresh()
              }}
            >
              <LogOut aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <h1>{active ? message(active.key) : message("brand")}</h1>
          <div className="scope-label topbar-scope" title={scopeTitle}>
            {message("scope")}: {scopeLabel}
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
