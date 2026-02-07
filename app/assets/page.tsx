'use client'

import * as React from 'react'
import { Music, Upload, Video } from 'lucide-react'

import { PrometheusShell } from '@/components/prometheus-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { FileUpload } from '@/components/ui/file-upload'
import { Badge } from '@/components/ui/badge'
import { readLocalStorageJSON, writeLocalStorageJSON } from '@/lib/storage'
import type { AssetItem, AssetKind } from '@/lib/types'

const ASSETS_KEY = 'prometheus.assets.v1'

function loadAssets() {
  return readLocalStorageJSON<AssetItem[]>(ASSETS_KEY) ?? []
}

function saveAssets(items: AssetItem[]) {
  writeLocalStorageJSON(ASSETS_KEY, items)
}

function kindFromTab(tab: string): AssetKind {
  if (tab === 'uploads') return 'upload'
  if (tab === 'music') return 'music'
  if (tab === 'broll') return 'broll'
  if (tab === 'fonts') return 'font'
  return 'logo'
}

export default function AssetsPage() {
  const [tab, setTab] = React.useState('uploads')
  const [open, setOpen] = React.useState(false)
  const [assets, setAssets] = React.useState<AssetItem[]>([])

  React.useEffect(() => {
    setAssets(loadAssets())
  }, [])

  const filtered = assets.filter((a) => a.kind === kindFromTab(tab))

  return (
    <PrometheusShell
      header={
        <PageHeader
          title="Assets"
          description="Uploads, b-roll, music, and brand-ready files."
          actions={
            <Button
              onClick={() => setOpen(true)}
              className="bg-white text-black hover:bg-white/90"
            >
              <Upload className="size-4" />
              Upload
            </Button>
          }
        />
      }
    >
      <div className="px-8 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="broll">B-roll</TabsTrigger>
            <TabsTrigger value="fonts">Fonts</TabsTrigger>
            <TabsTrigger value="logos">Logos</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-6">
            {filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <div className="text-sm text-white/70">Nothing here yet.</div>
                  <div className="mt-2 text-xs text-white/45">
                    Add assets once, reuse across every project.
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Button variant="outline" onClick={() => setOpen(true)}>
                      Upload files
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white/90">
                            {a.name}
                          </div>
                          <div className="mt-1 text-xs text-white/45">
                            {new Date(a.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="secondary">{a.kind}</Badge>
                      </div>
                      <div className="h-28 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-purple-500/10 flex items-center justify-center">
                        {a.kind === 'music' ? (
                          <Music className="size-5 text-white/50" />
                        ) : (
                          <Video className="size-5 text-white/50" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Assets</DialogTitle>
            <DialogDescription>
              UI-only mock upload. Files are tracked in localStorage.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <FileUpload
              onChange={(files) => {
                if (files.length === 0) return
                const kind = kindFromTab(tab)
                const next: AssetItem[] = [
                  ...files.map((f) => ({
                    id: `${kind}_${f.name}_${Date.now()}`,
                    kind,
                    name: f.name,
                    createdAt: new Date().toISOString(),
                    sizeBytes: f.size,
                  })),
                  ...assets,
                ]
                setAssets(next)
                saveAssets(next)
                setOpen(false)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </PrometheusShell>
  )
}

