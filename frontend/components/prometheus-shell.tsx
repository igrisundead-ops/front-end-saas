'use client'

import type { LucideIcon } from 'lucide-react'
import { BadgeDollarSign, Home, LayoutTemplate, LibraryBig, FolderKanban } from 'lucide-react'

import IsoLevelWarp from '@/components/ui/isometric-wave-grid-background'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { NavBar } from '@/components/ui/tubelight-navbar'

export interface PrometheusShellProps {
  children: React.ReactNode
  header?: React.ReactNode
}

export function PrometheusShell({ children, header }: PrometheusShellProps) {
  const navItems: Array<{ name: string; url: string; icon: LucideIcon }> = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Projects', url: '/projects', icon: FolderKanban },
    { name: 'Templates', url: '/templates', icon: LayoutTemplate },
    { name: 'Assets', url: '/assets', icon: LibraryBig },
    { name: 'Billing', url: '/billing', icon: BadgeDollarSign },
  ]

  const currentDensity = 20

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans flex">
      <IsoLevelWarp color="100, 50, 250" density={currentDensity} speed={1.5} />

      <NavBar items={navItems} />

      <DashboardSidebar />

      <div className="relative z-10 flex-1 h-screen overflow-hidden flex flex-col">
        <div className="h-24" />
        {header}
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">{children}</main>
      </div>
    </div>
  )
}
