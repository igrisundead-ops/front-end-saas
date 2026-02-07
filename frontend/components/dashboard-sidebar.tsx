'use client'

import type React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BadgeDollarSign,
  ChevronDown,
  Film,
  FolderKanban,
  LayoutDashboard,
  LibraryBig,
  Settings,
  Sparkles,
  Subtitles,
  Users,
  Wand2,
} from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MenuItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const menuSections: MenuSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Overview', href: '/', icon: LayoutDashboard },
      { label: 'Projects', href: '/projects', icon: FolderKanban },
      { label: 'Editor', href: '/editor', icon: Wand2 },
      { label: 'Exports', href: '/exports', icon: Film },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Captions Studio', href: '/captions', icon: Subtitles },
      { label: 'Auto Highlights', href: '/highlights', icon: Sparkles },
      { label: 'B-roll Finder', href: '/broll', icon: Film },
    ],
  },
  {
    title: 'Library',
    items: [
      { label: 'Templates', href: '/templates', icon: LibraryBig },
      { label: 'Assets', href: '/assets', icon: LibraryBig },
      { label: 'Brand Kit', href: '/brand-kit', icon: Wand2 },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Usage & Billing', href: '/billing', icon: BadgeDollarSign },
      { label: 'Team', href: '/team', icon: Users },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'Workspace',
    'Intelligence',
    'Library',
    'Business',
  ])

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title],
    )
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside className="w-64 bg-black/40 backdrop-blur-md border-r border-purple-500/20 flex flex-col h-screen">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-purple-500/10">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          PROMETHEUS
        </h2>
        <p className="mt-2 text-xs text-gray-400/80">
          Iman-grade edits, structured.
        </p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-hidden p-4 space-y-2">
        {menuSections.map((section) => (
          <Collapsible
            key={section.title}
            open={expandedSections.includes(section.title)}
            onOpenChange={() => toggleSection(section.title)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-purple-500/10 rounded-md transition-colors"
              >
                {section.title}
                <ChevronDown className="h-4 w-4 transition-transform" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1 pl-4">
              {section.items.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  asChild
                  className={cn(
                    'w-full justify-start px-4 py-1.5 text-xs rounded-md transition-colors',
                    isActive(item.href)
                      ? 'text-white bg-purple-500/10 hover:bg-purple-500/15'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-purple-500/5',
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5 opacity-80" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-purple-500/10">
        <Button
          variant="outline"
          asChild
          className="w-full text-xs text-purple-300 hover:text-purple-200 hover:border-purple-300 bg-transparent border-purple-500/30"
        >
          <Link href="/billing">Upgrade</Link>
        </Button>
      </div>
    </aside>
  )
}
