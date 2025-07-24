import { NextRequest, NextResponse } from 'next/server'
import { 
  getScheduledJob, 
  updateScheduledJob, 
  deleteScheduledJob 
} from '@/lib/db/queries'
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

// GET /api/schedules/[id] - Get a specific scheduled job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized()
    
    const { id } = await params
    const job = await getScheduledJob(id)
    
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Scheduled job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: job })
  } catch (error) {
    console.error('Failed to get scheduled job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get scheduled job' },
      { status: 500 }
    )
  }
}

// PUT /api/schedules/[id] - Update a scheduled job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized()
    
    const { id } = await params
    const body = await request.json()
    const updates = { ...body, updatedAt: new Date().toISOString() }

    const updatedJob = await updateScheduledJob(id, updates)
    
    if (!updatedJob) {
      return NextResponse.json(
        { success: false, error: 'Scheduled job not found' },
        { status: 404 }
      )
    }

    // Reschedule the job if it's active
    if (updatedJob.isActive) {
      await scheduler.scheduleJob(updatedJob)
    } else {
      scheduler.unscheduleJob(updatedJob.id)
    }

    return NextResponse.json({ success: true, data: updatedJob })
  } catch (error) {
    console.error('Failed to update scheduled job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update scheduled job' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedules/[id] - Delete a scheduled job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized()
    
    const { id } = await params
    
    // Check if job exists
    const job = await getScheduledJob(id)
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Scheduled job not found' },
        { status: 404 }
      )
    }

    // Unschedule the job
    scheduler.unscheduleJob(id)

    // Delete from database
    await deleteScheduledJob(id)

    return NextResponse.json({ success: true, message: 'Scheduled job deleted' })
  } catch (error) {
    console.error('Failed to delete scheduled job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete scheduled job' },
      { status: 500 }
    )
  }
}
