import { NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/connection'
import { scheduler } from '@/lib/scheduler/scheduler'
import { getScheduledJobs } from '@/lib/db/queries'

// This endpoint initializes the scheduler on app startup
export async function POST() {
  try {
    console.log('🚀 Initializing Firecrawl WebUI...')
    
    // Initialize database
    await initializeDatabase()
    console.log('✅ Database initialized')
    
    // Start the scheduler
    await scheduler.start()
    console.log('✅ Scheduler started')
    
    // Load and schedule all active jobs
    const jobs = await getScheduledJobs()
    const activeJobs = jobs.filter(job => job.isActive)
    
    console.log(`📋 Found ${activeJobs.length} active scheduled jobs`)
    
    for (const job of activeJobs) {
      try {
        await scheduler.scheduleJob(job)
        console.log(`✅ Scheduled job: ${job.name} (${job.id})`)
      } catch (error) {
        console.error(`❌ Failed to schedule job ${job.name}:`, error)
      }
    }
    
    console.log('🎉 Firecrawl WebUI initialization complete!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Scheduler initialized successfully',
      activeJobs: activeJobs.length
    })
  } catch (error) {
    console.error('❌ Failed to initialize scheduler:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize scheduler' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  try {
    const status = scheduler.getStatus()
    
    return NextResponse.json({
      success: true,
      scheduler: status
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get scheduler status' },
      { status: 500 }
    )
  }
}
