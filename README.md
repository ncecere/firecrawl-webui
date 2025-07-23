# Firecrawl Frontend

A modern, modular React application for interacting with the Firecrawl API. This web interface provides a clean, user-friendly way to scrape, crawl, map, and batch process web content.

## 🚀 Features

- **Single Page Scraping**: Convert any webpage to clean markdown, HTML, or other formats
- **Website Crawling**: Recursively crawl websites with advanced filtering options
- **URL Mapping**: Quickly discover all URLs on a website
- **Batch Processing**: Process multiple URLs simultaneously
- **Real-time Job Management**: Track job progress with live updates
- **Advanced Configuration**: Comprehensive options for content filtering, performance tuning, and LLM extraction
- **File Downloads**: Export results as JSON or ZIP files

## 🏗️ Architecture

This application follows a clean, modular architecture:

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
│   └── utils.ts       # General utility functions
├── hooks/             # Custom React hooks
│   ├── useJobs.ts     # Job management with localStorage
│   ├── useLocalStorage.ts # Robust localStorage management
│   └── useFileDownload.ts # File download operations
├── components/        # React components
│   ├── shared/        # Reusable components
│   ├── layout/        # Layout and structural components
│   ├── jobs/          # Job management components
│   └── ui/            # Base UI components (shadcn/ui)
├── config/            # Application configuration
│   └── app.ts         # Environment-specific settings
└── app/               # Next.js app directory
    ├── page.tsx       # Main application page
    └── api/           # API routes
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React hooks with localStorage persistence
- **HTTP Client**: Native fetch with custom polling logic
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

## 🔄 Job Management

### Job States
- **Pending**: Job is queued for processing
- **Running**: Job is currently being processed
- **Completed**: Job finished successfully
- **Failed**: Job encountered an error

### Job Actions
- **View Results**: Inspect scraped content and metadata
- **Download JSON**: Export results as JSON file
- **Download ZIP**: Export results as organized ZIP file
- **Retry**: Restart failed jobs
- **Delete**: Remove jobs from history

### Data Persistence
Jobs are automatically saved to localStorage and persist across browser sessions. The application includes:
- Automatic cleanup of old jobs
- Storage size management
- Data validation and error recovery

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
5. **Add job processing logic** in the API route

## 🚨 Error Handling

The application includes comprehensive error handling:

- **API Errors**: User-friendly messages for common API issues
- **Network Errors**: Automatic retry logic with exponential backoff
- **Validation Errors**: Real-time form validation with helpful hints
- **Storage Errors**: Graceful degradation when localStorage is unavailable

### Common Error Messages
- **408 Timeout**: "Request timed out. Try reducing complexity or wait time."
- **429 Rate Limit**: "Rate limit exceeded. Please wait before trying again."
- **500+ Server**: "Service temporarily unavailable. Please try again later."

## 🔧 Development

### Code Organization
- **Types First**: All data structures are defined with TypeScript types
- **Utility Functions**: Common logic is extracted into reusable utilities
- **Custom Hooks**: Complex state logic is encapsulated in custom hooks
- **Component Composition**: UI is built from small, focused components

### Best Practices
- Use TypeScript strict mode for better type safety
- Follow React hooks rules and patterns
- Implement proper error boundaries
- Use semantic HTML and ARIA attributes
- Optimize for performance with React.memo and useMemo

### Adding Features
1. Define types in `types/`
2. Add constants in `constants/`
3. Create utilities in `lib/`
4. Build hooks in `hooks/`
5. Compose components in `components/`
6. Update API routes in `app/api/`

## 📈 Performance

### Optimizations
- **Lazy Loading**: Components are loaded on demand
- **Memoization**: Expensive calculations are cached
- **Virtual Scrolling**: Large lists are virtualized
- **Debounced Inputs**: User inputs are debounced to reduce API calls
- **Efficient Polling**: Smart polling with automatic cleanup

### Monitoring
- Job statistics are tracked and displayed
- Performance metrics are logged to console in development
- Error rates and response times are monitored

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

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Firecrawl](https://firecrawl.dev) for the powerful web scraping API
- [shadcn/ui](https://ui.shadcn.com) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Next.js](https://nextjs.org) for the React framework
