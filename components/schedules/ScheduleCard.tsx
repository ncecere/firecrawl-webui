"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Trash2, 
  Clock, 
  Globe, 
  Link, 
  Layers, 
  Map,
  Calendar,
  Timer,
  Repeat,
  MoreHorizontal,
  Eye,
  Edit,
  Copy
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import type { ScheduledJob } from '@/lib/db/schema'

interface ScheduledJobWithStatus extends ScheduledJob {
  lastRunStatus?: 'success' | 'failed' | 'running'
}

interface ScheduleCardProps {
  schedule: ScheduledJobWithStatus
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
  onRunNow: (id: string) => void
  onViewDetails: (id: string) => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
}

const JOB_TYPE_ICONS = {
  scrape: Globe,
  crawl: Link,
  batch: Layers,
  map: Map
}

const SCHEDULE_TYPE_ICONS = {
  interval: Timer,
  hourly: Clock,
  daily: Calendar,
  weekly: Repeat,
  monthly: Calendar
}

const JOB_TYPE_LABELS = {
  scrape: 'Single Scrape',
  crawl: 'Website Crawl',
  batch: 'Batch Scrape',
  map: 'Site Map'
}

const formatScheduleDescription = (scheduleType: string, scheduleConfig: any) => {
  switch (scheduleType) {
    case 'interval':
      return `Every ${scheduleConfig.interval} ${scheduleConfig.unit}`
    case 'hourly':
      return 'Every hour'
    case 'daily':
      return `Daily at ${scheduleConfig.time || '09:00'}`
    case 'weekly':
      const days = scheduleConfig.days || []
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const selectedDays = days.map((d: number) => dayNames[d]).join(', ')
      return `Weekly on ${selectedDays} at ${scheduleConfig.time || '09:00'}`
    case 'monthly':
      return `Monthly on day ${scheduleConfig.date || 1} at ${scheduleConfig.time || '09:00'}`
    default:
      return 'Custom schedule'
  }
}

export function ScheduleCard({ 
  schedule, 
  onToggle, 
  onDelete, 
  onRunNow, 
  onViewDetails,
  onEdit,
  onDuplicate
}: ScheduleCardProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const JobIcon = JOB_TYPE_ICONS[schedule.jobType as keyof typeof JOB_TYPE_ICONS] || Globe
  const ScheduleIcon = SCHEDULE_TYPE_ICONS[schedule.scheduleType as keyof typeof SCHEDULE_TYPE_ICONS] || Clock

  const handleToggle = async () => {
    setLoading('toggle')
    try {
      await onToggle(schedule.id, !schedule.isActive)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      setLoading('delete')
      try {
        await onDelete(schedule.id)
      } finally {
        setLoading(null)
      }
    }
  }

  const handleRunNow = async () => {
    setLoading('run')
    try {
      await onRunNow(schedule.id)
    } finally {
      setLoading(null)
    }
  }

  const getStatusBadge = () => {
    if (!schedule.isActive) {
      return <Badge variant="secondary">Paused</Badge>
    }
    
    if (schedule.lastRunStatus === 'running') {
      return <Badge variant="default">Running</Badge>
    }
    
    if (schedule.lastRunStatus === 'failed') {
      return <Badge variant="destructive">Last run failed</Badge>
    }
    
    if (schedule.lastRunStatus === 'success') {
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>
  }

  const getNextRunText = () => {
    if (!schedule.isActive) return 'Paused'
    if (!schedule.nextRunAt) return 'Not scheduled'
    
    try {
      const nextRun = new Date(schedule.nextRunAt)
      return `Next: ${formatDistanceToNow(nextRun, { addSuffix: true })}`
    } catch {
      return 'Invalid date'
    }
  }

  const getLastRunText = () => {
    if (!schedule.lastRunAt) return 'Never run'
    
    try {
      const lastRun = new Date(schedule.lastRunAt)
      return `Last: ${formatDistanceToNow(lastRun, { addSuffix: true })}`
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <JobIcon className="h-4 w-4 text-muted-foreground" />
              <ScheduleIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">{schedule.name}</CardTitle>
              <CardDescription className="text-sm">
                {JOB_TYPE_LABELS[schedule.jobType as keyof typeof JOB_TYPE_LABELS] || 'Unknown Job'} • {formatScheduleDescription(schedule.scheduleType, schedule.scheduleConfig)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(schedule.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(schedule.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Schedule
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(schedule.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Schedule
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={handleRunNow}
                  disabled={loading === 'run'}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {loading === 'run' ? 'Running...' : 'Run Now'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleToggle}
                  disabled={loading === 'toggle'}
                >
                  {schedule.isActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      {loading === 'toggle' ? 'Pausing...' : 'Pause'}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {loading === 'toggle' ? 'Activating...' : 'Activate'}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={loading === 'delete'}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {loading === 'delete' ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{getNextRunText()}</span>
            <span>{getLastRunText()}</span>
          </div>
          
          {schedule.url && (
            <div className="text-xs text-muted-foreground truncate">
              URL: {schedule.url}
            </div>
          )}
          
          {Array.isArray(schedule.urls) && schedule.urls.length > 0 && (
            <div className="text-xs text-muted-foreground">
              URLs: {schedule.urls.length} items
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Timezone: {schedule.timezone}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
