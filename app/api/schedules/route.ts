import { NextRequest, NextResponse } from 'next/server'
import { 
  createScheduledJob, 
  getScheduledJobs, 
  updateScheduledJob, 
  deleteScheduledJob 
} from '@/lib/db/queries'
import { initializeDatabase } from '@/lib/db/connection'
import { scheduler } from '@/lib/scheduler/scheduler'
import type { NewScheduledJob } from '@/lib/db/schema'

// Initialize database on first request
let dbInitialized = false

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

// GET /api/schedules - List all scheduled jobs
export async function GET() {
  try {
    await ensureDbInitialized()
    
    const jobs = await getScheduledJobs()
    return NextResponse.json({ success: true, schedules: jobs })
  } catch (error) {
    console.error('Failed to get scheduled jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get scheduled jobs' },
      { status: 500 }
    )
  }
}

// POST /api/schedules - Create a new scheduled job
export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized()
    
    const body = await request.json()
    const {
      name,
      jobType,
      jobConfig,
      url,
      urls,
      apiEndpoint,
      scheduleType,
      scheduleConfig,
      timezone = 'UTC',
      isActive = true
    } = body

    // Validate required fields
    if (!name || !jobType || !jobConfig || !scheduleType || !scheduleConfig || !apiEndpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate job type specific fields
    if ((jobType === 'scrape' || jobType === 'crawl' || jobType === 'map') && !url) {
      return NextResponse.json(
        { success: false, error: 'URL is required for this job type' },
        { status: 400 }
      )
    }

    if (jobType === 'batch' && (!urls || !Array.isArray(urls) || urls.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'URLs array is required for batch jobs' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const id = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Calculate next run time
    const now = new Date().toISOString()
    const nextRunAt = calculateNextRun(scheduleType, scheduleConfig, timezone)

    const newJob: NewScheduledJob = {
      id,
      name,
      jobType,
      jobConfig,
      url: url || null,
      urls: urls || null,
      apiEndpoint,
      scheduleType,
      scheduleConfig,
      timezone,
      isActive,
      createdAt: now,
      updatedAt: now,
      lastRunAt: null,
      nextRunAt,
    }

    const createdJob = await createScheduledJob(newJob)

    // Schedule the job if it's active
    if (isActive) {
      await scheduler.scheduleJob(createdJob)
    }

    return NextResponse.json({ success: true, data: createdJob })
  } catch (error) {
    console.error('Failed to create scheduled job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create scheduled job' },
      { status: 500 }
    )
  }
}

// Helper function to calculate next run time
function calculateNextRun(scheduleType: string, scheduleConfig: any, timezone: string): string {
  const now = new Date()
  
  // This is a simplified calculation - the scheduler will handle the precise timing
  switch (scheduleType) {
    case 'interval':
      const { interval, unit } = scheduleConfig
      if (unit === 'minutes') {
        return new Date(now.getTime() + interval * 60 * 1000).toISOString()
      } else if (unit === 'hours') {
        return new Date(now.getTime() + interval * 60 * 60 * 1000).toISOString()
      } else if (unit === 'days') {
        return new Date(now.getTime() + interval * 24 * 60 * 60 * 1000).toISOString()
      }
      break
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
  
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString() // Default to 1 hour
}
