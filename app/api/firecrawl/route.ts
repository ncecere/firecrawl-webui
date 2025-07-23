import { type NextRequest, NextResponse } from "next/server"

interface JobConfig {
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

interface Job {
  id: string
  type: "scrape" | "crawl" | "map" | "batch"
  url?: string
  urls?: string[]
  query?: string
  status: "pending" | "running" | "completed" | "failed"
  data?: any[]
  error?: string
  createdAt: string
  config: JobConfig
}

// Store jobs in memory (in production, use a database)
const jobs = new Map<string, Job>()

export async function POST(request: NextRequest) {
  try {
    const { jobId, type, url, urls, query, config, apiEndpoint } = await request.json()

    if (!jobId || !type || !apiEndpoint) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate based on job type
    if ((type === "scrape" || type === "crawl" || type === "map") && !url) {
      return NextResponse.json({ error: "URL is required for this job type" }, { status: 400 })
    }
    if (type === "batch" && (!urls || urls.length === 0)) {
      return NextResponse.json({ error: "URLs array is required for batch jobs" }, { status: 400 })
    }

    const job: Job = {
      id: jobId,
      type,
      url,
      urls,
      query,
      status: "running",
      createdAt: new Date().toISOString(),
      config,
    }

    jobs.set(jobId, job)

    // Start the appropriate job type
    processJob(jobId, apiEndpoint).catch((error) => {
      console.error(`Job ${jobId} failed:`, error)
      const failedJob = jobs.get(jobId)
      if (failedJob) {
        failedJob.status = "failed"
        failedJob.error = error.message
        jobs.set(jobId, failedJob)
      }
    })

    return NextResponse.json({ success: true, jobId })
  } catch (error) {
    console.error("Error starting job:", error)
    return NextResponse.json({ error: "Failed to start job" }, { status: 500 })
  }
}

async function processJob(jobId: string, apiEndpoint: string) {
  const job = jobs.get(jobId)
  if (!job) throw new Error("Job not found")

  try {
    let result: any

    switch (job.type) {
      case "scrape":
        result = await processScrapeJob(job, apiEndpoint)
        break
      case "crawl":
        result = await processCrawlJob(job, apiEndpoint)
        break
      case "map":
        result = await processMapJob(job, apiEndpoint)
        break
      case "batch":
        result = await processBatchJob(job, apiEndpoint)
        break
      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }

    job.status = "completed"
    job.data = Array.isArray(result) ? result : [result]
    jobs.set(jobId, job)
  } catch (error) {
    job.status = "failed"
    job.error = error instanceof Error ? error.message : "Unknown error occurred"
    jobs.set(jobId, job)
    throw error
  }
}

async function processScrapeJob(job: Job, apiEndpoint: string) {
  const scrapeOptions = buildScrapeOptions(job.config)

  // Set a longer timeout for the fetch request (5 minutes)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

  try {
    const response = await fetch(`${apiEndpoint}/v1/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: job.url,
        ...scrapeOptions,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      
      // Handle specific error cases with more user-friendly messages
      if (response.status === 408) {
        throw new Error(`Request timed out. The website may be slow to respond or the content is complex. Try reducing the page limit or wait time settings.`)
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Please wait a moment before trying again.`)
      } else if (response.status >= 500) {
        throw new Error(`Firecrawl service is temporarily unavailable. Please try again later.`)
      } else {
        throw new Error(`Scrape failed: ${response.status} ${response.statusText} - ${errorText}`)
      }
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out after 5 minutes')
    }
    throw error
  }
}

