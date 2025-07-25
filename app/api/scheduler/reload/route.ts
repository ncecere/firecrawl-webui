import { NextRequest, NextResponse } from 'next/server'
import { scheduler } from '@/lib/scheduler/scheduler'

export async function POST(request: NextRequest) {
  try {
    await scheduler.reload()
    
    return NextResponse.json({
      success: true,
      message: 'Scheduler reloaded successfully'
    })
  } catch (error) {
    console.error('Failed to reload scheduler:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reload scheduler'
    }, { status: 500 })
  }
}
