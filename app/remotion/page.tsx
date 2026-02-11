import { Suspense } from 'react'
import { RemotionPlayerPageClient } from '@/components/remotion/remotion-player-page-client'

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-xl border border-white/15 bg-neutral-950 p-8 text-sm text-white/70">
          Loading Remotion preview...
        </div>
      </div>
    </main>
  )
}

export default function RemotionPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RemotionPlayerPageClient />
    </Suspense>
  )
}