async function processCrawlJob(job: Job, apiEndpoint: string) {
  const scrapeOptions = buildScrapeOptions(job.config)
  
  // Build v1 crawl options
  const crawlOptions: any = {
    url: job.url,
    limit: job.config.limit || 10,
    scrapeOptions,
  }

  // v1 crawl-specific options
  if (job.config.excludePaths && job.config.excludePaths.length > 0) {
    crawlOptions.excludePaths = job.config.excludePaths
  }

  if (job.config.includePaths && job.config.includePaths.length > 0) {
    crawlOptions.includePaths = job.config.includePaths
  }

  if (job.config.maxDepth !== undefined) {
    crawlOptions.maxDepth = job.config.maxDepth
  }

  if (job.config.maxDiscoveryDepth !== undefined) {
    crawlOptions.maxDiscoveryDepth = job.config.maxDiscoveryDepth
  }

  if (job.config.ignoreSitemap !== undefined) {
    crawlOptions.ignoreSitemap = job.config.ignoreSitemap
  }

  if (job.config.ignoreQueryParameters !== undefined) {
    crawlOptions.ignoreQueryParameters = job.config.ignoreQueryParameters
  }

  if (job.config.allowBackwardCrawling !== undefined) {
    crawlOptions.allowBackwardLinks = job.config.allowBackwardCrawling
  }

  if (job.config.crawlEntireDomain !== undefined) {
    crawlOptions.crawlEntireDomain = job.config.crawlEntireDomain
  }

  if (job.config.allowExternalContentLinks !== undefined) {
    crawlOptions.allowExternalLinks = job.config.allowExternalContentLinks
  }

  if (job.config.allowSubdomains !== undefined) {
    crawlOptions.allowSubdomains = job.config.allowSubdomains
  }

  if (job.config.delay !== undefined) {
    crawlOptions.delay = job.config.delay
  }

  if (job.config.maxConcurrency !== undefined) {
    crawlOptions.maxConcurrency = job.config.maxConcurrency
  }

  if (job.config.webhook) {
    crawlOptions.webhook = job.config.webhook
  }

  if (job.config.zeroDataRetention !== undefined) {
    crawlOptions.zeroDataRetention = job.config.zeroDataRetention
  }

  // Set a longer timeout for the fetch request (5 minutes)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

  try {
    const response = await fetch(`${apiEndpoint}/v1/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(crawlOptions),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      
      // Handle specific error cases with more user-friendly messages
      if (response.status === 408) {
        throw new Error(`Crawl request timed out. Try reducing the page limit or crawl depth settings.`)
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Please wait a moment before trying again.`)
      } else if (response.status >= 500) {
        throw new Error(`Firecrawl service is temporarily unavailable. Please try again later.`)
      } else {
        throw new Error(`Crawl failed: ${response.status} ${response.statusText} - ${errorText}`)
      }
    }

    const result = await response.json()

    // v1 API returns a job ID that we need to poll
    if (result.id) {
      return await pollCrawlJob(result.id, apiEndpoint)
    }

    return result.data || result
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Crawl request timed out after 5 minutes')
    }
    throw error
  }
}

async function processMapJob(job: Job, apiEndpoint: string) {
  // Build v1 map options
  const mapOptions: any = {
    url: job.url,
  }

  // Add v1 map-specific options
  if (job.config.search) {
    mapOptions.search = job.config.search
  }

  if (job.config.ignoreSitemap !== undefined) {
    mapOptions.ignoreSitemap = job.config.ignoreSitemap
  }

  if (job.config.allowSubdomains !== undefined) {
    mapOptions.includeSubdomains = job.config.allowSubdomains
  }

  if (job.config.limit !== undefined) {
    mapOptions.limit = job.config.limit
  }

  if (job.config.timeout !== undefined) {
    mapOptions.timeout = job.config.timeout * 1000 // Convert to milliseconds
  }

  // Add sitemapOnly option if provided
  if (job.config.sitemapOnly !== undefined) {
    mapOptions.sitemapOnly = job.config.sitemapOnly
  }

  // Set a timeout for the fetch request (2 minutes for map operations)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes

  try {
    const response = await fetch(`${apiEndpoint}/v1/map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapOptions),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      
      // Handle specific error cases with more user-friendly messages
      if (response.status === 408) {
        throw new Error(`Map request timed out. Try reducing the URL limit or timeout settings.`)
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Please wait a moment before trying again.`)
      } else if (response.status >= 500) {
        throw new Error(`Firecrawl service is temporarily unavailable. Please try again later.`)
      } else {
        throw new Error(`Map failed: ${response.status} ${response.statusText} - ${errorText}`)
      }
    }

    const result = await response.json()
    return result.links || result.data || result
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Map request timed out after 2 minutes')
    }
    throw error
  }
}

async function processBatchJob(job: Job, apiEndpoint: string) {
  const scrapeOptions = buildScrapeOptions(job.config)
  
  // Add batch-specific options
  const batchOptions: any = {
    urls: job.urls,
    ...scrapeOptions,
  }

  if (job.config.maxConcurrency) {
    batchOptions.maxConcurrency = job.config.maxConcurrency
  }

  if (job.config.ignoreInvalidURLs !== undefined) {
    batchOptions.ignoreInvalidURLs = job.config.ignoreInvalidURLs
  }

  // Set a longer timeout for the fetch request (5 minutes)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

  try {
    const response = await fetch(`${apiEndpoint}/v1/batch/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batchOptions),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      
      // Handle specific error cases with more user-friendly messages
      if (response.status === 408) {
        throw new Error(`Batch request timed out. Try reducing the number of URLs or timeout settings.`)
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Please wait a moment before trying again.`)
      } else if (response.status >= 500) {
        throw new Error(`Firecrawl service is temporarily unavailable. Please try again later.`)
      } else {
        throw new Error(`Batch scrape failed: ${response.status} ${response.statusText} - ${errorText}`)
      }
    }

    const result = await response.json()

    // v1 API returns a job ID that we need to poll
    if (result.id) {
      return await pollBatchJob(result.id, apiEndpoint)
    }

    return result.data || result
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Batch request timed out after 5 minutes')
    }
    throw error
  }
}

