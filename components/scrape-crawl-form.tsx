"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, Play, Globe, Link, Layers } from "lucide-react"

interface ScrapingConfig {
  name: string
  formats: string[]
  limit: number
  includeTags: string[]
  excludeTags: string[]
  waitFor: number
  allowBackwardCrawling?: boolean
  allowExternalContentLinks?: boolean
  ignoreSitemap?: boolean
}

interface ScrapingJob {
  id: string
  type: "scrape" | "crawl" | "batch"
  url?: string
  urls?: string[]
  status: "pending" | "running" | "completed" | "failed"
  data?: any[]
  error?: string
  createdAt: string
  config: ScrapingConfig
}

interface ScrapeCrawlFormProps {
  type: "scrape" | "crawl" | "batch"
  apiEndpoint: string
  onJobCreate: (job: ScrapingJob) => void
}

export default function ScrapeCrawlForm({ type, apiEndpoint, onJobCreate }: ScrapeCrawlFormProps) {
  const [url, setUrl] = useState("")
  const [batchUrls, setBatchUrls] = useState("")
  const [config, setConfig] = useState<ScrapingConfig>({
    name: "",
    formats: ["markdown"],
    limit: 10,
    includeTags: [],
    excludeTags: [],
    waitFor: 0,
    allowBackwardCrawling: false,
    allowExternalContentLinks: false,
    ignoreSitemap: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const jobData: any = {
        type,
        config: {
          ...config,
          name: config.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Job`,
        },
      }

      if (type === "batch") {
        const urlList = batchUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean)

        if (urlList.length === 0) {
          throw new Error("Please provide at least one URL for batch scraping")
        }

        // Validate URLs
        urlList.forEach((u) => new URL(u))
        jobData.urls = urlList
      } else {
        if (!url) {
          throw new Error("Please provide a URL")
        }
        new URL(url) // Validate URL
        jobData.url = url
      }

      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newJob: ScrapingJob = {
        id: jobId,
        ...jobData,
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      onJobCreate(newJob)

      // Start the job
      const response = await fetch("/api/firecrawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          ...jobData,
          apiEndpoint,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Reset form
      setUrl("")
      setBatchUrls("")
      setConfig({
        name: "",
        formats: ["markdown"],
        limit: 10,
        includeTags: [],
        excludeTags: [],
        waitFor: 0,
        allowBackwardCrawling: false,
        allowExternalContentLinks: false,
        ignoreSitemap: false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start job")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormatChange = (format: string, checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      formats: checked ? [...prev.formats, format] : prev.formats.filter((f) => f !== format),
    }))
  }

  const getIcon = () => {
    switch (type) {
      case "scrape":
        return <Globe className="h-5 w-5" />
      case "crawl":
        return <Link className="h-5 w-5" />
      case "batch":
        return <Layers className="h-5 w-5" />
    }
  }

  const getTitle = () => {
    switch (type) {
      case "scrape":
        return "Single Page Scrape"
      case "crawl":
        return "Website Crawl"
      case "batch":
        return "Batch Scrape"
    }
  }

  const getDescription = () => {
    switch (type) {
      case "scrape":
        return "Turn any URL into clean data. Converts web pages into markdown, ideal for LLM applications. Handles dynamic content, JS-rendered sites, PDFs, and images."
      case "crawl":
        return "Recursively search through a website's subdomains and gather comprehensive content. Scans sitemap, follows links, and extracts data from all subpages."
      case "batch":
        return "Scrape multiple URLs simultaneously. Enter one URL per line for efficient batch processing."
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
            {getIcon()}
            <span>{getTitle()}</span>
          </CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {type === "batch" ? (
              <div>
                <Label htmlFor="batch-urls">URLs to Scrape (one per line) *</Label>
                <Textarea
                  id="batch-urls"
                  value={batchUrls}
                  onChange={(e) => setBatchUrls(e.target.value)}
                  placeholder={`https://example.com/page1
https://example.com/page2
https://example.com/page3`}
                  rows={6}
                  required
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {batchUrls.split("\n").filter(Boolean).length} URLs entered
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="url">{type === "crawl" ? "Website URL to Crawl" : "URL to Scrape"} *</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={type === "crawl" ? "https://example.com" : "https://example.com/page"}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="config-name">Job Name</Label>
                  <Input
                    id="config-name"
                    value={config.name}
                    onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="My scraping job"
                  />
                </div>

                <div>
                  <Label htmlFor="limit">Page Limit</Label>
                  <Input
                    id="limit"
                    type="number"
                    min="1"
                    max="1000"
                    value={config.limit}
                    onChange={(e) => setConfig((prev) => ({ ...prev, limit: Number.parseInt(e.target.value) || 10 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="wait-for">Wait Time (seconds)</Label>
                  <Input
                    id="wait-for"
                    type="number"
                    min="0"
                    max="30"
                    value={config.waitFor}
                    onChange={(e) => setConfig((prev) => ({ ...prev, waitFor: Number.parseInt(e.target.value) || 0 }))}
                  />
                </div>

                {type === "crawl" && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="backward-crawling"
                        checked={config.allowBackwardCrawling}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, allowBackwardCrawling: checked as boolean }))
                        }
                      />
                      <Label htmlFor="backward-crawling" className="text-sm">
                        Allow backward crawling
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="external-links"
                        checked={config.allowExternalContentLinks}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, allowExternalContentLinks: checked as boolean }))
                        }
                      />
                      <Label htmlFor="external-links" className="text-sm">
                        Allow external links
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ignore-sitemap"
                        checked={config.ignoreSitemap}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, ignoreSitemap: checked as boolean }))
                        }
                      />
                      <Label htmlFor="ignore-sitemap" className="text-sm">
                        Ignore sitemap
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Output Formats</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["markdown", "html", "rawHtml", "links", "screenshot"].map((format) => (
                      <div key={format} className="flex items-center space-x-2">
                        <Checkbox
                          id={format}
                          checked={config.formats.includes(format)}
                          onCheckedChange={(checked) => handleFormatChange(format, checked as boolean)}
                        />
                        <Label htmlFor={format} className="capitalize text-sm">
                          {format}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="include-tags">Include Tags (comma-separated)</Label>
                  <Textarea
                    id="include-tags"
                    value={config.includeTags.join(", ")}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        includeTags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="article, main, content"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="exclude-tags">Exclude Tags (comma-separated)</Label>
                  <Textarea
                    id="exclude-tags"
                    value={config.excludeTags.join(", ")}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        excludeTags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="nav, footer, sidebar"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4">
              <Button type="submit" disabled={isLoading || (!url && !batchUrls)}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting {type} job...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start {type.charAt(0).toUpperCase() + type.slice(1)} Job
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
