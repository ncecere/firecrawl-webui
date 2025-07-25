# Firecrawl Frontend

A modern, modular React application for interacting with the Firecrawl API. This web interface provides a clean, user-friendly way to scrape, crawl, map, and batch process web content with **automated scheduling capabilities**.

## 🚀 Features

- **Single Page Scraping**: Convert any webpage to clean markdown, HTML, or other formats
- **Website Crawling**: Recursively crawl websites with advanced filtering options
- **URL Mapping**: Quickly discover all URLs on a website
- **Batch Processing**: Process multiple URLs simultaneously
- **🆕 Automated Scheduling**: Schedule any Firecrawl job to run automatically on intervals, hourly, daily, weekly, or monthly
- **🆕 Job Management**: Create, edit, duplicate, pause/activate, and delete scheduled jobs
- **🆕 Run History**: Track all job executions with detailed history and performance metrics
- **🆕 Manual Execution**: Run any scheduled job immediately on-demand
- **Real-time Job Management**: Track job progress with live updates
- **Advanced Configuration**: Comprehensive options for content filtering, performance tuning, and LLM extraction
- **File Downloads**: Export results as JSON or ZIP files

## 🏗️ Architecture

This application follows a clean, modular architecture with **persistent scheduling infrastructure**:

```
├── types/              # TypeScript type definitions
│   ├── jobs.ts        # Job-related types and interfaces
│   ├── api.ts         # API request/response types
│   └── index.ts       # Centralized type exports
├── constants/          # Application constants and defaults
│   ├── jobDefaults.ts # Default job configurations
│   └── apiEndpoints.ts# API endpoints and storage keys
├── lib/               # Utility functions and core logic
│   ├── jobUtils.ts    # Job manipulation and display utilities
│   ├── fileUtils.ts   # File download and processing utilities
│   ├── apiClient.ts   # HTTP client with polling and error handling
│   ├── utils.ts       # General utility functions
│   ├── db/            # 🆕 Database layer with SQLite and Drizzle ORM
│   │   ├── schema.ts  # Database schema definitions
│   │   ├── queries.ts # Database query functions
│   │   ├── connection.ts # Database connection management
│   │   └── migrations/ # Database migration files
│   └── scheduler/     # 🆕 Background job scheduler
│       ├── scheduler.ts # Cron-based job scheduler
│       └── jobRunner.ts # Job execution engine
├── hooks/             # Custom React hooks
│   ├── useJobs.ts     # Job management with localStorage
│   ├── useLocalStorage.ts # Robust localStorage management
│   └── useFileDownload.ts # File download operations
├── components/        # React components
│   ├── shared/        # Reusable components
│   ├── layout/        # Layout and structural components
│   ├── jobs/          # Job management components
│   ├── schedules/     # 🆕 Scheduling system components
│   │   ├── ScheduleTab.tsx # Main scheduling interface
│   │   ├── CreateScheduleDialog.tsx # Create new schedules
│   │   ├── EditScheduleDialog.tsx # Edit existing schedules
│   │   ├── DuplicateScheduleDialog.tsx # Duplicate schedules
│   │   ├── ScheduleCard.tsx # Individual schedule display
│   │   └── RunHistoryDialog.tsx # Execution history viewer
│   ├── startup/       # 🆕 System initialization components
│   └── ui/            # Base UI components (shadcn/ui)
├── config/            # Application configuration
│   └── app.ts         # Environment-specific settings
├── data/              # 🆕 SQLite database files
│   ├── firecrawl.db   # Main database file
│   ├── firecrawl.db-shm # Shared memory file
│   └── firecrawl.db-wal # Write-ahead log file
└── app/               # Next.js app directory
    ├── page.tsx       # Main application page
    └── api/           # API routes
        ├── firecrawl/ # Original Firecrawl API proxy
        ├── schedules/ # 🆕 Schedule management endpoints
        ├── scheduler/ # 🆕 Scheduler status endpoints
        └── startup/   # 🆕 System initialization endpoint
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React hooks with localStorage persistence
- **HTTP Client**: Native fetch with custom polling logic
- **🆕 Database**: SQLite with Drizzle ORM
- **🆕 Scheduler**: Node-cron for automated job execution
- **🆕 Background Processing**: Custom job runner with error handling
- **Icons**: Lucide React

## 📦 Installation

### Option 1: Docker (Recommended)

The easiest way to run Firecrawl Frontend is using Docker:

#### Development with Docker
```bash
# Clone the repository
git clone <repository-url>
cd firecrawl-frontend

# Copy environment file and customize if needed
cp .env.example .env.local

# Start development environment
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

#### Production with Docker
```bash
# Build and run production container
docker-compose -f docker-compose.prod.yml up --build

# Or with custom environment variables
NEXT_PUBLIC_DEFAULT_API_ENDPOINT=https://your-api.com docker-compose -f docker-compose.prod.yml up --build
```

#### Docker Commands
```bash
# View logs
docker-compose logs -f firecrawl-frontend

# Stop containers
docker-compose down

# Rebuild containers
docker-compose up --build --force-recreate

# Run with nginx (production)
docker-compose -f docker-compose.prod.yml --profile nginx up
```