function buildScrapeOptions(config: JobConfig) {
  const options: any = {}

  // Output formats
  if (config.formats && config.formats.length > 0) {
    options.formats = config.formats
  }

  // Content filtering
  if (config.onlyMainContent !== undefined) {
    options.onlyMainContent = config.onlyMainContent
  }

  if (config.includeTags && config.includeTags.length > 0) {
    options.includeTags = config.includeTags
  }

  if (config.excludeTags && config.excludeTags.length > 0) {
    options.excludeTags = config.excludeTags
  }

  // Performance and behavior settings
  if (config.maxAge !== undefined) {
    options.maxAge = config.maxAge
  }

  if (config.headers && Object.keys(config.headers).length > 0) {
    options.headers = config.headers
  }

  if (config.waitFor && config.waitFor > 0) {
    options.waitFor = config.waitFor * 1000 // Convert to milliseconds
  }

  if (config.mobile !== undefined) {
    options.mobile = config.mobile
  }

  if (config.skipTlsVerification !== undefined) {
    options.skipTlsVerification = config.skipTlsVerification
  }

  if (config.timeout !== undefined) {
    options.timeout = config.timeout * 1000 // Convert to milliseconds
  }

  // Document processing
  if (config.parsePDF !== undefined) {
    options.parsePDF = config.parsePDF
  }

  if (config.removeBase64Images !== undefined) {
    options.removeBase64Images = config.removeBase64Images
  }

  if (config.blockAds !== undefined) {
    options.blockAds = config.blockAds
  }

  // Advanced options
  if (config.proxy) {
    options.proxy = config.proxy
  }

  if (config.storeInCache !== undefined) {
    options.storeInCache = config.storeInCache
  }

  if (config.zeroDataRetention !== undefined) {
    options.zeroDataRetention = config.zeroDataRetention
  }

  // LLM extraction
  if (config.llmExtraction?.enabled) {
    // Add 'extract' format to the formats array if LLM extraction is enabled
    if (!options.formats) {
      options.formats = ['markdown']
    }
    if (!options.formats.includes('extract')) {
      options.formats.push('extract')
    }
    
    // Set up extraction options
    options.extract = {
      schema: {}, // Empty schema for general extraction
    }
    
    if (config.llmExtraction.prompt) {
      options.extract.prompt = config.llmExtraction.prompt
    }
    
    if (config.llmExtraction.systemPrompt) {
      options.extract.systemPrompt = config.llmExtraction.systemPrompt
    }
  }

  return options
}

async function pollCrawlJob(crawlJobId: string, apiEndpoint: string) {
  const maxAttempts = 120 // 10 minutes with 5-second intervals
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${apiEndpoint}/v1/crawl/${crawlJobId}`)

      if (!response.ok) {
        throw new Error(`Failed to check crawl status: ${response.status}`)
      }

      const status = await response.json()

      if (status.status === "completed") {
        return status.data || []
      } else if (status.status === "failed") {
        throw new Error(status.error || "Crawl job failed")
      }

      // Wait 5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
    } catch (error) {
      throw error
    }
  }

  throw new Error("Crawl job timed out")
}

async function pollBatchJob(batchJobId: string, apiEndpoint: string) {
  const maxAttempts = 120 // 10 minutes with 5-second intervals
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${apiEndpoint}/v1/batch/scrape/${batchJobId}`)

      if (!response.ok) {
        throw new Error(`Failed to check batch status: ${response.status}`)
      }

      const status = await response.json()

      if (status.status === "completed") {
        return status.data || []
      } else if (status.status === "failed") {
        throw new Error(status.error || "Batch job failed")
      }

      // Wait 5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
    } catch (error) {
      throw error
    }
  }

  throw new Error("Batch job timed out")
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get("jobId")

  if (!jobId) {
    return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
  }

  const job = jobs.get(jobId)
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  return NextResponse.json(job)
}
