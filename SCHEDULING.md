# Scheduling System Documentation

This document provides comprehensive information about the automated scheduling system in Firecrawl Frontend.

## 🎯 Overview

The scheduling system transforms Firecrawl Frontend from a manual tool into a fully automated platform. Users can create, manage, and monitor scheduled jobs that run automatically in the background without manual intervention.

## 🏗️ Architecture

### Core Components

```
lib/scheduler/
├── scheduler.ts         # Main scheduler engine with cron management
└── jobRunner.ts        # Job execution engine with error handling

lib/db/
├── schema.ts           # Database schema for schedules and runs
├── queries.ts          # Database operations for scheduling
├── connection.ts       # Database connection management
└── migrations/         # Database schema migrations

components/schedules/
├── ScheduleTab.tsx     # Main scheduling interface
├── CreateScheduleDialog.tsx # Create new schedules
├── EditScheduleDialog.tsx   # Edit existing schedules
├── DuplicateScheduleDialog.tsx # Duplicate schedules
├── ScheduleCard.tsx    # Individual schedule display
└── RunHistoryDialog.tsx # Execution history viewer

app/api/
├── schedules/          # Schedule CRUD operations
├── scheduler/          # Scheduler status and control
└── startup/            # System initialization
```

### Database Schema

#### Scheduled Jobs Table
```sql
CREATE TABLE scheduled_jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  job_config TEXT NOT NULL,
  schedule_type TEXT NOT NULL,
  schedule_config TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### Job Runs Table
```sql
CREATE TABLE job_runs (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  duration INTEGER,
  result TEXT,
  error_message TEXT,
  FOREIGN KEY (schedule_id) REFERENCES scheduled_jobs (id) ON DELETE CASCADE
);
```

## 🚀 Features

### Schedule Types

#### 1. Interval Scheduling
Run jobs at regular intervals:
- **Every X minutes**: `*/5 * * * *` (every 5 minutes)
- **Every X hours**: `0 */2 * * *` (every 2 hours)
- **Every X days**: `0 0 */3 * *` (every 3 days)

#### 2. Hourly Scheduling
Run jobs every hour at a specific minute:
- **Every hour at minute 30**: `30 * * * *`
- **Every hour at minute 0**: `0 * * * *`

#### 3. Daily Scheduling
Run jobs daily at a specific time:
- **Daily at 9:00 AM**: `0 9 * * *`
- **Daily at 6:30 PM**: `30 18 * * *`

#### 4. Weekly Scheduling
Run jobs on specific days of the week:
- **Monday, Wednesday, Friday at 9 AM**: `0 9 * * 1,3,5`
- **Weekends at 10 AM**: `0 10 * * 0,6`

#### 5. Monthly Scheduling
Run jobs on specific days of the month:
- **1st day of every month at 9 AM**: `0 9 1 * *`
- **15th day of every month at 2 PM**: `0 14 15 * *`

### Job Types Support

All Firecrawl job types are supported for scheduling:

#### Single Page Scrape
```typescript
{
  jobType: 'scrape',
  config: {
    url: 'https://example.com',
    formats: ['markdown', 'html'],
    onlyMainContent: true,
    // ... other scrape options
  }
}
```

#### Website Crawl
```typescript
{
  jobType: 'crawl',
  config: {
    url: 'https://example.com',
    maxDepth: 3,
    limit: 100,
    includePaths: ['/blog/*'],
    // ... other crawl options
  }
}
```

#### Batch Scrape
```typescript
{
  jobType: 'batch',
  config: {
    urls: ['https://site1.com', 'https://site2.com'],
    formats: ['markdown'],
    concurrency: 5,
    // ... other batch options
  }
}
```

#### Site Map
```typescript
{
  jobType: 'map',
  config: {
    url: 'https://example.com',
    search: 'documentation',
    includeSubdomains: false,
    // ... other map options
  }
}
```

## 🔧 Implementation Details

### Scheduler Engine (`lib/scheduler/scheduler.ts`)

The scheduler uses `node-cron` for reliable job scheduling:

```typescript
class JobScheduler {
  private scheduledJobs = new Map<string, ScheduledTask>()
  
  /**
   * Start the scheduler and load active jobs
   */
  async start(): Promise<void> {
    const activeJobs = await getActiveScheduledJobs()
    
    for (const job of activeJobs) {
      await this.scheduleJob(job)
    }
  }
  