#### Using Published Container Images

Pre-built container images are automatically published to GitHub Container Registry when new versions are tagged:

```bash
# Pull and run the latest version
docker run -p 3000:3000 ghcr.io/ncecere/firecrawl-webui:latest

# Pull and run a specific version
docker run -p 3000:3000 ghcr.io/ncecere/firecrawl-webui:v1.0.0

# Use in docker-compose with published image
# Update docker-compose.yml to use: ghcr.io/ncecere/firecrawl-webui:latest
```

#### Container Publishing Workflow

The project includes automated container publishing via GitHub Actions:

- **Trigger**: Pushing a version tag (e.g., `v1.0.0`, `v2.1.3`)
- **Registry**: GitHub Container Registry (`ghcr.io`)
- **Tags Created**:
  - Exact tag match: `ghcr.io/ncecere/firecrawl-webui:v1.0.0`
  - Semantic version: `ghcr.io/ncecere/firecrawl-webui:1.0.0`
  - Major.minor: `ghcr.io/ncecere/firecrawl-webui:1.0`
  - Major: `ghcr.io/ncecere/firecrawl-webui:1`
  - Latest: `ghcr.io/ncecere/firecrawl-webui:latest`
- **Platforms**: Multi-architecture support (linux/amd64, linux/arm64)

To publish a new version:
```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# The GitHub Action will automatically build and publish the container
```

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd firecrawl-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### API Endpoint
Configure your Firecrawl API endpoint in the application header. The default is set to `http://localhost:3002` but can be changed to any valid Firecrawl API instance.

### Environment Variables
Create a `.env.local` file for environment-specific configuration:

```env
# Optional: Default API endpoint
NEXT_PUBLIC_DEFAULT_API_ENDPOINT=https://api.firecrawl.dev

# Optional: Application settings
NEXT_PUBLIC_MAX_JOBS=100
NEXT_PUBLIC_STORAGE_LIMIT=10485760

# 🆕 Database configuration (automatically managed)
DATABASE_URL=./data/firecrawl.db
```

## 📚 Usage

### Single Page Scraping
1. Select the "Single Scrape" tab
2. Enter the URL you want to scrape
3. Configure output formats (Markdown, HTML, Links, Screenshot)
4. Set advanced options like content filtering and LLM extraction
5. Click "Start Scrape Job"

### Website Crawling
1. Select the "Crawl Site" tab
2. Enter the starting URL
3. Configure crawl depth, page limits, and path filtering
4. Set performance options like concurrency and delays
5. Click "Start Crawl Job"

### URL Mapping
1. Select the "Map" tab
2. Enter the website URL to map
3. Optionally add search filters
4. Configure advanced options like subdomain inclusion
5. Click "Start Mapping"

### Batch Processing
1. Select the "Batch Scrape" tab
2. Enter multiple URLs (one per line)
3. Configure scraping options
4. Set concurrency limits
5. Click "Start Batch Job"

### 🆕 Automated Scheduling

#### Creating Schedules
1. Select the "Schedules" tab
2. Click "Create Schedule"
3. **Step 1**: Configure basic settings
   - Enter a descriptive schedule name
   - Choose job type (Single Scrape, Website Crawl, Batch Scrape, or Site Map)
   - Enter target URL(s)
4. **Step 2**: Configure job-specific options
   - Set output formats, filtering, and advanced options
   - Configure performance settings
5. **Step 3**: Set schedule timing
   - **Interval**: Every X minutes/hours/days
   - **Hourly**: Every hour at a specific minute
   - **Daily**: Every day at a specific time
   - **Weekly**: Specific days of the week at a specific time
   - **Monthly**: Specific day of the month at a specific time
   - Choose timezone for accurate scheduling

#### Managing Schedules
- **View Details**: See execution history and schedule configuration
- **Edit Schedule**: Modify any aspect of the schedule
- **Duplicate Schedule**: Create a copy with a new name
- **Run Now**: Execute the job immediately without waiting for the schedule
- **Pause/Activate**: Temporarily disable or re-enable schedules
- **Delete**: Permanently remove schedules

#### Schedule Types
- **Interval Scheduling**: `*/5 * * * *` (every 5 minutes)
- **Hourly Scheduling**: `0 * * * *` (every hour)
- **Daily Scheduling**: `0 9 * * *` (daily at 9 AM)
- **Weekly Scheduling**: `0 9 * * 1,3,5` (Monday, Wednesday, Friday at 9 AM)
- **Monthly Scheduling**: `0 9 1 * *` (1st day of every month at 9 AM)

#### Run History
- View detailed execution logs for each scheduled job
- See execution times, success/failure status, and error messages
- Track performance metrics and job reliability
- Export results from historical runs

## 🔄 Job Management

### Job States
- **Pending**: Job is queued for processing
- **Running**: Job is currently being processed
- **Completed**: Job finished successfully
- **Failed**: Job encountered an error

### Manual Job Actions
- **View Results**: Inspect scraped content and metadata
- **Download JSON**: Export results as JSON file
- **Download ZIP**: Export results as organized ZIP file
- **Retry**: Restart failed jobs
- **Delete**: Remove jobs from history

