// Job configuration interface
export interface JobConfig {
  name: string
  formats?: string[]
  limit?: number
  includeTags?: string[]
  excludeTags?: string[]
  waitFor?: number
  allowBackwardCrawling?: boolean
  allowExternalContentLinks?: boolean
  ignoreSitemap?: boolean
  sitemapOnly?: boolean
  location?: string
  tbs?: string
  filter?: string
  scrapeResults?: boolean
  search?: string
  // v1 API new options
  onlyMainContent?: boolean
  maxAge?: number
  headers?: Record<string, string>
  mobile?: boolean
  skipTlsVerification?: boolean
  timeout?: number
  parsePDF?: boolean
  removeBase64Images?: boolean
  blockAds?: boolean
  proxy?: string
  storeInCache?: boolean
  zeroDataRetention?: boolean
  // LLM extraction options
  llmExtraction?: {
    enabled: boolean
    prompt?: string
    systemPrompt?: string
  }
  // Batch specific options
  maxConcurrency?: number
  ignoreInvalidURLs?: boolean
  // Crawl-specific v1 options
  excludePaths?: string[]
  includePaths?: string[]
  maxDepth?: number
  maxDiscoveryDepth?: number
  ignoreQueryParameters?: boolean
  crawlEntireDomain?: boolean
  allowSubdomains?: boolean
  delay?: number
  webhook?: {
    url: string
    headers?: Record<string, string>
    metadata?: Record<string, any>
    events?: string[]
  }
}

// Job status types
export type JobStatus = "pending" | "running" | "completed" | "failed"
export type JobType = "scrape" | "crawl" | "map" | "batch"

// Base job interface
export interface BaseJob {
  id: string
  type: JobType
  status: JobStatus
  createdAt: string
  config: JobConfig
  data?: any[]
  error?: string
}

// Specific job types
export interface ScrapeJob extends BaseJob {
  type: "scrape"
  url: string
}

export interface CrawlJob extends BaseJob {
  type: "crawl"
  url: string
}

export interface MapJob extends BaseJob {
  type: "map"
  url: string
}

export interface BatchJob extends BaseJob {
  type: "batch"
  urls: string[]
}

// Union type for all job types
export type Job = ScrapeJob | CrawlJob | MapJob | BatchJob

// Legacy interface for backward compatibility
export interface ScrapingJob extends BaseJob {
  url?: string
  urls?: string[]
  query?: string
}

// Job creation payload
export interface CreateJobPayload {
  type: JobType
  url?: string
  urls?: string[]
  config: JobConfig
}

// Job update payload
export interface JobUpdatePayload {
  status?: JobStatus
  data?: any[]
  error?: string
}

// Job statistics
export interface JobStats {
  total: number
  pending: number
  running: number
  completed: number
  failed: number
}
