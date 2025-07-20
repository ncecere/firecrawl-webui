"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, Play, Map, Zap } from "lucide-react"

interface MapJob {
  id: string
  type: "map"
  url: string
  status: "pending" | "running" | "completed" | "failed"
  data?: any[]
  error?: string
  createdAt: string
  config: {
    name: string
    search?: string
  }
}

interface MapFormProps {
  apiEndpoint: string
  onJobCreate: (job: MapJob) => void
}

export default function MapForm({ apiEndpoint, onJobCreate }: MapFormProps) {
  const [url, setUrl] = useState("")
  const [search, setSearch] = useState("")
  const [jobName, setJobName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!url) {
        throw new Error("Please provide a URL")
      }

      // Validate URL
      new URL(url)

      const jobId = `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newJob: MapJob = {
        id: jobId,
        type: "map",
        url,
        status: "pending",
        createdAt: new Date().toISOString(),
        config: {
          name: jobName || `Map ${new URL(url).hostname}`,
          search: search || undefined,
        },
      }

      onJobCreate(newJob)

      // Start the mapping job
      const response = await fetch("/api/firecrawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          type: "map",
          url,
          config: newJob.config,
          apiEndpoint,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Reset form
      setUrl("")
      setSearch("")
      setJobName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start mapping job")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Map className="h-5 w-5" />
            <span>Website Mapping</span>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardTitle>
          <CardDescription>Input a website and get all the URLs on the website – extremely fast!</CardDescription>

          <div className="text-sm text-muted-foreground mt-2">
            <ul className="list-disc list-inside space-y-1">
              <li>Prompt users to choose which links to scrape</li>
              <li>Quickly discover all links on a website</li>
              <li>Find pages related to specific topics</li>
              <li>Identify specific pages to scrape</li>
            </ul>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="map-url">Website URL to Map *</Label>
              <Input
                id="map-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="job-name">Job Name</Label>
              <Input
                id="job-name"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Website mapping job"
              />
            </div>

            <div>
              <Label htmlFor="search-filter">Search Filter (optional)</Label>
              <Input
                id="search-filter"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="blog, product, documentation"
              />
              <div className="text-sm text-muted-foreground mt-1">
                Filter URLs that contain specific keywords or topics
              </div>
            </div>

            <div className="flex items-center justify-end pt-4">
              <Button type="submit" disabled={isLoading || !url}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mapping Website...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Mapping
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">Lightning Fast</h4>
              <p className="text-sm text-blue-700">
                The map endpoint is optimized for speed and can quickly discover all URLs on a website without scraping
                the actual content. Perfect for reconnaissance and planning your scraping strategy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
