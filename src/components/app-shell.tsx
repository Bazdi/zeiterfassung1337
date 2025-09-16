"use client"

import { ReactNode } from "react"
import AppHeader from "@/components/app-header"
import MobileTabbar from "@/components/mobile-tabbar"
import { cn } from "@/lib/utils"

interface AppShellProps {
  title: string
  heading?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  /**
   * Override the max-width container class. Defaults to `max-w-7xl`.
   */
  maxWidthClassName?: string
  /**
   * Additional classes for the main content container.
   */
  contentClassName?: string
  /**
   * When true, the heading block is hidden. Handy for full-bleed layouts.
   */
  hideHeading?: boolean
}

export function AppShell({
  title,
  heading,
  description,
  actions,
  children,
  maxWidthClassName = "max-w-7xl",
  contentClassName,
  hideHeading = false
}: AppShellProps) {
  const pageHeading = heading ?? title

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title={title} />

      <main
        className={cn(
          "mx-auto w-full px-4 pb-[env(safe-area-inset-bottom)] pb-24 pt-6 sm:px-6 lg:px-8",
          maxWidthClassName,
          contentClassName
        )}
      >
        {!hideHeading && (
          <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {pageHeading}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center gap-2">
                {actions}
              </div>
            ) : null}
          </header>
        )}

        <div className="space-y-6">{children}</div>
      </main>

      <MobileTabbar />
    </div>
  )
}

