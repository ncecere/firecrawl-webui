import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/connection'
import { scheduler } from '@/lib/scheduler/scheduler'

// Initialize database on first request
let dbInitialized = false

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

// POST /api/schedules/[id]/run - Manually trigger a scheduled job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized()
    
    const { id } = await params
    
    // Execute the job manually
    await scheduler.executeJobManually(id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Job execution started successfully' 
    })
  } catch (error) {
    console.error('Failed to execute job manually:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
