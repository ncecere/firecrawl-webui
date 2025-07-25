"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, AlertCircle, Play, Map, Zap, ChevronDown, Settings } from "lucide-react"
import { Job } from "@/types/jobs"

interface MapFormProps {
  apiEndpoint: string
  onJobCreate: (job: Job) => void
}

export default function MapForm({ apiEndpoint, onJobCreate }: MapFormProps) {
  const [url, setUrl] = useState("")
  const [search, setSearch] = useState("")
  const [jobName, setJobName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Advanced options
  const [limit, setLimit] = useState(5000)
  const [timeout, setTimeout] = useState(30)
  const [ignoreSitemap, setIgnoreSitemap] = useState(false)
  const [sitemapOnly, setSitemapOnly] = useState(false)
  const [includeSubdomains, setIncludeSubdomains] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

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

      const newJob: Job = {
        id: jobId,
        type: "map" as const,
        url,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        config: {
          name: jobName || `Map ${new URL(url).hostname}`,
          search: search || undefined,
          limit: limit,
          timeout: timeout,
          ignoreSitemap: ignoreSitemap,
          sitemapOnly: sitemapOnly,
          allowSubdomains: includeSubdomains,
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
      setLimit(5000)
      setTimeout(30)
      setIgnoreSitemap(false)
      setSitemapOnly(false)
      setIncludeSubdomains(false)
      setShowAdvanced(false)
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

            {/* Advanced Options */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Advanced Options</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="limit">URL Limit</Label>
                    <Input
                      id="limit"
                      type="number"
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      min={1}
                      max={5000}
                      placeholder="5000"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      Maximum number of URLs to return (1-5000)
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={timeout}
                      onChange={(e) => setTimeout(Number(e.target.value))}
                      min={1}
                      max={300}
                      placeholder="30"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      Request timeout in seconds (1-300)
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-subdomains"
                      checked={includeSubdomains}
                      onCheckedChange={(checked) => setIncludeSubdomains(checked as boolean)}
                    />
                    <Label htmlFor="include-subdomains" className="text-sm font-normal">
                      Include subdomains
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ignore-sitemap"
                      checked={ignoreSitemap}
                      onCheckedChange={(checked) => setIgnoreSitemap(checked as boolean)}
                    />
                    <Label htmlFor="ignore-sitemap" className="text-sm font-normal">
                      Ignore sitemap.xml
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sitemap-only"
                      checked={sitemapOnly}
                      onCheckedChange={(checked) => setSitemapOnly(checked as boolean)}
                    />
                    <Label htmlFor="sitemap-only" className="text-sm font-normal">
                      Use sitemap.xml only
                    </Label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

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
    </div>
  )
}
