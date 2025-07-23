// Default API endpoints
export const DEFAULT_API_ENDPOINTS = [
  {
    name: "Local Development",
    url: "http://localhost:3002",
  },
  {
    name: "Firecrawl Cloud",
    url: "https://api.firecrawl.dev",
  },
] as const

// API endpoint validation
export const API_ENDPOINT_REGEX = /^https?:\/\/.+/

// Storage keys
export const STORAGE_KEYS = {
  JOBS: "firecrawl-jobs",
  API_ENDPOINT: "firecrawl-endpoint",
  APP_SETTINGS: "firecrawl-settings",
} as const

// Job polling configuration
export const POLLING_CONFIG = {
  INTERVAL: 3000, // 3 seconds
  MAX_ATTEMPTS: 120, // 10 minutes with 5-second intervals for long operations
  TIMEOUT: {
    SCRAPE: 300000, // 5 minutes
    CRAWL: 300000, // 5 minutes
    MAP: 120000, // 2 minutes
    BATCH: 300000, // 5 minutes
  },
} as const

// Local storage limits
export const STORAGE_LIMITS = {
  MAX_JOBS: 50,
  MAX_RESULTS_PER_JOB: 5,
  RETRY_LIMIT: 20,
} as const
