'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, Download, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { JobDetails } from '@/components/jobs/JobDetails'
import { JobActions } from '@/components/jobs/JobActions'
import type { JobRun, ScheduledJob } from '@/lib/db/schema'

interface RunHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleId: string
  scheduleName: string
}

interface JobRunWithData extends Omit<JobRun, 'resultData'> {
  resultData?: any
  scheduledJob: ScheduledJob
}

export function RunHistoryDialog({ 
  open, 
  onOpenChange, 
  scheduleId, 
  scheduleName 
}: RunHistoryDialogProps) {
  const [runs, setRuns] = useState<JobRunWithData[]>([])
  const [selectedRun, setSelectedRun] = useState<JobRunWithData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && scheduleId) {
      fetchJobRuns()
    }
  }, [open, scheduleId])

  const fetchJobRuns = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/runs`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch job runs')
      }
      
      const data = await response.json()
      setRuns(data.runs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job runs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'running':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    }
  }

  const formatDuration = (ms?: number | null) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const convertRunToJob = (run: JobRunWithData) => {
    // Convert job run to the Job format expected by JobDetails and JobActions
    const scheduledJob = run.scheduledJob
    const jobConfig = scheduledJob.jobConfig as any
    
    const baseJobData = {
      id: run.id,
      status: run.status as 'pending' | 'running' | 'completed' | 'failed',
      data: run.resultData || [],
      error: run.errorMessage || undefined,
      createdAt: run.startedAt,
      config: {
        name: scheduledJob.name,
        formats: jobConfig.formats || ['markdown'],
        ...jobConfig, // Include all original job config
      },
    }

    // Return properly typed job based on job type
    if (scheduledJob.jobType === 'batch') {
      return {
        ...baseJobData,
        type: 'batch' as const,
        urls: scheduledJob.urls ? JSON.parse(scheduledJob.urls as string) : [],
      }
    } else if (scheduledJob.jobType === 'scrape') {
      return {
        ...baseJobData,
        type: 'scrape' as const,
        url: scheduledJob.url || '',
      }
    } else if (scheduledJob.jobType === 'crawl') {
      return {
        ...baseJobData,
        type: 'crawl' as const,
        url: scheduledJob.url || '',
      }
    } else if (scheduledJob.jobType === 'map') {
      return {
        ...baseJobData,
        type: 'map' as const,
        url: scheduledJob.url || '',
      }
    } else {
      // Fallback to scrape type
      return {
        ...baseJobData,
        type: 'scrape' as const,
        url: scheduledJob.url || '',
      }
    }
  }

  if (selectedRun) {
    const jobData = convertRunToJob(selectedRun)
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Job Run Details</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {scheduleName} • {formatDistanceToNow(new Date(selectedRun.startedAt), { addSuffix: true })}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedRun(null)}
              >
                Back to History
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Run Metadata */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedRun.status)}
                <Badge className={getStatusColor(selectedRun.status)}>
                  {selectedRun.status}
                </Badge>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Duration: {formatDuration(selectedRun.executionTimeMs)}
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {selectedRun.runType === 'manual' ? 'Manual Run' : 'Scheduled Run'}
              </div>
            </div>

            {/* Error Message */}
            {selectedRun.errorMessage && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-500 font-medium mb-2">
                  <XCircle className="h-4 w-4" />
                  Error
                </div>
                <p className="text-sm text-red-600">{selectedRun.errorMessage}</p>
              </div>
            )}

            {/* Job Results */}
            <div className="flex-1 overflow-hidden">
              {selectedRun.resultData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Results</h3>
                    <JobActions 
                      job={jobData}
                      onViewDetails={() => {}} // Not applicable for historical runs
                      onRetry={() => {}} // Not applicable for historical runs
                    />
                  </div>
                  <JobDetails 
                    job={jobData} 
                    onClose={() => setSelectedRun(null)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No result data available
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Run History</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Execution history for "{scheduleName}"
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          {!loading && !error && runs.length === 0 && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No job runs found
            </div>
          )}

          {!loading && !error && runs.length > 0 && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedRun(run)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        <Badge className={getStatusColor(run.status)}>
                          {run.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDuration(run.executionTimeMs)} • {run.runType}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {run.resultData && (
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
