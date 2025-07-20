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
  location?: string
  tbs?: string
  filter?: string
  scrapeResults?: boolean
  search?: string
}

interface Job {
  id: string
  type: "scrape" | "crawl" | "map" | "batch"
  url?: string
  urls?: string[]
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

  const response = await fetch(`${apiEndpoint}/v0/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: job.url,
      ...scrapeOptions,
    }),
  })

  if (!response.ok) {
    throw new Error(`Scrape API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  return result.data || result
}

async function processCrawlJob(job: Job, apiEndpoint: string) {
  const scrapeOptions = buildScrapeOptions(job.config)
  const crawlOptions = {
    limit: job.config.limit || 10,
    allowBackwardCrawling: job.config.allowBackwardCrawling,
    allowExternalContentLinks: job.config.allowExternalContentLinks,
    ignoreSitemap: job.config.ignoreSitemap,
  }

  const response = await fetch(`${apiEndpoint}/v0/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: job.url,
      ...crawlOptions,
      scrapeOptions,
    }),
  })

  if (!response.ok) {
    throw new Error(`Crawl API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()

  // If it returns a job ID, poll for results
  if (result.jobId) {
    return await pollCrawlJob(result.jobId, apiEndpoint)
  }

  return result.data || result
}

async function processMapJob(job: Job, apiEndpoint: string) {
  const params = new URLSearchParams({ url: job.url! })
  if (job.config.search) {
    params.append("search", job.config.search)
  }

  const response = await fetch(`${apiEndpoint}/v0/map?${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  if (!response.ok) {
    throw new Error(`Map API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  return result.links || result.data || result
}

async function processBatchJob(job: Job, apiEndpoint: string) {
  const scrapeOptions = buildScrapeOptions(job.config)

  const response = await fetch(`${apiEndpoint}/v0/batch/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      urls: job.urls,
      ...scrapeOptions,
    }),
  })

  if (!response.ok) {
    throw new Error(`Batch API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()

  // If it returns a job ID, poll for results
  if (result.jobId) {
    return await pollCrawlJob(result.jobId, apiEndpoint)
  }

  return result.data || result
}

function buildScrapeOptions(config: JobConfig) {
  const options: any = {}

  if (config.formats && config.formats.length > 0) {
    options.formats = config.formats
  }

  if (config.includeTags && config.includeTags.length > 0) {
    options.includeTags = config.includeTags
  }

  if (config.excludeTags && config.excludeTags.length > 0) {
    options.excludeTags = config.excludeTags
  }

  if (config.waitFor && config.waitFor > 0) {
    options.waitFor = config.waitFor * 1000
  }

  return options
}

async function pollCrawlJob(crawlJobId: string, apiEndpoint: string) {
  const maxAttempts = 120 // 10 minutes with 5-second intervals
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${apiEndpoint}/v0/crawl/status/${crawlJobId}`)

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

  throw new Error("Job timed out")
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
