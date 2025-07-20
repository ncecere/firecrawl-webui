"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Globe, Link, Layers, Map, Eye, Download, RefreshCw } from "lucide-react"
import ScrapeCrawlForm from "@/components/scrape-crawl-form"
import MapForm from "@/components/map-form"

interface ScrapingJob {
  id: string
  type: "scrape" | "crawl" | "map" | "batch"
  url?: string
  urls?: string[]
  status: "pending" | "running" | "completed" | "failed"
  data?: any[]
  error?: string
  createdAt: string
  config: any
}

export default function FirecrawlFrontend() {
  const [jobs, setJobs] = useState<ScrapingJob[]>([])
  const [activeTab, setActiveTab] = useState("scrape")
  const [apiEndpoint, setApiEndpoint] = useState("http://localhost:3002")
  const [selectedJob, setSelectedJob] = useState<string | null>(null)

  useEffect(() => {
    // Load saved jobs and API endpoint from localStorage
    const savedJobs = localStorage.getItem("firecrawl-jobs")
    const savedEndpoint = localStorage.getItem("firecrawl-endpoint")

    if (savedJobs) {
      setJobs(JSON.parse(savedJobs))
    }
    if (savedEndpoint) {
      setApiEndpoint(savedEndpoint)
    }
  }, [])

  useEffect(() => {
    // Save jobs to localStorage with size limit and cleanup
    try {
      // Keep only the most recent 50 jobs to prevent storage overflow
      const jobsToStore = jobs.slice(0, 50)
      
      // For completed jobs with large data, store only metadata and first few results
      const optimizedJobs = jobsToStore.map(job => {
        if (job.status === 'completed' && job.data && job.data.length > 5) {
          return {
            ...job,
            data: job.data.slice(0, 5), // Keep only first 5 results for preview
            _originalDataLength: job.data.length // Track original length
          }
        }
        return job
      })
      
      localStorage.setItem("firecrawl-jobs", JSON.stringify(optimizedJobs))
    } catch (error) {
      console.warn('Failed to save jobs to localStorage:', error)
      // If storage is full, clear old jobs and try again
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          // Keep only the most recent 20 jobs and retry
          const recentJobs = jobs.slice(0, 20).map(job => ({
            ...job,
            data: job.data ? job.data.slice(0, 3) : undefined, // Keep even fewer results
            _originalDataLength: job.data?.length
          }))
          localStorage.setItem("firecrawl-jobs", JSON.stringify(recentJobs))
        } catch (retryError) {
          console.error('Failed to save even reduced jobs:', retryError)
          // As last resort, clear all stored jobs
          localStorage.removeItem("firecrawl-jobs")
        }
      }
    }
  }, [jobs])

  useEffect(() => {
    // Poll for job updates
    const runningJobs = jobs.filter((job) => job.status === "running" || job.status === "pending")

    if (runningJobs.length === 0) return

    const pollInterval = setInterval(async () => {
      for (const job of runningJobs) {
        try {
          const response = await fetch(`/api/firecrawl?jobId=${job.id}&apiEndpoint=${encodeURIComponent(apiEndpoint)}`)
          if (response.ok) {
            const updatedJob = await response.json()
            handleJobUpdate(job.id, updatedJob)
          }
        } catch (error) {
          console.error(`Failed to poll job ${job.id}:`, error)
        }
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [jobs, apiEndpoint])

  const handleJobCreate = (job: ScrapingJob) => {
    setJobs((prev) => [job, ...prev])
  }

  const handleJobUpdate = (jobId: string, updates: Partial<ScrapingJob>) => {
    setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, ...updates } : job)))
  }

  const handleApiEndpointChange = (endpoint: string) => {
    setApiEndpoint(endpoint)
    localStorage.setItem("firecrawl-endpoint", endpoint)
  }

  const clearAllJobs = () => {
    setJobs([])
    localStorage.removeItem("firecrawl-jobs")
  }

  const runningJobs = jobs.filter((job) => job.status === "running" || job.status === "pending")
  const completedJobs = jobs.filter((job) => job.status === "completed")
  const failedJobs = jobs.filter((job) => job.status === "failed")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-3 w-3 text-yellow-500" />
      case "running":
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
      case "completed":
        return <div className="h-3 w-3 bg-green-500 rounded-full" />
      case "failed":
        return <div className="h-3 w-3 bg-red-500 rounded-full" />
      default:
        return null
    }
  }

  const downloadResults = (job: ScrapingJob) => {
    if (!job.data) return

    const dataStr = JSON.stringify(job.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${job.config.name || "results"}-${job.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const retryJob = async (job: ScrapingJob) => {
    handleJobUpdate(job.id, { status: "pending", error: undefined })

    try {
      const response = await fetch("/api/firecrawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: job.id,
          type: job.type,
          url: job.url,
          urls: job.urls,
          config: job.config,
          apiEndpoint,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      handleJobUpdate(job.id, {
        status: "failed",
        error: error instanceof Error ? error.message : "Failed to retry job",
      })
    }
  }

  const selectedJobData = selectedJob ? jobs.find((job) => job.id === selectedJob) : null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Firecrawl Web Scraper</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="api-endpoint" className="text-sm">
                  API Endpoint:
                </Label>
                <Input
                  id="api-endpoint"
                  value={apiEndpoint}
                  onChange={(e) => handleApiEndpointChange(e.target.value)}
                  className="w-48"
                  placeholder="http://localhost:3002"
                />
              </div>
              {runningJobs.length > 0 && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{runningJobs.length} running</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{runningJobs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedJobs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedJobs.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scrape" className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Single Scrape</span>
                </TabsTrigger>
                <TabsTrigger value="crawl" className="flex items-center space-x-2">
                  <Link className="h-4 w-4" />
                  <span>Crawl Site</span>
                </TabsTrigger>
                <TabsTrigger value="batch" className="flex items-center space-x-2">
                  <Layers className="h-4 w-4" />
                  <span>Batch Scrape</span>
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center space-x-2">
                  <Map className="h-4 w-4" />
                  <span>Map</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scrape">
                <ScrapeCrawlForm type="scrape" apiEndpoint={apiEndpoint} onJobCreate={handleJobCreate} />
              </TabsContent>

              <TabsContent value="crawl">
                <ScrapeCrawlForm type="crawl" apiEndpoint={apiEndpoint} onJobCreate={handleJobCreate} />
              </TabsContent>

              <TabsContent value="batch">
                <ScrapeCrawlForm type="batch" apiEndpoint={apiEndpoint} onJobCreate={handleJobCreate} />
              </TabsContent>

              <TabsContent value="map">
                <MapForm apiEndpoint={apiEndpoint} onJobCreate={handleJobCreate} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Jobs</CardTitle>
                  <Button variant="outline" size="sm" onClick={clearAllJobs} disabled={jobs.length === 0}>
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
                    {jobs.slice(0, 10).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(job.status)}
                            <Badge variant="outline" className="text-xs capitalize">
                              {job.type}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{job.config.name || "Unnamed Job"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {job.type === "batch" ? `${job.urls?.length} URLs` : job.url}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {job.status === "completed" && job.data && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => setSelectedJob(job.id)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => downloadResults(job)}>
                                <Download className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {job.status === "failed" && (
                            <Button size="sm" variant="ghost" onClick={() => retryJob(job)}>
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedJobData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Job Results</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setSelectedJob(null)}>
                      Close
                    </Button>
                  </div>
                  <CardDescription>
                    {selectedJobData.config.name} • {(selectedJobData as any)._originalDataLength || selectedJobData.data?.length || 0} items
                    {(selectedJobData as any)._originalDataLength && (selectedJobData as any)._originalDataLength > (selectedJobData.data?.length || 0) && 
                      ` (showing first ${selectedJobData.data?.length || 0})`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedJobData.error && (
                    <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg">{selectedJobData.error}</div>
                  )}

                  {selectedJobData.data && selectedJobData.data.length > 0 && (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedJobData.data.slice(0, 5).map((item: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="text-sm font-medium truncate">{item.title || "No title"}</div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline truncate block"
                          >
                            {item.url}
                          </a>
                          {item.markdown && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.markdown.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      ))}
                      {selectedJobData.data.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          And {selectedJobData.data.length - 5} more items...
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
