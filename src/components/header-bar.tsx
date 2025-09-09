"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export type HeaderLink = { href: string; label: string; prefetch?: boolean }

export function HeaderBar({ title, links }: { title: string; links: HeaderLink[] }) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {links.map((l) => (
              <Button key={l.href + l.label} asChild variant="outline" size="sm" className="h-11 px-5 sm:h-9 sm:px-4">
                <Link href={l.href} prefetch={l.prefetch ?? false}>{l.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}

