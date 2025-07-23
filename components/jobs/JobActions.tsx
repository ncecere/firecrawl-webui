"use client"

import { Button } from "@/components/ui/button"
import { Eye, Download, Archive, Copy, RefreshCw } from "lucide-react"
import { Job } from "@/types/jobs"
import { useFileDownload } from "@/hooks/useFileDownload"

interface JobActionsProps {
  job: Job
  onViewDetails: (jobId: string) => void
  onRetry: (jobId: string) => void
}

export function JobActions({ job, onViewDetails, onRetry }: JobActionsProps) {
  const { downloadJson, downloadZip, copyUrls } = useFileDownload()

  const handleDownloadJson = () => {
    downloadJson(job)
  }

  const handleDownloadZip = () => {
    downloadZip(job)
  }

  const handleCopyUrls = () => {
    copyUrls(job)
  }

  // Show actions based on job status and type
  if (job.status === "completed" && job.data) {
    return (
      <div className="flex items-center space-x-1">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => onViewDetails(job.id)}
          title="View Details"
        >
          <Eye className="h-3 w-3" />
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleDownloadJson}
          title="Download JSON"
        >
          <Download className="h-3 w-3" />
        </Button>
        
        {job.type === "map" && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleCopyUrls}
            title="Copy URL List"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        
        {(job.type === "scrape" || job.type === "crawl" || job.type === "batch") && 
         job.config.formats && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDownloadZip}
            title="Download ZIP"
          >
            <Archive className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  if (job.status === "failed") {
    return (
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={() => onRetry(job.id)}
        title="Retry Job"
      >
        <RefreshCw className="h-3 w-3" />
      </Button>
    )
  }

  return null
}
