import { JobConfig } from '@/types/jobs'

// Default job configurations
export const DEFAULT_SCRAPE_CONFIG: Partial<JobConfig> = {
  formats: ["markdown"],
  limit: 10,
  includeTags: [],
  excludeTags: [],
  waitFor: 0,
  onlyMainContent: false,
  maxAge: 0,
  mobile: false,
  skipTlsVerification: false,
  timeout: 30,
  parsePDF: false,
  removeBase64Images: false,
  blockAds: false,
  storeInCache: false,
  zeroDataRetention: false,
  llmExtraction: {
    enabled: false,
    prompt: "",
    systemPrompt: "",
  },
}

export const DEFAULT_CRAWL_CONFIG: Partial<JobConfig> = {
  ...DEFAULT_SCRAPE_CONFIG,
  allowBackwardCrawling: false,
  allowExternalContentLinks: false,
  ignoreSitemap: false,
  excludePaths: [],
  includePaths: [],
  maxDepth: 10,
  maxDiscoveryDepth: 10,
  ignoreQueryParameters: false,
  crawlEntireDomain: false,
  allowSubdomains: false,
  delay: 0,
}

export const DEFAULT_BATCH_CONFIG: Partial<JobConfig> = {
  ...DEFAULT_SCRAPE_CONFIG,
  maxConcurrency: 5,
  ignoreInvalidURLs: false,
}

export const DEFAULT_MAP_CONFIG: Partial<JobConfig> = {
  name: "",
  limit: 5000,
  timeout: 30,
  ignoreSitemap: false,
  sitemapOnly: false,
  allowSubdomains: false,
}

// Available output formats
export const OUTPUT_FORMATS = [
  { value: "markdown", label: "Markdown" },
  { value: "html", label: "HTML" },
  { value: "rawHtml", label: "Raw HTML" },
  { value: "links", label: "Links" },
  { value: "screenshot", label: "Screenshot" },
] as const

// Job type configurations
export const JOB_TYPE_CONFIG = {
  scrape: {
    title: "Single Page Scrape",
    description: "Turn any URL into clean data. Converts web pages into markdown, ideal for LLM applications. Handles dynamic content, JS-rendered sites, PDFs, and images.",
    icon: "Globe",
    defaultConfig: DEFAULT_SCRAPE_CONFIG,
  },
  crawl: {
    title: "Website Crawl",
    description: "Recursively search through a website's subdomains and gather comprehensive content. Scans sitemap, follows links, and extracts data from all subpages.",
    icon: "Link",
    defaultConfig: DEFAULT_CRAWL_CONFIG,
  },
  batch: {
    title: "Batch Scrape",
    description: "Scrape multiple URLs simultaneously. Enter one URL per line for efficient batch processing.",
    icon: "Layers",
    defaultConfig: DEFAULT_BATCH_CONFIG,
  },
  map: {
    title: "Website Mapping",
    description: "Input a website and get all the URLs on the website – extremely fast!",
    icon: "Map",
    defaultConfig: DEFAULT_MAP_CONFIG,
  },
} as const

// Validation limits
export const VALIDATION_LIMITS = {
  url: {
    maxLength: 2048,
  },
  jobName: {
    maxLength: 100,
  },
  batchUrls: {
    maxCount: 1000,
  },
  limit: {
    min: 1,
    max: 1000,
  },
  waitFor: {
    min: 0,
    max: 30,
  },
  timeout: {
    min: 1,
    max: 300,
  },
  maxDepth: {
    min: 1,
    max: 100,
  },
  delay: {
    min: 0,
    max: 10000,
  },
  maxConcurrency: {
    min: 1,
    max: 50,
  },
} as const
