"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Clock, Globe, Link, Layers, Map, Calendar, Timer, Repeat } from 'lucide-react'
import { toast } from 'sonner'
import type { JobConfig } from '@/types/jobs'

interface CreateScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScheduleCreated: () => void
  apiEndpoint: string
}

type JobType = 'scrape' | 'crawl' | 'batch' | 'map'
type ScheduleType = 'interval' | 'hourly' | 'daily' | 'weekly' | 'monthly'

interface ScheduleConfig {
  interval?: number
  unit?: 'minutes' | 'hours' | 'days'
  time?: string
  days?: number[]
  date?: number
}

const JOB_TYPE_INFO = {
  scrape: {
    icon: Globe,
    title: 'Single Page Scrape',
    description: 'Scrape a single webpage and extract content'
  },
  crawl: {
    icon: Link,
    title: 'Website Crawl',
    description: 'Crawl multiple pages from a website'
  },
  batch: {
    icon: Layers,
    title: 'Batch Scrape',
    description: 'Scrape multiple URLs in parallel'
  },
  map: {
    icon: Map,
    title: 'Site Map',
    description: 'Generate a map of website URLs'
  }
}

const SCHEDULE_TYPE_INFO = {
  interval: {
    icon: Timer,
    title: 'Interval',
    description: 'Run every X minutes/hours/days'
  },
  hourly: {
    icon: Clock,
    title: 'Hourly',
    description: 'Run every hour'
  },
  daily: {
    icon: Calendar,
    title: 'Daily',
    description: 'Run once per day at a specific time'
  },
  weekly: {
    icon: Repeat,
    title: 'Weekly',
    description: 'Run on specific days of the week'
  },
  monthly: {
    icon: Calendar,
    title: 'Monthly',
    description: 'Run on a specific day of the month'
  }
}

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

