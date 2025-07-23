"use client"

import { useCallback, useState } from "react"
import { Job } from "@/types/jobs"
import { downloadJsonResults, downloadZipFiles, copyMapResults } from "@/lib/fileUtils"

interface UseFileDownloadReturn {
  isDownloading: boolean
  error: string | null
  downloadJson: (job: Job) => Promise<void>
  downloadZip: (job: Job) => Promise<void>
  copyUrls: (job: Job) => Promise<void>
  clearError: () => void
}

export const useFileDownload = (): UseFileDownloadReturn => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const downloadJson = useCallback(async (job: Job) => {
    if (!job.data || job.data.length === 0) {
      setError("No data available to download")
      return
    }

    setIsDownloading(true)
    setError(null)

    try {
      downloadJsonResults(job)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download JSON")
    } finally {
      setIsDownloading(false)
    }
  }, [])

  const downloadZip = useCallback(async (job: Job) => {
    if (!job.data || job.data.length === 0) {
      setError("No data available to download")
      return
    }

    if (job.type === "map") {
      setError("ZIP download is not available for map jobs")
      return
    }

    if (!job.config.formats || job.config.formats.length === 0) {
      setError("No formats selected for download")
      return
    }

    setIsDownloading(true)
    setError(null)

    try {
      await downloadZipFiles(job)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download ZIP")
    } finally {
      setIsDownloading(false)
    }
  }, [])

  const copyUrls = useCallback(async (job: Job) => {
    if (job.type !== "map") {
      setError("URL copying is only available for map jobs")
      return
    }

    if (!job.data || job.data.length === 0) {
      setError("No URLs available to copy")
      return
    }

    setIsDownloading(true)
    setError(null)

    try {
      await copyMapResults(job)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy URLs")
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return {
    isDownloading,
    error,
    downloadJson,
    downloadZip,
    copyUrls,
    clearError,
  }
}

// Hook for batch file operations
export const useBatchFileDownload = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const downloadMultipleJobs = useCallback(async (
    jobs: Job[],
    format: 'json' | 'zip' = 'json'
  ) => {
    if (jobs.length === 0) {
      setError("No jobs selected for download")
      return
    }

    setIsProcessing(true)
    setError(null)
    setProgress(0)

    try {
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i]
        
        if (format === 'json') {
          downloadJsonResults(job)
        } else {
          await downloadZipFiles(job)
        }
        
        setProgress(((i + 1) / jobs.length) * 100)
        
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download files")
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isProcessing,
    progress,
    error,
    downloadMultipleJobs,
    clearError,
  }
}

// Hook for file validation before download
export const useFileValidation = () => {
  const validateJobForDownload = useCallback((job: Job, format: 'json' | 'zip' | 'urls') => {
    const errors: string[] = []

    // Check if job has data
    if (!job.data || job.data.length === 0) {
      errors.push("No data available for download")
    }

    // Check job status
    if (job.status !== "completed") {
      errors.push("Job must be completed before downloading")
    }

    // Format-specific validations
    switch (format) {
      case 'zip':
        if (job.type === "map") {
          errors.push("ZIP download is not available for map jobs")
        }
        if (!job.config.formats || job.config.formats.length === 0) {
          errors.push("No output formats selected")
        }
        break
      
      case 'urls':
        if (job.type !== "map") {
          errors.push("URL copying is only available for map jobs")
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }, [])

  const validateJobsForBatchDownload = useCallback((jobs: Job[]) => {
    if (jobs.length === 0) {
      return {
        isValid: false,
        errors: ["No jobs selected"],
        validJobs: [],
        invalidJobs: [],
      }
    }

    const validJobs: Job[] = []
    const invalidJobs: { job: Job; errors: string[] }[] = []

    jobs.forEach(job => {
      const validation = validateJobForDownload(job, 'json')
      if (validation.isValid) {
        validJobs.push(job)
      } else {
        invalidJobs.push({ job, errors: validation.errors })
      }
    })

    return {
      isValid: validJobs.length > 0,
      errors: invalidJobs.length > 0 ? [`${invalidJobs.length} jobs have issues`] : [],
      validJobs,
      invalidJobs,
    }
  }, [validateJobForDownload])

  return {
    validateJobForDownload,
    validateJobsForBatchDownload,
  }
}

// Hook for download history and preferences
export const useDownloadPreferences = () => {
  const [preferences, setPreferences] = useState({
    defaultFormat: 'json' as 'json' | 'zip',
    autoDownload: false,
    showConfirmation: true,
    maxConcurrentDownloads: 3,
  })

  const updatePreference = useCallback(<K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferences({
      defaultFormat: 'json',
      autoDownload: false,
      showConfirmation: true,
      maxConcurrentDownloads: 3,
    })
  }, [])

  return {
    preferences,
    updatePreference,
    resetPreferences,
  }
}
