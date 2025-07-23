"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, CheckCircle, XCircle } from "lucide-react"
import { JobStatus } from "@/types/jobs"
import { getStatusBadgeVariant, getStatusBadgeClasses } from "@/lib/jobUtils"

interface StatusBadgeProps {
  status: JobStatus
  showIcon?: boolean
  className?: string
}

/**
 * StatusBadge component displays job status with icon and styling
 * Memoized to prevent unnecessary re-renders
 */
export const StatusBadge = React.memo<StatusBadgeProps>(({ status, showIcon = true, className }) => {
  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />
      case "running":
        return <Loader2 className="h-3 w-3 animate-spin" />
      case "completed":
        return <CheckCircle className="h-3 w-3" />
      case "failed":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  return (
    <Badge 
      variant={getStatusBadgeVariant(status)} 
      className={`${getStatusBadgeClasses(status)} ${className || ''}`}
    >
      {showIcon && getStatusIcon()}
      <span className={showIcon ? "ml-1" : ""}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </Badge>
  )
})

StatusBadge.displayName = 'StatusBadge'
