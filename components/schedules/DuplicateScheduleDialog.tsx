'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Copy, 
  X,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { ScheduledJob } from '@/lib/db/schema'

interface DuplicateScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: ScheduledJob | null
  onScheduleCreated: () => void
  apiEndpoint: string
}

export function DuplicateScheduleDialog({
  open,
  onOpenChange,
  schedule,
  onScheduleCreated,
  apiEndpoint
}: DuplicateScheduleDialogProps) {
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  // Initialize form data when schedule changes
  useEffect(() => {
    if (schedule) {
      setNewName(`${schedule.name} (Copy)`)
    }
  }, [schedule])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schedule) return

    setLoading(true)

    try {
      // Create a new schedule based on the existing one
      const duplicateData = {
        name: newName,
        jobType: schedule.jobType,
        jobConfig: schedule.jobConfig,
        url: schedule.url,
        urls: schedule.urls,
        apiEndpoint: schedule.apiEndpoint,
        scheduleType: schedule.scheduleType,
        scheduleConfig: schedule.scheduleConfig,
        timezone: schedule.timezone,
        isActive: false // Start duplicated schedules as inactive
      }

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Schedule duplicated successfully')
        onScheduleCreated()
        onOpenChange(false)
        setNewName('')
      } else {
        toast.error(result.error || 'Failed to duplicate schedule')
      }
    } catch (error) {
      console.error('Failed to duplicate schedule:', error)
      toast.error('Failed to duplicate schedule')
    } finally {
      setLoading(false)
    }
  }

  if (!schedule) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Schedule
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Original Schedule</h4>
            <p className="text-sm text-muted-foreground mb-1">
              <strong>Name:</strong> {schedule.name}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              <strong>Type:</strong> {schedule.jobType}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Schedule:</strong> {schedule.scheduleType}
            </p>
          </div>

          <div>
            <Label htmlFor="newName">New Schedule Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name for duplicated schedule"
              required
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              The duplicated schedule will be created in an inactive state. You can activate it after reviewing the settings.
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !newName.trim()}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Duplicating...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
