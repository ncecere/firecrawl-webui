"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Job } from "@/types/jobs"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { JobActions } from "./JobActions"
import { getJobDisplayName, getJobTarget, formatJobDate } from "@/lib/jobUtils"

interface JobCardProps {
  job: Job
  onViewDetails: (jobId: string) => void
  onRetry: (jobId: string) => void
}

/**
 * JobCard component displays individual job information with actions
 * Memoized to prevent unnecessary re-renders when parent updates
 */
export const JobCard = React.memo<JobCardProps>(({ job, onViewDetails, onRetry }) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="flex items-center space-x-1">
          <StatusBadge status={job.status} />
          <Badge variant="outline" className="text-xs capitalize">
            {job.type}
          </Badge>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {getJobDisplayName(job)}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {getJobTarget(job)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatJobDate(job.createdAt)}
          </p>
        </div>
      </div>
      <JobActions 
        job={job} 
        onViewDetails={onViewDetails} 
        onRetry={onRetry} 
      />
    </div>
  )
})

JobCard.displayName = 'JobCard'