export function CreateScheduleDialog({ open, onOpenChange, onScheduleCreated, apiEndpoint }: CreateScheduleDialogProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Basic info
  const [name, setName] = useState('')
  const [jobType, setJobType] = useState<JobType>('scrape')
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily')
  const [timezone, setTimezone] = useState('UTC')

  // Job configuration
  const [url, setUrl] = useState('')
  const [urls, setUrls] = useState('')
  const [jobConfig, setJobConfig] = useState<Partial<JobConfig>>({
    formats: ['markdown'],
    onlyMainContent: true,
    limit: 10,
    waitFor: 0,
    timeout: 30
  })

  // Schedule configuration
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    interval: 1,
    unit: 'hours',
    time: '09:00',
    days: [1, 2, 3, 4, 5], // Monday to Friday
    date: 1
  })

  const resetForm = () => {
    setStep(1)
    setName('')
    setJobType('scrape')
    setScheduleType('daily')
    setTimezone('UTC')
    setUrl('')
    setUrls('')
    setJobConfig({
      formats: ['markdown'],
      onlyMainContent: true,
      limit: 10,
      waitFor: 0,
      timeout: 30
    })
    setScheduleConfig({
      interval: 1,
      unit: 'hours',
      time: '09:00',
      days: [1, 2, 3, 4, 5],
      date: 1
    })
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(resetForm, 300) // Reset after dialog closes
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter a schedule name')
      return
    }

    if ((jobType === 'scrape' || jobType === 'crawl' || jobType === 'map') && !url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    if (jobType === 'batch' && !urls.trim()) {
      toast.error('Please enter URLs for batch scraping')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: name.trim(),
        jobType,
        jobConfig,
        url: (jobType === 'scrape' || jobType === 'crawl' || jobType === 'map') ? url.trim() : undefined,
        urls: jobType === 'batch' ? urls.split('\n').map(u => u.trim()).filter(Boolean) : undefined,
        apiEndpoint,
        scheduleType,
        scheduleConfig,
        timezone,
        isActive: true
      }

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Schedule created successfully!')
        handleClose()
        onScheduleCreated()
      } else {
        toast.error(`Failed to create schedule: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to create schedule:', error)
      toast.error('Failed to create schedule')
    } finally {
      setLoading(false)
    }
  }

  const renderJobTypeStep = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Schedule Name</Label>
        <Input
          placeholder="e.g., Daily News Scraping"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-base font-medium">Job Type</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {Object.entries(JOB_TYPE_INFO).map(([type, info]) => {
            const Icon = info.icon
            return (
              <Card
                key={type}
                className={`cursor-pointer transition-all ${
                  jobType === type ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setJobType(type as JobType)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium text-sm">{info.title}</div>
                      <div className="text-xs text-muted-foreground">{info.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {(jobType === 'scrape' || jobType === 'crawl' || jobType === 'map') && (
        <div>
          <Label className="text-base font-medium">URL</Label>
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-2"
          />
        </div>
      )}

      {jobType === 'batch' && (
        <div>
          <Label className="text-base font-medium">URLs (one per line)</Label>
          <Textarea
            placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            className="mt-2 min-h-[100px]"
          />
        </div>
      )}
    </div>
  )

  const renderJobConfigStep = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Output Formats</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {['markdown', 'html', 'rawHtml', 'screenshot', 'links'].map((format) => (
            <div key={format} className="flex items-center space-x-2">
              <Checkbox
                id={format}
                checked={jobConfig.formats?.includes(format) || false}
                onCheckedChange={(checked) => {
                  const currentFormats = jobConfig.formats || []
                  if (checked) {
                    setJobConfig({
                      ...jobConfig,
                      formats: [...currentFormats, format]
                    })
                  } else {
                    setJobConfig({
                      ...jobConfig,
                      formats: currentFormats.filter(f => f !== format)
                    })
                  }
                }}
              />
              <Label htmlFor={format} className="text-sm capitalize">{format}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Page Limit</Label>
          <Input
            type="number"
            value={jobConfig.limit || 10}
            onChange={(e) => setJobConfig({
              ...jobConfig,
              limit: parseInt(e.target.value) || 10
            })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Wait Time (seconds)</Label>
          <Input
            type="number"
            value={jobConfig.waitFor || 0}
            onChange={(e) => setJobConfig({
              ...jobConfig,
              waitFor: parseInt(e.target.value) || 0
            })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="onlyMainContent"
          checked={jobConfig.onlyMainContent || false}
          onCheckedChange={(checked) => setJobConfig({
            ...jobConfig,
            onlyMainContent: checked as boolean
          })}
        />
        <Label htmlFor="onlyMainContent" className="text-sm">Extract only main content</Label>
      </div>

      {(jobType === 'crawl') && (
        <div className="space-y-4">
          <div>
            <Label className="text-sm">Include Paths (one per line)</Label>
            <Textarea
              placeholder="/blog/*&#10;/news/*"
              value={jobConfig.includePaths?.join('\n') || ''}
              onChange={(e) => setJobConfig({
                ...jobConfig,
                includePaths: e.target.value.split('\n').map(p => p.trim()).filter(Boolean)
              })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Exclude Paths (one per line)</Label>
            <Textarea
              placeholder="/admin/*&#10;/private/*"
              value={jobConfig.excludePaths?.join('\n') || ''}
              onChange={(e) => setJobConfig({
                ...jobConfig,
                excludePaths: e.target.value.split('\n').map(p => p.trim()).filter(Boolean)
              })}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderScheduleStep = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Schedule Type</Label>
        <div className="grid grid-cols-1 gap-2 mt-2">
          {Object.entries(SCHEDULE_TYPE_INFO).map(([type, info]) => {
            const Icon = info.icon
            return (
              <Card
                key={type}
                className={`cursor-pointer transition-all ${
                  scheduleType === type ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setScheduleType(type as ScheduleType)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium text-sm">{info.title}</div>
                      <div className="text-xs text-muted-foreground">{info.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {scheduleType === 'interval' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Interval</Label>
            <Input
              type="number"
              min="1"
              value={scheduleConfig.interval || 1}
              onChange={(e) => setScheduleConfig({
                ...scheduleConfig,
                interval: parseInt(e.target.value) || 1
              })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Unit</Label>
            <Select
              value={scheduleConfig.unit || 'hours'}
              onValueChange={(value) => setScheduleConfig({
                ...scheduleConfig,
                unit: value as 'minutes' | 'hours' | 'days'
              })}
            >
              <SelectTrigger className="mt-1">
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
      )}

      {(scheduleType === 'daily' || scheduleType === 'weekly' || scheduleType === 'monthly') && (
        <div>
          <Label className="text-sm">Time</Label>
          <Input
            type="time"
            value={scheduleConfig.time || '09:00'}
            onChange={(e) => setScheduleConfig({
              ...scheduleConfig,
              time: e.target.value
            })}
            className="mt-1"
          />
        </div>
      )}

      {scheduleType === 'weekly' && (
        <div>
          <Label className="text-sm">Days of Week</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {WEEKDAYS.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={scheduleConfig.days?.includes(day.value) || false}
                  onCheckedChange={(checked) => {
                    const currentDays = scheduleConfig.days || []
                    if (checked) {
                      setScheduleConfig({
                        ...scheduleConfig,
                        days: [...currentDays, day.value].sort()
                      })
                    } else {
                      setScheduleConfig({
                        ...scheduleConfig,
                        days: currentDays.filter(d => d !== day.value)
                      })
                    }
                  }}
                />
                <Label htmlFor={`day-${day.value}`} className="text-sm">{day.label}</Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {scheduleType === 'monthly' && (
        <div>
          <Label className="text-sm">Day of Month</Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={scheduleConfig.date || 1}
            onChange={(e) => setScheduleConfig({
              ...scheduleConfig,
              date: parseInt(e.target.value) || 1
            })}
            className="mt-1"
          />
        </div>
      )}

      <div>
        <Label className="text-sm">Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="America/New_York">Eastern Time</SelectItem>
            <SelectItem value="America/Chicago">Central Time</SelectItem>
            <SelectItem value="America/Denver">Mountain Time</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
            <SelectItem value="Europe/London">London</SelectItem>
            <SelectItem value="Europe/Paris">Paris</SelectItem>
            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
            <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Schedule</DialogTitle>
          <DialogDescription>
            Set up an automated job to run on a schedule
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center space-x-2 mb-6">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`w-12 h-0.5 ${
                    step > stepNum ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {step === 1 && renderJobTypeStep()}
          {step === 2 && renderJobConfigStep()}
          {step === 3 && renderScheduleStep()}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create Schedule'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
