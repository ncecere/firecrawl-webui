import type { ScheduledJob } from '../db/schema'

// Execute a scheduled job by calling the Firecrawl API directly
export async function executeScheduledJob(job: ScheduledJob): Promise<any> {
  const apiEndpoint = job.apiEndpoint
  
  try {
    let result: any

    switch (job.jobType) {
      case 'scrape':
        result = await executeScrapeJob(job, apiEndpoint)
        break
      case 'crawl':
        result = await executeCrawlJob(job, apiEndpoint)
        break
      case 'map':
        result = await executeMapJob(job, apiEndpoint)
        break
      case 'batch':
        result = await executeBatchJob(job, apiEndpoint)
        break
      default:
        throw new Error(`Unknown job type: ${job.jobType}`)
    }

    return result
  } catch (error) {
    console.error(`Failed to execute scheduled job ${job.id}:`, error)
    throw error
  }
}

async function executeScrapeJob(job: ScheduledJob, apiEndpoint: string) {
  const config = job.jobConfig as any
  const scrapeOptions = buildScrapeOptions(config)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

  try {
    const response = await fetch(`${apiEndpoint}/v1/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: job.url,
        ...scrapeOptions,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Scrape failed: ${response.status} ${response.statusText} - ${errorText}`)
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

async function executeCrawlJob(job: ScheduledJob, apiEndpoint: string) {
  const config = job.jobConfig as any
  const scrapeOptions = buildScrapeOptions(config)
  
  const crawlOptions: any = {
    url: job.url,
    limit: config.limit || 10,
    scrapeOptions,
  }

  // Add crawl-specific options
  if (config.excludePaths && config.excludePaths.length > 0) {
    crawlOptions.excludePaths = config.excludePaths
  }
  if (config.includePaths && config.includePaths.length > 0) {
    crawlOptions.includePaths = config.includePaths
  }
  if (config.maxDepth !== undefined) {
    crawlOptions.maxDepth = config.maxDepth
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

  try {
    const response = await fetch(`${apiEndpoint}/v1/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crawlOptions),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Crawl failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()

    // If it returns a job ID, poll for completion
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

async function executeMapJob(job: ScheduledJob, apiEndpoint: string) {
  const config = job.jobConfig as any
  
  const mapOptions: any = {
    url: job.url,
  }

  if (config.search) {
    mapOptions.search = config.search
  }
  if (config.limit !== undefined) {
    mapOptions.limit = config.limit
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes

  try {
    const response = await fetch(`${apiEndpoint}/v1/map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapOptions),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Map failed: ${response.status} ${response.statusText} - ${errorText}`)
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

async function executeBatchJob(job: ScheduledJob, apiEndpoint: string) {
  const config = job.jobConfig as any
  const scrapeOptions = buildScrapeOptions(config)
  
  const batchOptions: any = {
    urls: job.urls,
    ...scrapeOptions,
  }

  if (config.maxConcurrency) {
    batchOptions.maxConcurrency = config.maxConcurrency
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

  try {
    const response = await fetch(`${apiEndpoint}/v1/batch/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchOptions),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Batch scrape failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()

    // If it returns a job ID, poll for completion
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

function buildScrapeOptions(config: any) {
  const options: any = {}

  if (config.formats && config.formats.length > 0) {
    options.formats = config.formats
  }
  if (config.onlyMainContent !== undefined) {
    options.onlyMainContent = config.onlyMainContent
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
  if (config.timeout !== undefined) {
    options.timeout = config.timeout * 1000
  }

  return options
}

async function pollCrawlJob(crawlJobId: string, apiEndpoint: string) {
  const maxAttempts = 120
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${apiEndpoint}/v1/crawl/${crawlJobId}`)

      if (!response.ok) {
        throw new Error(`Failed to check crawl status: ${response.status}`)
      }

      const status = await response.json()

      if (status.status === 'completed') {
        return status.data || []
      } else if (status.status === 'failed') {
        throw new Error(status.error || 'Crawl job failed')
      }

      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
    } catch (error) {
      throw error
    }
  }

  throw new Error('Crawl job timed out')
}

async function pollBatchJob(batchJobId: string, apiEndpoint: string) {
  const maxAttempts = 120
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${apiEndpoint}/v1/batch/scrape/${batchJobId}`)

      if (!response.ok) {
        throw new Error(`Failed to check batch status: ${response.status}`)
      }

      const status = await response.json()

      if (status.status === 'completed') {
        return status.data || []
      } else if (status.status === 'failed') {
        throw new Error(status.error || 'Batch job failed')
      }

      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
    } catch (error) {
      throw error
    }
  }

  throw new Error('Batch job timed out')
}
