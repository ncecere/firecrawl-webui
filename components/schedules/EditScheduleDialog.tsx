'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  Globe, 
  Save, 
  X,
  AlertCircle,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import type { ScheduledJob } from '@/lib/db/schema'

interface EditScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: ScheduledJob | null
  onScheduleUpdated: () => void
  apiEndpoint: string
}

interface ScheduleFormData {
  name: string
  jobType: 'scrape' | 'crawl' | 'batch' | 'map'
  url?: string
  urls?: string[]
  scheduleType: 'interval' | 'hourly' | 'daily' | 'weekly' | 'monthly'
  scheduleConfig: any
  timezone: string
  isActive: boolean
  jobConfig: any
}

const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
]

const SCHEDULE_TYPES = [
  { value: 'interval', label: 'Interval' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
]

const JOB_TYPES = [
  { value: 'scrape', label: 'Single Page Scrape' },
  { value: 'crawl', label: 'Website Crawl' },
  { value: 'batch', label: 'Batch Scrape' },
  { value: 'map', label: 'Site Map' }
]

export function EditScheduleDialog({
  open,
  onOpenChange,
  schedule,
  onScheduleUpdated,
  apiEndpoint
}: EditScheduleDialogProps) {
  const [formData, setFormData] = useState<ScheduleFormData>({
    name: '',
    jobType: 'scrape',
    url: '',
    urls: [],
    scheduleType: 'daily',
    scheduleConfig: { time: '09:00' },
    timezone: 'UTC',
    isActive: true,
    jobConfig: {}
  })
  const [loading, setLoading] = useState(false)
  const [urlsText, setUrlsText] = useState('')

  // Initialize form data when schedule changes
  useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name,
        jobType: schedule.jobType as 'scrape' | 'crawl' | 'batch' | 'map',
        url: schedule.url || '',
        urls: Array.isArray(schedule.urls) ? schedule.urls : [],
        scheduleType: schedule.scheduleType as 'interval' | 'hourly' | 'daily' | 'weekly' | 'monthly',
        scheduleConfig: schedule.scheduleConfig || { time: '09:00' },
        timezone: schedule.timezone,
        isActive: schedule.isActive,
        jobConfig: schedule.jobConfig || {}
      })
      
      // Set URLs text for batch jobs
      if (Array.isArray(schedule.urls) && schedule.urls.length > 0) {
        setUrlsText(schedule.urls.join('\n'))
      } else {
        setUrlsText('')
      }
    }
  }, [schedule])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schedule) return

    setLoading(true)

    try {
      // Prepare URLs for batch jobs
      let urls: string[] | undefined
      if (formData.jobType === 'batch' && urlsText.trim()) {
        urls = urlsText.split('\n').map(url => url.trim()).filter(Boolean)
        if (urls.length === 0) {
          toast.error('Please provide at least one URL for batch scraping')
          setLoading(false)
          return
        }
      }

      const updateData = {
        name: formData.name,
        jobType: formData.jobType,
        url: formData.jobType !== 'batch' ? formData.url : undefined,
        urls: formData.jobType === 'batch' ? urls : undefined,
        scheduleType: formData.scheduleType,
        scheduleConfig: formData.scheduleConfig,
        timezone: formData.timezone,
        isActive: formData.isActive,
        jobConfig: formData.jobConfig
      }

      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Schedule updated successfully')
        onScheduleUpdated()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to update schedule')
      }
    } catch (error) {
      console.error('Failed to update schedule:', error)
      toast.error('Failed to update schedule')
    } finally {
      setLoading(false)
    }
  }

  const updateScheduleConfig = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      scheduleConfig: {
        ...prev.scheduleConfig,
        [key]: value
      }
    }))
  }

  const renderScheduleConfig = () => {
    switch (formData.scheduleType) {
      case 'interval':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interval">Interval</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                value={formData.scheduleConfig.interval || 1}
                onChange={(e) => updateScheduleConfig('interval', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.scheduleConfig.unit || 'hours'}
                onValueChange={(value) => updateScheduleConfig('unit', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'daily':
        return (
          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.scheduleConfig.time || '09:00'}
              onChange={(e) => updateScheduleConfig('time', e.target.value)}
            />
          </div>
        )

      case 'weekly':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="weekly-time">Time</Label>
              <Input
                id="weekly-time"
                type="time"
                value={formData.scheduleConfig.time || '09:00'}
                onChange={(e) => updateScheduleConfig('time', e.target.value)}
              />
            </div>
            <div>
              <Label>Days of Week</Label>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${index}`}
                      checked={(formData.scheduleConfig.days || []).includes(index)}
                      onCheckedChange={(checked) => {
                        const currentDays = formData.scheduleConfig.days || []
                        const newDays = checked
                          ? [...currentDays, index]
                          : currentDays.filter((d: number) => d !== index)
                        updateScheduleConfig('days', newDays.sort())
                      }}
                    />
                    <Label htmlFor={`day-${index}`} className="text-sm">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'monthly':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Day of Month</Label>
              <Input
                id="date"
                type="number"
                min="1"
                max="31"
                value={formData.scheduleConfig.date || 1}
                onChange={(e) => updateScheduleConfig('date', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="monthly-time">Time</Label>
              <Input
                id="monthly-time"
                type="time"
                value={formData.scheduleConfig.time || '09:00'}
                onChange={(e) => updateScheduleConfig('time', e.target.value)}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!schedule) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Schedule
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Schedule Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My scheduled job"
                  required
                />
              </div>

              <div>
                <Label htmlFor="jobType">Job Type</Label>
                <Select
                  value={formData.jobType}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, jobType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.jobType !== 'batch' ? (
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                    required
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="urls">URLs (one per line)</Label>
                  <Textarea
                    id="urls"
                    value={urlsText}
                    onChange={(e) => setUrlsText(e.target.value)}
                    placeholder="https://example.com/page1&#10;https://example.com/page2"
                    rows={4}
                    required
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
                <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                  {formData.isActive ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scheduleType">Schedule Type</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={(value: any) => {
                    setFormData(prev => ({
                      ...prev,
                      scheduleType: value,
                      scheduleConfig: value === 'daily' ? { time: '09:00' } : {}
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {renderScheduleConfig()}

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map(tz => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
