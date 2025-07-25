import * as cron from 'node-cron'
import { DateTime } from 'luxon'
import { 
  getActiveScheduledJobs, 
  updateLastRunTime, 
  createJobRun, 
  updateJobRun,
  cleanupOldJobRuns 
} from '../db/queries'
import { executeScheduledJob } from './jobRunner'
import type { ScheduledJob, ScheduleConfig } from '../db/schema'

class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map()
  private isRunning = false

  async start() {
    if (this.isRunning) return
    
    console.log('Starting scheduler service...')
    this.isRunning = true

    // Load and schedule all active jobs
    await this.loadScheduledJobs()

    // Set up cleanup task (runs daily at 2 AM)
    cron.schedule('0 2 * * *', async () => {
      try {
        const deletedCount = await cleanupOldJobRuns()
        console.log(`Cleaned up ${deletedCount} old job runs`)
      } catch (error) {
        console.error('Failed to cleanup old job runs:', error)
      }
    })

    console.log('Scheduler service started')
  }

  async stop() {
    if (!this.isRunning) return

    console.log('Stopping scheduler service...')
    
    // Stop all scheduled tasks
    for (const [jobId, task] of this.tasks) {
      task.stop()
      task.destroy()
    }
    
    this.tasks.clear()
    this.isRunning = false
    
    console.log('Scheduler service stopped')
  }

  async loadScheduledJobs() {
    try {
      const jobs = await getActiveScheduledJobs()
      
      for (const job of jobs) {
        await this.scheduleJob(job)
      }
      
      console.log(`Loaded ${jobs.length} scheduled jobs`)
    } catch (error) {
      console.error('Failed to load scheduled jobs:', error)
    }
  }

  async scheduleJob(job: ScheduledJob) {
    // Remove existing task if it exists
    this.unscheduleJob(job.id)

    try {
      const cronExpression = this.buildCronExpression(job)
      
      if (!cronExpression) {
        console.error(`Invalid schedule configuration for job ${job.id}`)
        return
      }

      const task = cron.schedule(cronExpression, async () => {
        await this.executeJob(job)
      }, {
        timezone: job.timezone || 'UTC'
      })
      this.tasks.set(job.id, task)
      
      // Update next run time
      const nextRun = this.calculateNextRun(job)
      if (nextRun) {
        await updateLastRunTime(job.id, job.lastRunAt || '', nextRun.toISO()!)
      }

      console.log(`Scheduled job ${job.name} (${job.id}) with cron: ${cronExpression}`)
    } catch (error) {
      console.error(`Failed to schedule job ${job.id}:`, error)
    }
  }

  unscheduleJob(jobId: string) {
    const task = this.tasks.get(jobId)
    if (task) {
      task.stop()
      task.destroy()
      this.tasks.delete(jobId)
      console.log(`Unscheduled job ${jobId}`)
    }
  }

  async executeJob(job: ScheduledJob) {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      console.log(`Starting scheduled execution of job ${job.name} (${job.id})`)
      
      // Check if the job still exists in the database before executing
      const activeJobs = await getActiveScheduledJobs()
      const currentJob = activeJobs.find(j => j.id === job.id)
      
      if (!currentJob) {
        console.log(`Job ${job.name} (${job.id}) no longer exists, unscheduling...`)
        this.unscheduleJob(job.id)
        return
      }
      
      // Create job run record
      const jobRun = await createJobRun({
        id: runId,
        scheduledJobId: job.id,
        runType: 'scheduled',
        status: 'running',
        startedAt: new Date().toISOString(),
      })

      const startTime = Date.now()
      
      // Execute the job
      const result = await executeScheduledJob(job)
      
      const executionTime = Date.now() - startTime
      
      // Update job run with success
      await updateJobRun(runId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        resultData: result,
        executionTimeMs: executionTime,
      })

      // Update last run time and calculate next run
      const now = new Date().toISOString()
      const nextRun = this.calculateNextRun(job)
      
      await updateLastRunTime(
        job.id, 
        now, 
        nextRun ? nextRun.toISO()! : ''
      )

      console.log(`Completed scheduled execution of job ${job.name} in ${executionTime}ms`)
      
    } catch (error) {
      console.error(`Failed to execute scheduled job ${job.name}:`, error)
      
      // Update job run with failure
      await updateJobRun(runId, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - Date.now(), // This will be 0, but we need a value
      })
    }
  }

  private buildCronExpression(job: ScheduledJob): string | null {
    const config = job.scheduleConfig as ScheduleConfig

    switch (job.scheduleType) {
      case 'interval':
        if (!config.interval || !config.unit) return null
        
        switch (config.unit) {
          case 'minutes':
            return `*/${config.interval} * * * *`
          case 'hours':
            return `0 */${config.interval} * * *`
          case 'days':
            return `0 0 */${config.interval} * *`
          default:
            return null
        }

      case 'hourly':
        return '0 * * * *' // Every hour at minute 0

      case 'daily':
        if (!config.time) return '0 0 * * *' // Default to midnight
        const [hour, minute] = config.time.split(':').map(Number)
        return `${minute} ${hour} * * *`

      case 'weekly':
        if (!config.time || !config.days) return null
        const [weeklyHour, weeklyMinute] = config.time.split(':').map(Number)
        const daysStr = config.days.join(',')
        return `${weeklyMinute} ${weeklyHour} * * ${daysStr}`

      case 'monthly':
        if (!config.time || !config.date) return null
        const [monthlyHour, monthlyMinute] = config.time.split(':').map(Number)
        return `${monthlyMinute} ${monthlyHour} ${config.date} * *`

      default:
        return null
    }
  }

  private calculateNextRun(job: ScheduledJob): DateTime | null {
    const config = job.scheduleConfig as ScheduleConfig
    const now = DateTime.now().setZone(job.timezone || 'UTC')

    switch (job.scheduleType) {
      case 'interval':
        if (!config.interval || !config.unit) return null
        
        switch (config.unit) {
          case 'minutes':
            return now.plus({ minutes: config.interval })
          case 'hours':
            return now.plus({ hours: config.interval })
          case 'days':
            return now.plus({ days: config.interval })
          default:
            return null
        }

      case 'hourly':
        return now.plus({ hours: 1 }).startOf('hour')

      case 'daily':
        if (!config.time) return now.plus({ days: 1 }).startOf('day')
        const [hour, minute] = config.time.split(':').map(Number)
        let nextDaily = now.set({ hour, minute, second: 0, millisecond: 0 })
        if (nextDaily <= now) {
          nextDaily = nextDaily.plus({ days: 1 })
        }
        return nextDaily

      case 'weekly':
        if (!config.time || !config.days) return null
        const [weeklyHour, weeklyMinute] = config.time.split(':').map(Number)
        
        // Find the next occurrence of any of the specified days
        let nextWeekly = now.set({ hour: weeklyHour, minute: weeklyMinute, second: 0, millisecond: 0 })
        
        for (let i = 0; i < 7; i++) {
          const checkDay = nextWeekly.plus({ days: i })
          if (config.days.includes(checkDay.weekday % 7) && checkDay > now) {
            return checkDay
          }
        }
        
        return null

      case 'monthly':
        if (!config.time || !config.date) return null
        const [monthlyHour, monthlyMinute] = config.time.split(':').map(Number)
        let nextMonthly = now.set({ 
          day: config.date, 
          hour: monthlyHour, 
          minute: monthlyMinute, 
          second: 0, 
          millisecond: 0 
        })
        
        if (nextMonthly <= now) {
          nextMonthly = nextMonthly.plus({ months: 1 })
        }
        
        return nextMonthly

      default:
        return null
    }
  }

  // Manual job execution
  async executeJobManually(jobId: string): Promise<void> {
    const jobs = await getActiveScheduledJobs()
    const job = jobs.find(j => j.id === jobId)
    
    if (!job) {
      throw new Error(`Scheduled job ${jobId} not found`)
    }

    const runId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      console.log(`Starting manual execution of job ${job.name} (${job.id})`)
      
      // Create job run record
      await createJobRun({
        id: runId,
        scheduledJobId: job.id,
        runType: 'manual',
        status: 'running',
        startedAt: new Date().toISOString(),
      })

      const startTime = Date.now()
      
      // Execute the job
      const result = await executeScheduledJob(job)
      
      const executionTime = Date.now() - startTime
      
      // Update job run with success
      await updateJobRun(runId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        resultData: result,
        executionTimeMs: executionTime,
      })

      // Update last run time for manual execution
      const now = new Date().toISOString()
      const nextRun = this.calculateNextRun(job)
      
      await updateLastRunTime(
        job.id, 
        now, 
        nextRun ? nextRun.toISO()! : job.nextRunAt || ''
      )

      console.log(`Completed manual execution of job ${job.name} in ${executionTime}ms`)
      
    } catch (error) {
      console.error(`Failed to execute job ${job.name} manually:`, error)
      
      // Update job run with failure
      await updateJobRun(runId, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      
      throw error
    }
  }

  async reload() {
    console.log('Reloading scheduler...')
    
    // Stop all current tasks
    for (const [jobId, task] of this.tasks) {
      task.stop()
      task.destroy()
    }
    this.tasks.clear()
    
    // Reload jobs from database
    await this.loadScheduledJobs()
    
    console.log('Scheduler reloaded successfully')
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledJobsCount: this.tasks.size,
      scheduledJobs: Array.from(this.tasks.keys()),
    }
  }
}

// Export singleton instance
export const scheduler = new SchedulerService()
