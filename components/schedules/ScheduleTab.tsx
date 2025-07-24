"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { CreateScheduleDialog } from './CreateScheduleDialog'
import { EditScheduleDialog } from './EditScheduleDialog'
import { DuplicateScheduleDialog } from './DuplicateScheduleDialog'
import { ScheduleCard } from './ScheduleCard'
import { RunHistoryDialog } from './RunHistoryDialog'
import type { ScheduledJob } from '@/lib/db/schema'

interface ScheduledJobWithStatus extends ScheduledJob {
  lastRunStatus?: 'success' | 'failed' | 'running'
}

interface ScheduleTabProps {
  apiEndpoint: string
}

export function ScheduleTab({ apiEndpoint }: ScheduleTabProps) {
  const [schedules, setSchedules] = useState<ScheduledJob[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledJob | null>(null)

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules')
      const data = await response.json()
      
      if (data.success) {
        setSchedules(data.schedules)
      } else {
        toast.error('Failed to load schedules')
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
      toast.error('Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSchedule = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Schedule ${isActive ? 'activated' : 'paused'}`)
        fetchSchedules()
      } else {
        toast.error(`Failed to ${isActive ? 'activate' : 'pause'} schedule`)
      }
    } catch (error) {
      console.error('Failed to toggle schedule:', error)
      toast.error('Failed to update schedule')
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Schedule deleted')
        fetchSchedules()
      } else {
        toast.error('Failed to delete schedule')
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      toast.error('Failed to delete schedule')
    }
  }

  const handleRunNow = async (id: string) => {
    try {
      const response = await fetch(`/api/schedules/${id}/run`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Job started successfully')
        fetchSchedules()
      } else {
        toast.error(`Failed to run job: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to run job:', error)
      toast.error('Failed to run job')
    }
  }

  const handleViewDetails = (id: string) => {
    const schedule = schedules.find(s => s.id === id)
    if (schedule) {
      setSelectedSchedule(schedule)
      setHistoryDialogOpen(true)
    }
  }

  const handleEditSchedule = (id: string) => {
    const schedule = schedules.find(s => s.id === id)
    if (schedule) {
      setSelectedSchedule(schedule)
      setEditDialogOpen(true)
    }
  }

  const handleDuplicateSchedule = (id: string) => {
    const schedule = schedules.find(s => s.id === id)
    if (schedule) {
      setSelectedSchedule(schedule)
      setDuplicateDialogOpen(true)
    }
  }

  const handleScheduleCreated = () => {
    fetchSchedules()
  }

  const handleScheduleUpdated = () => {
    fetchSchedules()
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Scheduled Jobs</h2>
            <p className="text-muted-foreground">Manage your automated Firecrawl jobs</p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading schedules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Jobs</h2>
          <p className="text-muted-foreground">Manage your automated Firecrawl jobs</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      {!schedules || schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No scheduled jobs yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first schedule to automate your Firecrawl jobs
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onToggle={handleToggleSchedule}
              onDelete={handleDeleteSchedule}
              onRunNow={handleRunNow}
              onViewDetails={handleViewDetails}
              onEdit={handleEditSchedule}
              onDuplicate={handleDuplicateSchedule}
            />
          ))}
        </div>
      )}

      <CreateScheduleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onScheduleCreated={handleScheduleCreated}
        apiEndpoint={apiEndpoint}
      />

      <EditScheduleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        schedule={selectedSchedule}
        onScheduleUpdated={handleScheduleUpdated}
        apiEndpoint={apiEndpoint}
      />

      <DuplicateScheduleDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        schedule={selectedSchedule}
        onScheduleCreated={handleScheduleCreated}
        apiEndpoint={apiEndpoint}
      />

      {selectedSchedule && (
        <RunHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          scheduleId={selectedSchedule.id}
          scheduleName={selectedSchedule.name}
        />
      )}
    </div>
  )
}
