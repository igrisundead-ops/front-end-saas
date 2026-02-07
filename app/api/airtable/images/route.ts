import { NextResponse } from 'next/server'
import { getAirtableEnv } from '@/app/api/airtable/_utils'
import { fetchImageArchiveRecords } from '@/lib/server/airtable-client'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const envResult = getAirtableEnv()
  if (!envResult.ok) {
    // Gracefully return empty items when Airtable is not configured
    return NextResponse.json(
      { ok: true, items: [], configured: false, missing: envResult.missing },
      { status: 200 }
    )
  }

  const { token, baseId, tableId } = envResult.env
  const { searchParams } = new URL(req.url)

  const parsedLimit = Number(searchParams.get('limit') ?? '50')
  const limit = Math.max(1, Math.min(200, Number.isFinite(parsedLimit) ? parsedLimit : 50))
  const view = searchParams.get('view') || undefined

  try {
    const result = await fetchImageArchiveRecords({
      token,
      baseId,
      table: tableId,
      view,
      limit,
    })

    return NextResponse.json(
      { ok: true, items: result.items, count: result.count },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = (err as { status?: number })?.status ?? 500
    console.error('[Airtable] images fetch failed', { baseId, tableId, error: message })

    return NextResponse.json(
      { ok: false, where: 'airtable', error: message },
      { status }
    )
  }
}
