'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

import { PrometheusShell } from '@/components/prometheus-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function EditorLandingPage() {
  const router = useRouter()
  return (
    <PrometheusShell
      header={
        <PageHeader
          title="Editor"
          description="Pick a project to open. The editor route is project-based."
          actions={
            <Button
              onClick={() => router.push('/projects')}
              className="bg-white text-black hover:bg-white/90"
            >
              Browse Projects <ArrowRight className="size-4" />
            </Button>
          }
        />
      }
    >
      <div className="px-8 py-6">
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <div className="text-sm text-white/70">Open a project to start editing.</div>
            <div className="mt-2 text-xs text-white/45">
              The editor loads mock scenes, transcript, and highlights from the processing pipeline.
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Overview
              </Button>
              <Button
                onClick={() => router.push('/projects')}
                className="bg-white text-black hover:bg-white/90"
              >
                Browse Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PrometheusShell>
  )
}