  /**
   * Schedule a job with cron expression
   */
  async scheduleJob(job: ScheduledJob): Promise<void> {
    const cronExpression = this.buildCronExpression(job)
    
    const task = cron.schedule(cronExpression, async () => {
      await this.executeJob(job)
    }, {
      scheduled: false,
      timezone: job.timezone
    })
    
    this.scheduledJobs.set(job.id, task)
    task.start()
  }
}
```

### Job Runner (`lib/scheduler/jobRunner.ts`)

The job runner executes scheduled jobs and tracks results:

```typescript
export async function executeScheduledJob(job: ScheduledJob): Promise<JobRunResult> {
  const runId = generateId()
  const startTime = Date.now()
  
  try {
    // Create run record
    await createJobRun({
      id: runId,
      scheduleId: job.id,
      status: 'running',
      startedAt: startTime
    })
    
    // Execute the job
    const result = await executeFirecrawlJob(job.jobConfig)
    
    // Update run record with success
    await updateJobRun(runId, {
      status: 'completed',
      completedAt: Date.now(),
      duration: Date.now() - startTime,
      result: JSON.stringify(result)
    })
    
    return { success: true, result }
    
  } catch (error) {
    // Update run record with failure
    await updateJobRun(runId, {
      status: 'failed',
      completedAt: Date.now(),
      duration: Date.now() - startTime,
      errorMessage: error.message
    })
    
    throw error
  }
}
```

### Database Operations (`lib/db/queries.ts`)

Database operations for schedule management:

```typescript
/**
 * Create a new scheduled job
 */
export async function createScheduledJob(job: CreateScheduledJobData): Promise<ScheduledJob> {
  const db = await getDatabase()
  
  const [result] = await db.insert(scheduledJobs).values({
    id: job.id,
    name: job.name,
    jobType: job.jobType,
    jobConfig: JSON.stringify(job.jobConfig),
    scheduleType: job.scheduleType,
    scheduleConfig: JSON.stringify(job.scheduleConfig),
    timezone: job.timezone,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }).returning()
  
  return result
}

/**
 * Get all active scheduled jobs
 */
export async function getActiveScheduledJobs(): Promise<ScheduledJob[]> {
  const db = await getDatabase()
  
  return await db.select()
    .from(scheduledJobs)
    .where(eq(scheduledJobs.isActive, true))
}
```

## 🎨 User Interface

### Schedule Creation Flow

1. **Basic Configuration**
   - Schedule name
   - Job type selection
   - Target URL(s)

2. **Job-Specific Options**
   - Output formats
   - Content filtering
   - Performance settings
   - Advanced options

3. **Schedule Configuration**
   - Schedule type selection
   - Time/interval settings
   - Timezone selection

### Schedule Management

- **Schedule Cards**: Visual representation of each schedule
- **Status Indicators**: Active, paused, running states
- **Next Run Time**: Calculated based on cron expression
- **Last Run Status**: Success/failure with execution time
- **Quick Actions**: Run now, edit, duplicate, pause/activate, delete

### Run History

- **Execution Timeline**: Chronological list of all runs
- **Performance Metrics**: Execution time, success rate
- **Error Tracking**: Detailed error messages and stack traces
- **Result Access**: View and download results from historical runs

## 🔍 Monitoring and Debugging

### Health Checks

The system includes comprehensive health monitoring:

```typescript
// GET /api/scheduler/status
{
  "status": "running",
  "activeJobs": 5,
  "totalSchedules": 12,
  "lastExecution": "2024-01-01T12:00:00Z",
  "uptime": 86400000,
  "systemHealth": {
    "database": "connected",
    "scheduler": "running",
    "memory": "normal"
  }
}
```

### Logging

Comprehensive logging for debugging:

```typescript
console.log('🚀 Initializing Firecrawl WebUI...')
console.log('✅ Database initialized')
console.log('✅ Scheduler started')
console.log(`📋 Found ${activeJobs.length} active scheduled jobs`)
console.log(`✅ Scheduled job: ${job.name} (${job.id})`)
console.log('🎉 Firecrawl WebUI initialization complete!')
```

### Error Handling

Robust error handling at every level:

1. **Database Errors**: Connection retry logic and graceful degradation
2. **Scheduler Errors**: Job failure tracking and automatic retry
3. **API Errors**: Comprehensive error messages and status codes
4. **UI Errors**: User-friendly error displays with recovery options

## 🚀 Performance Optimization

### Database Optimization

- **Indexes**: Optimized queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Minimal database queries with proper joins

### Scheduler Optimization

- **Memory Management**: Efficient job storage and cleanup
- **Concurrent Execution**: Multiple jobs can run simultaneously
- **Resource Limits**: Configurable limits to prevent system overload

### UI Optimization

- **Real-time Updates**: Efficient polling for status updates
- **Memoization**: Optimized component rendering
- **Lazy Loading**: Components loaded on demand

## 🔒 Security Considerations

### Data Protection

- **Input Validation**: All user inputs are validated and sanitized
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
- **XSS Protection**: Proper output encoding and CSP headers

### Access Control

- **Local Storage**: Schedules stored locally per user session
- **API Security**: Rate limiting and request validation
- **Error Information**: Sensitive information filtered from error messages

## 🧪 Testing

### Unit Tests

Test individual components and functions:

```typescript
describe('JobScheduler', () => {
  it('should create valid cron expressions', () => {
    const scheduler = new JobScheduler()
    const cronExpr = scheduler.buildCronExpression({
      scheduleType: 'daily',
      scheduleConfig: { hour: 9, minute: 30 }
    })
    expect(cronExpr).toBe('30 9 * * *')
  })
})
```

### Integration Tests

Test complete workflows:

```typescript
describe('Schedule Creation', () => {
  it('should create and execute a scheduled job', async () => {
    const schedule = await createSchedule({
      name: 'Test Schedule',
      jobType: 'scrape',
      // ... configuration
    })
    
    expect(schedule.id).toBeDefined()
    expect(schedule.isActive).toBe(true)
  })
})
```

## 🔄 Migration and Upgrades

### Database Migrations

The system includes automatic database migrations:

```sql
-- Migration 0001: Add timezone support
ALTER TABLE scheduled_jobs ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC';

