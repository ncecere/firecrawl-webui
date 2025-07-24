import { NextResponse } from 'next/server'
import { scheduler } from '@/lib/scheduler/scheduler'
import { initializeDatabase } from '@/lib/db/connection'
import { getJobRunStats } from '@/lib/db/queries'

// Initialize database on first request
let dbInitialized = false

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

// GET /api/scheduler/status - Get scheduler status and statistics
export async function GET() {
  try {
    await ensureDbInitialized()
    
    const schedulerStatus = scheduler.getStatus()
    const jobStats = await getJobRunStats()
    
    return NextResponse.json({ 
      success: true, 
      data: {
        scheduler: schedulerStatus,
        stats: jobStats
      }
    })
  } catch (error) {
    console.error('Failed to get scheduler status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get scheduler status' },
      { status: 500 }
    )
  }
}

// POST /api/scheduler/status - Start or stop the scheduler
export async function POST(request: Request) {
  try {
    await ensureDbInitialized()
    
    const { action } = await request.json()
    
    if (action === 'start') {
      await scheduler.start()
      return NextResponse.json({ 
        success: true, 
        message: 'Scheduler started successfully' 
      })
    } else if (action === 'stop') {
      await scheduler.stop()
      return NextResponse.json({ 
        success: true, 
        message: 'Scheduler stopped successfully' 
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Failed to control scheduler:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to control scheduler' },
      { status: 500 }
    )
  }
}
