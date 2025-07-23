import { Job, JobStatus, JobStats } from "@/types/jobs"

/**
 * Generate a unique job ID with timestamp and random suffix
 * @param type - The job type (scrape, crawl, map, batch)
 * @returns A unique job identifier string
 */
export const generateJobId = (type: string): string => {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get the appropriate Lucide icon name for a job status
 * @param status - The job status
 * @returns The icon component name as a string
 */
export const getStatusIcon = (status: JobStatus): string => {
  switch (status) {
    case "pending":
      return "Clock"
    case "running":
      return "Loader2"
    case "completed":
      return "CheckCircle"
    case "failed":
      return "XCircle"
    default:
      return "Clock"
  }
}

/**
 * Get Tailwind CSS color classes for a job status
 * @param status - The job status
 * @returns CSS color class string
 */
export const getStatusColor = (status: JobStatus): string => {
  switch (status) {
    case "pending":
      return "text-yellow-500"
    case "running":
      return "text-blue-500"
    case "completed":
      return "text-green-500"
    case "failed":
      return "text-red-500"
    default:
      return "text-gray-500"
  }
}

// Get status badge variant
export const getStatusBadgeVariant = (status: JobStatus): "default" | "secondary" | "destructive" => {
  switch (status) {
    case "pending":
      return "secondary"
    case "running":
      return "default"
    case "completed":
      return "default"
    case "failed":
      return "destructive"
    default:
      return "secondary"
  }
}

// Get status badge classes
export const getStatusBadgeClasses = (status: JobStatus): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "running":
      return "bg-blue-100 text-blue-800"
    case "completed":
      return "bg-green-100 text-green-800"
    case "failed":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

/**
 * Calculate statistics for a collection of jobs
 * @param jobs - Array of jobs to analyze
 * @returns JobStats object with counts for each status
 */
export const calculateJobStats = (jobs: Job[]): JobStats => {
  return jobs.reduce(
    (stats, job) => {
      stats.total++
      switch (job.status) {
        case "pending":
          stats.pending++
          break
        case "running":
          stats.running++
          break
        case "completed":
          stats.completed++
          break
        case "failed":
          stats.failed++
          break
      }
      return stats
    },
    { total: 0, pending: 0, running: 0, completed: 0, failed: 0 }
  )
}

// Check if job is active (running or pending)
export const isJobActive = (job: Job): boolean => {
  return job.status === "running" || job.status === "pending"
}

// Check if job is completed
export const isJobCompleted = (job: Job): boolean => {
  return job.status === "completed"
}

// Check if job has failed
export const isJobFailed = (job: Job): boolean => {
  return job.status === "failed"
}

// Get job display name
export const getJobDisplayName = (job: Job): string => {
  return job.config.name || `${job.type.charAt(0).toUpperCase() + job.type.slice(1)} Job`
}

// Get job target display (URL or URL count)
export const getJobTarget = (job: Job): string => {
  if ('url' in job) return job.url
  if ('urls' in job) return `${job.urls.length} URLs`
  return 'Unknown target'
}

// Format job creation date
export const formatJobDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString()
}

// Get job duration (if completed)
export const getJobDuration = (job: Job): string | null => {
  if (job.status !== "completed") return null
  
  const start = new Date(job.createdAt)
  const end = new Date() // Assuming completion time is now for simplicity
  const duration = end.getTime() - start.getTime()
  
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

// Validate URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Validate batch URLs
export const validateBatchUrls = (urls: string[]): { valid: string[], invalid: string[] } => {
  const valid: string[] = []
  const invalid: string[] = []
  
  urls.forEach(url => {
    if (isValidUrl(url)) {
      valid.push(url)
    } else {
      invalid.push(url)
    }
  })
  
  return { valid, invalid }
}

// Parse batch URLs from text
export const parseBatchUrls = (text: string): string[] => {
  return text
    .split('\n')
    .map(url => url.trim())
    .filter(Boolean)
}

// Get job type icon
export const getJobTypeIcon = (type: string): string => {
  switch (type) {
    case "scrape":
      return "Globe"
    case "crawl":
      return "Link"
    case "batch":
      return "Layers"
    case "map":
      return "Map"
    default:
      return "FileText"
  }
}

// Sort jobs by different criteria
export const sortJobs = (jobs: Job[], sortBy: string, order: 'asc' | 'desc' = 'desc'): Job[] => {
  return [...jobs].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortBy) {
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'type':
        aValue = a.type
        bValue = b.type
        break
      case 'name':
        aValue = getJobDisplayName(a).toLowerCase()
        bValue = getJobDisplayName(b).toLowerCase()
        break
      default:
        aValue = a.createdAt
        bValue = b.createdAt
    }
    
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return order === 'asc' ? comparison : -comparison
  })
}

// Filter jobs by status
export const filterJobsByStatus = (jobs: Job[], status: string): Job[] => {
  if (status === 'all') return jobs
  return jobs.filter(job => job.status === status)
}

// Search jobs by text
export const searchJobs = (jobs: Job[], searchTerm: string): Job[] => {
  if (!searchTerm.trim()) return jobs
  
  const term = searchTerm.toLowerCase()
  return jobs.filter(job => {
    const name = getJobDisplayName(job).toLowerCase()
    const target = getJobTarget(job).toLowerCase()
    const type = job.type.toLowerCase()
    
    return name.includes(term) || target.includes(term) || type.includes(term)
  })
}

// Get job result count
export const getJobResultCount = (job: Job): number => {
  return job.data?.length || 0
}

// Check if job has results
export const hasJobResults = (job: Job): boolean => {
  return job.status === "completed" && (job.data?.length || 0) > 0
}

// Get job error message
export const getJobErrorMessage = (job: Job): string | null => {
  return job.status === "failed" ? job.error || "Unknown error occurred" : null
}