### 🆕 Scheduled Job States
- **Active**: Schedule is running and will execute jobs automatically
- **Paused**: Schedule is temporarily disabled
- **Running**: A scheduled job is currently executing
- **Last Run Success**: Previous execution completed successfully
- **Last Run Failed**: Previous execution encountered an error

### Data Persistence
- **Manual Jobs**: Automatically saved to localStorage and persist across browser sessions
- **🆕 Scheduled Jobs**: Stored in SQLite database with full persistence
- **🆕 Run History**: Complete execution history stored in database
- **🆕 System Recovery**: Schedules automatically resume after application restarts

The application includes:
- Automatic cleanup of old jobs
- Storage size management
- Data validation and error recovery
- **🆕 Database migrations** for schema updates
- **🆕 Backup and recovery** capabilities

## 🎨 Customization

### Themes
The application supports light and dark themes through the theme provider. Toggle between themes using the theme switcher in the header.

### Component Styling
All components use Tailwind CSS classes and can be customized by modifying the component files or extending the Tailwind configuration.

### Adding New Job Types
To add a new job type:

1. **Update types** in `types/jobs.ts`
2. **Add default configuration** in `constants/jobDefaults.ts`
3. **Create form component** in `components/`
4. **Update API handler** in `app/api/firecrawl/route.ts`
5. **🆕 Add scheduling support** in `components/schedules/CreateScheduleDialog.tsx`
6. **🆕 Update job runner** in `lib/scheduler/jobRunner.ts`
7. **Add job processing logic** in the API route

## 🚨 Error Handling

The application includes comprehensive error handling:

- **API Errors**: User-friendly messages for common API issues
- **Network Errors**: Automatic retry logic with exponential backoff
- **Validation Errors**: Real-time form validation with helpful hints
- **Storage Errors**: Graceful degradation when localStorage is unavailable
- **🆕 Database Errors**: Automatic recovery and migration handling
- **🆕 Scheduler Errors**: Job failure tracking and retry mechanisms

### Common Error Messages
- **408 Timeout**: "Request timed out. Try reducing complexity or wait time."
- **429 Rate Limit**: "Rate limit exceeded. Please wait before trying again."
- **500+ Server**: "Service temporarily unavailable. Please try again later."
- **🆕 Database Connection**: "Database temporarily unavailable. Retrying..."
- **🆕 Schedule Conflict**: "Schedule time conflicts with existing job. Please choose a different time."

## 🔧 Development

### Code Organization
- **Types First**: All data structures are defined with TypeScript types
- **Utility Functions**: Common logic is extracted into reusable utilities
- **Custom Hooks**: Complex state logic is encapsulated in custom hooks
- **Component Composition**: UI is built from small, focused components
- **🆕 Database Layer**: Clean separation between UI and data persistence
- **🆕 Background Services**: Scheduler runs independently of UI components

### Best Practices
- Use TypeScript strict mode for better type safety
- Follow React hooks rules and patterns
- Implement proper error boundaries
- Use semantic HTML and ARIA attributes
- Optimize for performance with React.memo and useMemo
- **🆕 Database transactions** for data consistency
- **🆕 Proper cleanup** of scheduled jobs and database connections

### Adding Features
1. Define types in `types/`
2. Add constants in `constants/`
3. Create utilities in `lib/`
4. Build hooks in `hooks/`
5. Compose components in `components/`
6. Update API routes in `app/api/`
7. **🆕 Add database schema** in `lib/db/schema.ts`
8. **🆕 Create database queries** in `lib/db/queries.ts`
9. **🆕 Update scheduler** if needed in `lib/scheduler/`

## 📈 Performance

### Optimizations
- **Lazy Loading**: Components are loaded on demand
- **Memoization**: Expensive calculations are cached
- **Virtual Scrolling**: Large lists are virtualized
- **Debounced Inputs**: User inputs are debounced to reduce API calls
- **Efficient Polling**: Smart polling with automatic cleanup
- **🆕 Database Indexing**: Optimized queries for fast schedule lookups
- **🆕 Background Processing**: Jobs run without blocking the UI
- **🆕 Connection Pooling**: Efficient database connection management

### Monitoring
- Job statistics are tracked and displayed
- Performance metrics are logged to console in development
- Error rates and response times are monitored
- **🆕 Schedule execution metrics** tracked in database
- **🆕 System health monitoring** via `/api/health` endpoint
- **🆕 Database performance** monitoring and optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and patterns
- Add TypeScript types for all new code
- Include JSDoc comments for public functions
- Test your changes thoroughly
- Update documentation as needed
- **🆕 Test database migrations** in development
- **🆕 Verify scheduler functionality** with test schedules

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Firecrawl](https://firecrawl.dev) for the powerful web scraping API
- [shadcn/ui](https://ui.shadcn.com) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Next.js](https://nextjs.org) for the React framework
- **🆕 [Drizzle ORM](https://orm.drizzle.team) for the TypeScript-first database toolkit**
- **🆕 [node-cron](https://github.com/node-cron/node-cron) for reliable job scheduling**
