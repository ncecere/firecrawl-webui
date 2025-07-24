import { eq, desc, and, gte, lt } from 'drizzle-orm'
import { db } from './connection'
import { scheduledJobs, jobRuns, type ScheduledJob, type NewScheduledJob, type JobRun, type NewJobRun } from './schema'
import { DateTime } from 'luxon'

// Scheduled Jobs queries
export async function createScheduledJob(job: NewScheduledJob): Promise<ScheduledJob> {
  const [created] = await db.insert(scheduledJobs).values(job).returning()
  if (!created) throw new Error('Failed to create scheduled job')
  return created
}

export async function getScheduledJobs(): Promise<ScheduledJob[]> {
  return await db.select().from(scheduledJobs).orderBy(desc(scheduledJobs.createdAt))
}

export async function getScheduledJob(id: string): Promise<ScheduledJob | undefined> {
  const [job] = await db.select().from(scheduledJobs).where(eq(scheduledJobs.id, id))
  return job
}

export async function getActiveScheduledJobs(): Promise<ScheduledJob[]> {
  return await db.select().from(scheduledJobs).where(eq(scheduledJobs.isActive, true))
}

export async function updateScheduledJob(id: string, updates: Partial<NewScheduledJob>): Promise<ScheduledJob | undefined> {
  const [updated] = await db
    .update(scheduledJobs)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(scheduledJobs.id, id))
    .returning()
  return updated
}

export async function deleteScheduledJob(id: string): Promise<void> {
  await db.delete(scheduledJobs).where(eq(scheduledJobs.id, id))
}

export async function updateLastRunTime(id: string, lastRunAt: string, nextRunAt: string): Promise<void> {
  await db
    .update(scheduledJobs)
    .set({ lastRunAt, nextRunAt, updatedAt: new Date().toISOString() })
    .where(eq(scheduledJobs.id, id))
}

// Job Runs queries
export async function createJobRun(run: NewJobRun): Promise<JobRun> {
  const [created] = await db.insert(jobRuns).values(run).returning()
  if (!created) throw new Error('Failed to create job run')
  return created
}

export async function getJobRuns(scheduledJobId: string, limit = 50): Promise<JobRun[]> {
  return await db
    .select()
    .from(jobRuns)
    .where(eq(jobRuns.scheduledJobId, scheduledJobId))
    .orderBy(desc(jobRuns.startedAt))
    .limit(limit)
}

export async function getJobRun(id: string): Promise<JobRun | undefined> {
  const [run] = await db.select().from(jobRuns).where(eq(jobRuns.id, id))
  return run
}

export async function updateJobRun(id: string, updates: Partial<NewJobRun>): Promise<JobRun | undefined> {
  const [updated] = await db
    .update(jobRuns)
    .set(updates)
    .where(eq(jobRuns.id, id))
    .returning()
  return updated
}

export async function getRunningJobs(): Promise<JobRun[]> {
  return await db.select().from(jobRuns).where(eq(jobRuns.status, 'running'))
}

// Cleanup old job runs (older than 30 days)
export async function cleanupOldJobRuns(): Promise<number> {
  const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toISO()
  
  const result = await db
    .delete(jobRuns)
    .where(lt(jobRuns.createdAt, thirtyDaysAgo))
    .returning({ id: jobRuns.id })
  
  return result.length
}

// Get job statistics
export async function getJobRunStats(scheduledJobId?: string) {
  const runs = scheduledJobId 
    ? await db.select().from(jobRuns).where(eq(jobRuns.scheduledJobId, scheduledJobId))
    : await db.select().from(jobRuns)
  
  const stats = {
    total: runs.length,
    pending: runs.filter(r => r.status === 'pending').length,
    running: runs.filter(r => r.status === 'running').length,
    completed: runs.filter(r => r.status === 'completed').length,
    failed: runs.filter(r => r.status === 'failed').length,
  }
  
  return stats
}

// Get recent job runs across all scheduled jobs
export async function getRecentJobRuns(limit = 20): Promise<(JobRun & { scheduledJob: ScheduledJob })[]> {
  const runs = await db
    .select({
      run: jobRuns,
      scheduledJob: scheduledJobs,
    })
    .from(jobRuns)
    .innerJoin(scheduledJobs, eq(jobRuns.scheduledJobId, scheduledJobs.id))
    .orderBy(desc(jobRuns.startedAt))
    .limit(limit)
  
  return runs.map(r => ({ ...r.run, scheduledJob: r.scheduledJob }))
}
