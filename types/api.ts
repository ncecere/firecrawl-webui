import { JobConfig, JobStatus, JobType } from './jobs'

// API request/response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Firecrawl API specific types
export interface FirecrawlScrapeRequest {
  url: string
  formats?: string[]
  onlyMainContent?: boolean
  includeTags?: string[]
  excludeTags?: string[]
  waitFor?: number
  timeout?: number
  mobile?: boolean
  skipTlsVerification?: boolean
  parsePDF?: boolean
  removeBase64Images?: boolean
  blockAds?: boolean
  headers?: Record<string, string>
  extract?: {
    schema?: Record<string, any>
    prompt?: string
    systemPrompt?: string
  }
}

export interface FirecrawlCrawlRequest {
  url: string
  limit?: number
  excludePaths?: string[]
  includePaths?: string[]
  maxDepth?: number
  maxDiscoveryDepth?: number
  ignoreSitemap?: boolean
  ignoreQueryParameters?: boolean
  allowBackwardLinks?: boolean
  crawlEntireDomain?: boolean
  allowExternalLinks?: boolean
  allowSubdomains?: boolean
  delay?: number
  maxConcurrency?: number
  webhook?: {
    url: string
    headers?: Record<string, string>
    metadata?: Record<string, any>
    events?: string[]
  }
  zeroDataRetention?: boolean
  scrapeOptions?: FirecrawlScrapeRequest
}

export interface FirecrawlMapRequest {
  url: string
  search?: string
  ignoreSitemap?: boolean
  includeSubdomains?: boolean
  limit?: number
  timeout?: number
  sitemapOnly?: boolean
}

export interface FirecrawlBatchRequest {
  urls: string[]
  maxConcurrency?: number
  ignoreInvalidURLs?: boolean
  formats?: string[]
  onlyMainContent?: boolean
  includeTags?: string[]
  excludeTags?: string[]
  waitFor?: number
  timeout?: number
  mobile?: boolean
  skipTlsVerification?: boolean
  parsePDF?: boolean
  removeBase64Images?: boolean
  blockAds?: boolean
  headers?: Record<string, string>
}

// Job API request types
export interface CreateJobRequest {
  jobId: string
  type: JobType
  url?: string
  urls?: string[]
  config: JobConfig
  apiEndpoint: string
}

export interface JobStatusResponse {
  id: string
  type: JobType
  status: JobStatus
  data?: any[]
  error?: string
  createdAt: string
  config: JobConfig
}

// Polling response types
export interface CrawlStatusResponse {
  status: JobStatus
  data?: any[]
  error?: string
}

export interface BatchStatusResponse {
  status: JobStatus
  data?: any[]
  error?: string
}

// Error types
export interface ApiError {
  message: string
  status?: number
  code?: string
}

export interface ValidationError extends ApiError {
  field?: string
  value?: any
}

// File download types
export interface DownloadOptions {
  format: 'json' | 'zip'
  filename?: string
}

export interface ZipFileOptions {
  formats: string[]
  startingUrl: string
  jobName: string
}