-- Migration 0002: Add job run tracking
CREATE TABLE job_runs (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  -- ... other columns
);
```

### Version Compatibility

- **Backward Compatibility**: New features don't break existing schedules
- **Data Migration**: Automatic migration of existing data structures
- **Feature Flags**: Gradual rollout of new features

## 📚 API Reference

### Schedule Management

#### Create Schedule
```http
POST /api/schedules
Content-Type: application/json

{
  "name": "Daily News Scraping",
  "jobType": "scrape",
  "jobConfig": { "url": "https://news.com" },
  "scheduleType": "daily",
  "scheduleConfig": { "hour": 9, "minute": 0 },
  "timezone": "America/New_York"
}
```

#### Get Schedules
```http
GET /api/schedules

Response:
{
  "schedules": [
    {
      "id": "schedule_123",
      "name": "Daily News Scraping",
      "isActive": true,
      "nextRun": "2024-01-02T09:00:00Z",
      "lastRun": {
        "status": "completed",
        "duration": 5432,
        "completedAt": "2024-01-01T09:00:05Z"
      }
    }
  ]
}
```

#### Update Schedule
```http
PUT /api/schedules/schedule_123
Content-Type: application/json

{
  "name": "Updated Schedule Name",
  "isActive": false
}
```

#### Delete Schedule
```http
DELETE /api/schedules/schedule_123
```

#### Run Schedule Immediately
```http
POST /api/schedules/schedule_123/run
```

#### Get Run History
```http
GET /api/schedules/schedule_123/runs

Response:
{
  "runs": [
    {
      "id": "run_456",
      "status": "completed",
      "startedAt": "2024-01-01T09:00:00Z",
      "completedAt": "2024-01-01T09:00:05Z",
      "duration": 5432,
      "result": { /* job result data */ }
    }
  ]
}
```

### Scheduler Control

#### Get Scheduler Status
```http
GET /api/scheduler/status

Response:
{
  "status": "running",
  "activeJobs": 5,
  "totalSchedules": 12,
  "uptime": 86400000
}
```

#### System Initialization
```http
POST /api/startup

Response:
{
  "success": true,
  "message": "System initialized successfully",
  "scheduledJobs": 5
}
```

## 🤝 Contributing

### Adding New Schedule Types

1. **Update Types**: Add new schedule type to `types/jobs.ts`
2. **Update UI**: Add form fields in `CreateScheduleDialog.tsx`
3. **Update Scheduler**: Add cron expression logic in `scheduler.ts`
4. **Add Tests**: Create tests for the new schedule type

### Adding New Job Types

1. **Update Schema**: Add job type to database schema
2. **Update Runner**: Add execution logic in `jobRunner.ts`
3. **Update UI**: Add form components for job configuration
4. **Update API**: Add API endpoints for job type

## 🐛 Troubleshooting

### Common Issues

#### Schedules Not Running
- Check scheduler status: `GET /api/scheduler/status`
- Verify cron expression validity
- Check database connection
- Review error logs

#### Database Connection Issues
- Verify database file permissions
- Check disk space availability
- Review connection configuration
- Check for database locks

#### Performance Issues
- Monitor active job count
- Check memory usage
- Review database query performance
- Optimize cron expressions

### Debug Commands

```bash
# Check database status
sqlite3 data/firecrawl.db ".tables"

# View scheduled jobs
sqlite3 data/firecrawl.db "SELECT * FROM scheduled_jobs;"

# View recent runs
sqlite3 data/firecrawl.db "SELECT * FROM job_runs ORDER BY started_at DESC LIMIT 10;"

# Check application logs
docker-compose logs -f firecrawl-frontend
```

---

This scheduling system provides a robust, scalable foundation for automated web scraping and crawling operations. The modular architecture allows for easy extension and customization while maintaining reliability and performance.
