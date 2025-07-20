"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react"

interface ScrapingJob {
  id: string
  type: "scrape" | "crawl" | "map" | "search" | "batch"
  url?: string
  urls?: string[]
  query?: string
  status: "pending" | "running" | "completed" | "failed"
  data?: any[]
  error?: string
  createdAt: string
  config: any
}

interface ResultsDisplayProps {
  jobs: ScrapingJob[]
  onJobUpdate: (jobId: string, updates: Partial<ScrapingJob>) => void
  apiEndpoint: string
}

export default function ResultsDisplay({ jobs, onJobUpdate, apiEndpoint }: ResultsDisplayProps) {
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Poll for job updates
  useEffect(() => {
    const runningJobs = jobs.filter((job) => job.status === "running" || job.status === "pending")

    if (runningJobs.length === 0) return

    const pollInterval = setInterval(async () => {
      for (const job of runningJobs) {
        try {
          const response = await fetch(`/api/scrape/${job.id}?apiEndpoint=${encodeURIComponent(apiEndpoint)}`)
          if (response.ok) {
            const updatedJob = await response.json()
            onJobUpdate(job.id, updatedJob)
          }
        } catch (error) {
          console.error(`Failed to poll job ${job.id}:`, error)
        }
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [jobs, onJobUpdate, apiEndpoint])

  const filteredJobs = jobs
    .filter((job) => {
      const matchesSearch =
        job.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.urls?.join(",").toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.config.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || job.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof ScrapingJob] || ""
      const bValue = b[sortBy as keyof ScrapingJob] || ""
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortOrder === "asc" ? comparison : -comparison
    })

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      running: "default",
      completed: "default",
      failed: "destructive",
    } as const

    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      running: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    )
  }

  const downloadResults = (job: ScrapingJob) => {
    if (!job.data) return

    const dataStr = JSON.stringify(job.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${job.config.name || "scraping-results"}-${job.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const retryJob = async (job: ScrapingJob) => {
    onJobUpdate(job.id, { status: "pending", error: undefined })

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: job.id,
          url: job.url,
          config: job.config,
          apiEndpoint,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      onJobUpdate(job.id, {
        status: "failed",
        error: error instanceof Error ? error.message : "Failed to retry job",
      })
    }
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No scraping jobs yet</h3>
            <p className="text-muted-foreground">Start your first scraping job to see results here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedJobData = selectedJob ? jobs.find((job) => job.id === selectedJob) : null

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scraping Jobs ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Config</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Results</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {job.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={job.url || job.urls?.join(", ")}>
                      {job.type === "batch" ? `${job.urls?.length} URLs` : job.url}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{job.config.name || "Unnamed"}</div>
                      <div className="text-muted-foreground">
                        {job.config.formats?.join(", ")} • Limit: {job.config.limit}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {job.status === "completed" && job.data ? (
                      <Badge variant="outline">{job.data.length} items</Badge>
                    ) : job.status === "failed" ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {job.status === "completed" && job.data && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setSelectedJob(job.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => downloadResults(job)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {job.status === "failed" && (
                        <Button size="sm" variant="outline" onClick={() => retryJob(job)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Details Modal */}
      {selectedJobData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Job Results: {selectedJobData.config.name}</CardTitle>
              <Button variant="outline" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
            <CardDescription>
              {selectedJobData.url} • {selectedJobData.data?.length || 0} items scraped
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedJobData.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{selectedJobData.error}</AlertDescription>
              </Alert>
            )}

            {selectedJobData.data && selectedJobData.data.length > 0 && (
              <Tabs defaultValue="table" className="w-full">
                <TabsList>
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="json">JSON View</TabsTrigger>
                </TabsList>
                <TabsContent value="table">
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>URL</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Content Preview</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedJobData.data.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline max-w-xs truncate block"
                              >
                                {item.url}
                              </a>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={item.title}>
                                {item.title || "No title"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-md truncate" title={item.markdown || item.text}>
                                {(item.markdown || item.text || "").substring(0, 100)}...
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="json">
                  <pre className="bg-muted p-4 rounded-lg text-sm max-h-96 overflow-auto">
                    {JSON.stringify(selectedJobData.data, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
