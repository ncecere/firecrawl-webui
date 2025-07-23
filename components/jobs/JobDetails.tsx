"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Job } from "@/types/jobs"
import { getJobDisplayName, getJobTarget, getJobResultCount } from "@/lib/jobUtils"

interface JobDetailsProps {
  job: Job
  onClose: () => void
}

export function JobDetails({ job, onClose }: JobDetailsProps) {
  const resultCount = getJobResultCount(job)
  const originalDataLength = (job as any)._originalDataLength

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Job Results: {getJobDisplayName(job)}</CardTitle>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <CardDescription>
          {getJobTarget(job)} • {originalDataLength || resultCount} items
          {originalDataLength && originalDataLength > resultCount && 
            ` (showing first ${resultCount})`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {job.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{job.error}</AlertDescription>
          </Alert>
        )}

        {job.data && job.data.length > 0 && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {job.data.slice(0, 5).map((item: any, index: number) => {
              // Handle map results (which are just URL strings)
              if (job.type === "map" && typeof item === "string") {
                const url = item;
                const urlObj = new URL(url);
                const displayTitle = urlObj.pathname === "/" 
                  ? urlObj.hostname 
                  : urlObj.pathname.split('/').filter(Boolean).pop() || urlObj.hostname;
                
                return (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="text-sm font-medium truncate">{displayTitle}</div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate block"
                    >
                      {url}
                    </a>
                  </div>
                );
              }
              
              // Handle scrape/crawl/batch results (which are objects with metadata)
              return (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="text-sm font-medium truncate">
                    {item.metadata?.title || item.title || "No title"}
                  </div>
                  <a
                    href={item.metadata?.sourceURL || item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate block"
                  >
                    {item.metadata?.sourceURL || item.url}
                  </a>
                  {item.markdown && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.markdown.substring(0, 100)}...
                    </p>
                  )}
                </div>
              );
            })}
            {job.data.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                And {job.data.length - 5} more items...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
