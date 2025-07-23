"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Job } from "@/types/jobs"
import { JobCard } from "./JobCard"

interface JobListProps {
  jobs: Job[]
  onViewDetails: (jobId: string) => void
  onRetry: (jobId: string) => void
  onClearAll: () => void
  maxDisplayJobs?: number
}

export function JobList({ 
  jobs, 
  onViewDetails, 
  onRetry, 
  onClearAll, 
  maxDisplayJobs = 10 
}: JobListProps) {
  const displayJobs = jobs.slice(0, maxDisplayJobs)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Jobs</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearAll} 
            disabled={jobs.length === 0}
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No jobs yet</p>
            <p className="text-sm">Start a scraping job to see it here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {displayJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onViewDetails={onViewDetails}
                onRetry={onRetry}
              />
            ))}
            {jobs.length > maxDisplayJobs && (
              <div className="text-center py-2 text-sm text-muted-foreground">
                Showing {maxDisplayJobs} of {jobs.length} jobs
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
