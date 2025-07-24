import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Scheduled jobs table
export const scheduledJobs = sqliteTable('scheduled_jobs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  jobType: text('job_type').notNull(), // 'scrape' | 'crawl' | 'map' | 'batch'
  jobConfig: text('job_config', { mode: 'json' }).notNull(), // JobConfig as JSON
  url: text('url'), // For single URL jobs (scrape, crawl, map)
  urls: text('urls', { mode: 'json' }), // For batch jobs (string[])
  apiEndpoint: text('api_endpoint').notNull(), // Firecrawl API endpoint to use
  scheduleType: text('schedule_type').notNull(), // 'hourly' | 'daily' | 'weekly' | 'monthly' | 'interval'
  scheduleConfig: text('schedule_config', { mode: 'json' }).notNull(), // Schedule configuration
  timezone: text('timezone').notNull().default('UTC'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  lastRunAt: text('last_run_at'),
  nextRunAt: text('next_run_at').notNull(),
})

// Job runs table
export const jobRuns = sqliteTable('job_runs', {
  id: text('id').primaryKey(),
  scheduledJobId: text('scheduled_job_id').notNull().references(() => scheduledJobs.id, { onDelete: 'cascade' }),
  runType: text('run_type').notNull().default('scheduled'), // 'scheduled' | 'manual'
  status: text('status').notNull().default('pending'), // 'pending' | 'running' | 'completed' | 'failed'
  startedAt: text('started_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text('completed_at'),
  resultData: text('result_data', { mode: 'json' }), // Job result as JSON
  errorMessage: text('error_message'),
  executionTimeMs: integer('execution_time_ms'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// Types for the schema
export type ScheduledJob = typeof scheduledJobs.$inferSelect
export type NewScheduledJob = typeof scheduledJobs.$inferInsert
export type JobRun = typeof jobRuns.$inferSelect
export type NewJobRun = typeof jobRuns.$inferInsert

// Schedule configuration types
export interface ScheduleConfig {
  // For interval type
  interval?: number
  unit?: 'minutes' | 'hours' | 'days'
  
  // For time-based schedules (daily, weekly, monthly)
  time?: string // HH:MM format
  
  // For weekly schedules
  days?: number[] // 0-6 (Sunday-Saturday)
  
  // For monthly schedules
  date?: number // 1-31
}

// Schedule types
export type ScheduleType = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'interval'
export type RunType = 'scheduled' | 'manual'
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed'
