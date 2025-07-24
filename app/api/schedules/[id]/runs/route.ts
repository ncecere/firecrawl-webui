import { NextRequest, NextResponse } from 'next/server'
import { getJobRuns } from '@/lib/db/queries'
import { initializeDatabase } from '@/lib/db/connection'

// Initialize database on first request
let dbInitialized = false

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

// GET /api/schedules/[id]/runs - Get job run history for a scheduled job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized()
    
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const runs = await getJobRuns(id, limit)
    
    return NextResponse.json({ success: true, runs })
  } catch (error) {
    console.error('Failed to get job runs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get job runs' },
      { status: 500 }
    )
  }
}
