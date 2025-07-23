"use client"

import { useState, useEffect, useCallback } from "react"
import { Job, JobUpdatePayload, JobStats } from "@/types/jobs"
import { STORAGE_KEYS, STORAGE_LIMITS } from "@/constants/apiEndpoints"
import { calculateJobStats, isJobActive } from "@/lib/jobUtils"
import { getJobStatus } from "@/lib/apiClient"

interface UseJobsOptions {
  apiEndpoint: string
  enablePolling?: boolean
  pollingInterval?: number
}

interface UseJobsReturn {
  jobs: Job[]
  stats: JobStats
  isLoading: boolean
  error: string | null
  addJob: (job: Job) => void
  updateJob: (jobId: string, updates: JobUpdatePayload) => void
  removeJob: (jobId: string) => void
  clearAllJobs: () => void
  retryJob: (jobId: string) => Promise<void>
  refreshJob: (jobId: string) => Promise<void>
}

export const useJobs = ({ 
  apiEndpoint, 
  enablePolling = true, 
  pollingInterval = 3000 
}: UseJobsOptions): UseJobsReturn => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load jobs from localStorage on mount
  useEffect(() => {
    try {
      const savedJobs = localStorage.getItem(STORAGE_KEYS.JOBS)
      if (savedJobs) {
        const parsedJobs = JSON.parse(savedJobs) as Job[]
        setJobs(parsedJobs)
      }
    } catch (err) {
      console.error('Failed to load jobs from localStorage:', err)
      setError('Failed to load saved jobs')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save jobs to localStorage with optimization
  const saveJobsToStorage = useCallback((jobsToSave: Job[]) => {
    try {
      // Keep only the most recent jobs within limit
      const jobsToStore = jobsToSave.slice(0, STORAGE_LIMITS.MAX_JOBS)
      
      // For completed jobs with large data, store only metadata and first few results
      const optimizedJobs = jobsToStore.map(job => {
        if (job.status === 'completed' && job.data && job.data.length > STORAGE_LIMITS.MAX_RESULTS_PER_JOB) {
          return {
            ...job,
            data: job.data.slice(0, STORAGE_LIMITS.MAX_RESULTS_PER_JOB),
            _originalDataLength: job.data.length
          } as Job & { _originalDataLength: number }
        }
        return job
      })
      
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(optimizedJobs))
    } catch (err) {
      console.warn('Failed to save jobs to localStorage:', err)
      
      // If storage is full, clear old jobs and try again
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        try {
          // Keep only the most recent jobs and retry
          const recentJobs = jobsToSave.slice(0, STORAGE_LIMITS.RETRY_LIMIT).map(job => ({
            ...job,
            data: job.data ? job.data.slice(0, 3) : undefined,
            _originalDataLength: job.data?.length
          }))
          localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(recentJobs))
        } catch (retryError) {
          console.error('Failed to save even reduced jobs:', retryError)
          // As last resort, clear all stored jobs
          localStorage.removeItem(STORAGE_KEYS.JOBS)
        }
      }
    }
  }, [])

  // Save jobs whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveJobsToStorage(jobs)
    }
  }, [jobs, isLoading, saveJobsToStorage])

  // Polling for active jobs
  useEffect(() => {
    if (!enablePolling) return

    const activeJobs = jobs.filter(isJobActive)
    if (activeJobs.length === 0) return

    const pollInterval = setInterval(async () => {
      for (const job of activeJobs) {
        try {
          const response = await getJobStatus(job.id, apiEndpoint)
          if (response.success && response.data) {
            updateJob(job.id, {
              status: response.data.status,
              data: response.data.data,
              error: response.data.error,
            })
          }
        } catch (error) {
          console.error(`Failed to poll job ${job.id}:`, error)
        }
      }
    }, pollingInterval)

    return () => clearInterval(pollInterval)
  }, [jobs, apiEndpoint, enablePolling, pollingInterval])

  // Add a new job
  const addJob = useCallback((job: Job) => {
    setJobs(prev => [job, ...prev])
  }, [])

  // Update an existing job
  const updateJob = useCallback((jobId: string, updates: JobUpdatePayload) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ))
  }, [])

  // Remove a job
  const removeJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId))
  }, [])

  // Clear all jobs
  const clearAllJobs = useCallback(() => {
    setJobs([])
    localStorage.removeItem(STORAGE_KEYS.JOBS)
  }, [])

  // Retry a failed job
  const retryJob = useCallback(async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    updateJob(jobId, { status: "pending", error: undefined })

    try {
      const response = await fetch("/api/firecrawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: job.id,
          type: job.type,
          url: 'url' in job ? job.url : undefined,
          urls: 'urls' in job ? job.urls : undefined,
          config: job.config,
          apiEndpoint,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      updateJob(jobId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Failed to retry job",
      })
    }
  }, [jobs, apiEndpoint, updateJob])

  // Refresh a single job's status
  const refreshJob = useCallback(async (jobId: string) => {
    try {
      const response = await getJobStatus(jobId, apiEndpoint)
      if (response.success && response.data) {
        updateJob(jobId, {
          status: response.data.status,
          data: response.data.data,
          error: response.data.error,
        })
      }
    } catch (error) {
      console.error(`Failed to refresh job ${jobId}:`, error)
      setError(`Failed to refresh job: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [apiEndpoint, updateJob])

  // Calculate statistics
  const stats = calculateJobStats(jobs)

  return {
    jobs,
    stats,
    isLoading,
    error,
    addJob,
    updateJob,
    removeJob,
    clearAllJobs,
    retryJob,
    refreshJob,
  }
}
