import { CreateJobRequest, JobStatusResponse, ApiResponse } from "@/types/api"
import { Job, JobType } from "@/types/jobs"

// Base API client class
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Create a new job
  async createJob(payload: CreateJobRequest): Promise<ApiResponse<{ jobId: string }>> {
    return this.request('/firecrawl', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  // Get job status
  async getJobStatus(jobId: string, apiEndpoint: string): Promise<ApiResponse<JobStatusResponse>> {
    return this.request(`/firecrawl?jobId=${jobId}&apiEndpoint=${encodeURIComponent(apiEndpoint)}`)
  }

  // Retry a failed job
  async retryJob(job: Job, apiEndpoint: string): Promise<ApiResponse<{ jobId: string }>> {
    const payload: CreateJobRequest = {
      jobId: job.id,
      type: job.type,
      config: job.config,
      apiEndpoint,
    }

    // Add URL or URLs based on job type
    if ('url' in job) {
      payload.url = job.url
    }
    if ('urls' in job) {
      payload.urls = job.urls
    }

    return this.createJob(payload)
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Utility functions for direct API calls
export const createJob = async (
  type: JobType,
  config: any,
  apiEndpoint: string,
  url?: string,
  urls?: string[]
): Promise<ApiResponse<{ jobId: string }>> => {
  const jobId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const payload: CreateJobRequest = {
    jobId,
    type,
    config,
    apiEndpoint,
  }

  if (url) payload.url = url
  if (urls) payload.urls = urls

  return apiClient.createJob(payload)
}

export const getJobStatus = async (
  jobId: string,
  apiEndpoint: string
): Promise<ApiResponse<JobStatusResponse>> => {
  return apiClient.getJobStatus(jobId, apiEndpoint)
}

export const retryJob = async (
  job: Job,
  apiEndpoint: string
): Promise<ApiResponse<{ jobId: string }>> => {
  return apiClient.retryJob(job, apiEndpoint)
}

// Polling utility for job status
export const pollJobStatus = async (
  jobId: string,
  apiEndpoint: string,
  onUpdate: (job: JobStatusResponse) => void,
  maxAttempts: number = 120,
  interval: number = 3000
): Promise<JobStatusResponse> => {
  let attempts = 0

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await getJobStatus(jobId, apiEndpoint)
        
        if (!response.success) {
          reject(new Error(response.error || 'Failed to get job status'))
          return
        }

        const job = response.data!
        onUpdate(job)

        if (job.status === 'completed' || job.status === 'failed') {
          resolve(job)
          return
        }

        attempts++
        if (attempts >= maxAttempts) {
          reject(new Error('Job polling timed out'))
          return
        }

        setTimeout(poll, interval)
      } catch (error) {
        reject(error)
      }
    }

    poll()
  })
}

// Batch job status polling
export const pollMultipleJobs = async (
  jobs: { id: string; apiEndpoint: string }[],
  onUpdate: (jobId: string, job: JobStatusResponse) => void,
  maxAttempts: number = 120,
  interval: number = 3000
): Promise<void> => {
  const activeJobs = new Set(jobs.map(j => j.id))
  let attempts = 0

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const promises = jobs
          .filter(j => activeJobs.has(j.id))
          .map(async (job) => {
            const response = await getJobStatus(job.id, job.apiEndpoint)
            if (response.success && response.data) {
              onUpdate(job.id, response.data)
              
              if (response.data.status === 'completed' || response.data.status === 'failed') {
                activeJobs.delete(job.id)
              }
            }
          })

        await Promise.all(promises)

        if (activeJobs.size === 0) {
          resolve()
          return
        }

        attempts++
        if (attempts >= maxAttempts) {
          reject(new Error('Job polling timed out'))
          return
        }

        setTimeout(poll, interval)
      } catch (error) {
        reject(error)
      }
    }

    poll()
  })
}

// Validate API endpoint
export const validateApiEndpoint = async (endpoint: string): Promise<boolean> => {
  try {
    const response = await fetch(`${endpoint}/health`, {
      method: 'GET',
      timeout: 5000,
    } as any)
    return response.ok
  } catch {
    return false
  }
}

// Error handling utilities
export const handleApiError = (error: any): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

export const isNetworkError = (error: any): boolean => {
  return error instanceof TypeError && error.message.includes('fetch')
}

export const isTimeoutError = (error: any): boolean => {
  return error instanceof Error && error.message.includes('timeout')
}
