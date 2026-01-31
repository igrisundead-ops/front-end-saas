'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

interface MenuItem {
  label: string
  icon?: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const menuSections: MenuSection[] = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Overview' },
      { label: 'Analytics' },
      { label: 'Reports' },
    ],
  },
  {
    title: 'Upload Project',
    items: [
      { label: 'New Project' },
      { label: 'Import' },
      { label: 'Browse' },
    ],
  },
  {
    title: 'Machine Learning',
    items: [
      { label: 'Models' },
      { label: 'Training' },
      { label: 'Datasets' },
    ],
  },
  {
    title: 'AI Editors',
    items: [
      { label: 'Code Editor' },
      { label: 'Visual Editor' },
      { label: 'Templates' },
    ],
  },
  {
    title: 'Plugin',
    items: [
      { label: 'Extensions' },
      { label: 'Marketplace' },
      { label: 'My Plugins' },
    ],
  },
  {
    title: 'Human Editor',
    items: [
      { label: 'Team' },
      { label: 'Collaborators' },
      { label: 'Reviews' },
    ],
  },
]

export function DashboardSidebar() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Dashboard'])

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title],
    )
  }

  return (
    <aside className="w-64 bg-black/40 backdrop-blur-md border-r border-purple-500/20 flex flex-col h-screen">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-purple-500/10">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Build Systems
        </h2>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
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
                  className="w-full justify-start px-4 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-purple-500/5 rounded-md transition-colors"
                >
                  {item.label}
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
          className="w-full text-xs text-purple-400 hover:text-purple-300 hover:border-purple-400 bg-transparent"
        >
          Settings
        </Button>
      </div>
    </aside>
  )
}
