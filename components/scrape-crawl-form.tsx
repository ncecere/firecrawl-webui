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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, AlertCircle, Play, Globe, Link, Layers, ChevronDown, Settings, Filter, Zap, Brain, Route } from "lucide-react"
import { Job } from "@/types/jobs"

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
  onlyMainContent?: boolean
  maxAge?: number
  headers?: Record<string, string>
  mobile?: boolean
  skipTlsVerification?: boolean
  timeout?: number
  parsePDF?: boolean
  removeBase64Images?: boolean
  blockAds?: boolean
  proxy?: string
  storeInCache?: boolean
  zeroDataRetention?: boolean
  llmExtraction?: {
    enabled: boolean
    prompt?: string
    systemPrompt?: string
  }
  maxConcurrency?: number
  ignoreInvalidURLs?: boolean
  excludePaths?: string[]
  includePaths?: string[]
  maxDepth?: number
  maxDiscoveryDepth?: number
  ignoreQueryParameters?: boolean
  crawlEntireDomain?: boolean
  allowSubdomains?: boolean
  delay?: number
}

interface ScrapeCrawlFormProps {
  type: "scrape" | "crawl" | "batch"
  apiEndpoint: string
  onJobCreate: (job: Job) => void
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

      const newJob: Job = {
        id: jobId,
        ...jobData,
        status: "pending" as const,
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
        onlyMainContent: false,
        maxAge: 0,
        mobile: false,
        skipTlsVerification: false,
        timeout: 30,
        parsePDF: false,
        removeBase64Images: false,
        blockAds: false,
        storeInCache: false,
        zeroDataRetention: false,
        llmExtraction: {
          enabled: false,
          prompt: "",
          systemPrompt: "",
        },
        maxConcurrency: 5,
        ignoreInvalidURLs: false,
        // Reset crawl-specific options
        excludePaths: [],
        includePaths: [],
        maxDepth: 10,
        maxDiscoveryDepth: 10,
        ignoreQueryParameters: false,
        crawlEntireDomain: false,
        allowSubdomains: false,
        delay: 0,
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

            {/* Advanced Options */}
            <div className="space-y-4">
              {/* Content Filtering */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4" />
                      <span>Content Filtering</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="only-main-content"
                        checked={config.onlyMainContent || false}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, onlyMainContent: checked as boolean }))
                        }
                      />
                      <Label htmlFor="only-main-content" className="text-sm">
                        Extract only main content
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="parse-pdf"
                        checked={config.parsePDF || false}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, parsePDF: checked as boolean }))
                        }
                      />
                      <Label htmlFor="parse-pdf" className="text-sm">
                        Parse PDF files
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remove-base64-images"
                        checked={config.removeBase64Images || false}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, removeBase64Images: checked as boolean }))
                        }
                      />
                      <Label htmlFor="remove-base64-images" className="text-sm">
                        Remove base64 images
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="block-ads"
                        checked={config.blockAds || false}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, blockAds: checked as boolean }))
                        }
                      />
                      <Label htmlFor="block-ads" className="text-sm">
                        Block advertisements
                      </Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Performance & Behavior */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>Performance & Behavior</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timeout">Timeout (seconds)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        min="1"
                        max="300"
                        value={config.timeout || 30}
                        onChange={(e) => setConfig((prev) => ({ ...prev, timeout: Number.parseInt(e.target.value) || 30 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-age">Max Age (seconds)</Label>
                      <Input
                        id="max-age"
                        type="number"
                        min="0"
                        value={config.maxAge || 0}
                        onChange={(e) => setConfig((prev) => ({ ...prev, maxAge: Number.parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mobile"
                        checked={config.mobile || false}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, mobile: checked as boolean }))
                        }
                      />
                      <Label htmlFor="mobile" className="text-sm">
                        Use mobile viewport
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skip-tls"
                        checked={config.skipTlsVerification || false}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, skipTlsVerification: checked as boolean }))
                        }
                      />
                      <Label htmlFor="skip-tls" className="text-sm">
                        Skip TLS verification
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="store-in-cache"
                        checked={config.storeInCache || false}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, storeInCache: checked as boolean }))
                        }
                      />
                      <Label htmlFor="store-in-cache" className="text-sm">
                        Store in cache
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="zero-data-retention"
                        checked={config.zeroDataRetention || false}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, zeroDataRetention: checked as boolean }))
                        }
                      />
                      <Label htmlFor="zero-data-retention" className="text-sm">
                        Zero data retention
                      </Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* LLM Extraction */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4" />
                      <span>LLM Extraction</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="llm-extraction-enabled"
                      checked={config.llmExtraction?.enabled || false}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ 
                          ...prev, 
                          llmExtraction: { 
                            ...prev.llmExtraction, 
                            enabled: checked as boolean 
                          } 
                        }))
                      }
                    />
                    <Label htmlFor="llm-extraction-enabled" className="text-sm">
                      Enable LLM extraction
                    </Label>
                  </div>
                  
                  {config.llmExtraction?.enabled && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="llm-prompt">Extraction Prompt</Label>
                        <Textarea
                          id="llm-prompt"
                          value={config.llmExtraction?.prompt || ""}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              llmExtraction: {
                                ...prev.llmExtraction,
                                enabled: prev.llmExtraction?.enabled || false,
                                prompt: e.target.value,
                              },
                            }))
                          }
                          placeholder="Extract the main points from this content..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="llm-system-prompt">System Prompt (optional)</Label>
                        <Textarea
                          id="llm-system-prompt"
                          value={config.llmExtraction?.systemPrompt || ""}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              llmExtraction: {
                                ...prev.llmExtraction,
                                enabled: prev.llmExtraction?.enabled || false,
                                systemPrompt: e.target.value,
                              },
                            }))
                          }
                          placeholder="You are a helpful assistant that extracts information..."
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Crawl Options */}
              {type === "crawl" && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center space-x-2">
                        <Route className="h-4 w-4" />
                        <span>Crawl Options</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max-depth">Max Depth</Label>
                        <Input
                          id="max-depth"
                          type="number"
                          min="1"
                          max="100"
                          value={config.maxDepth || 10}
                          onChange={(e) => setConfig((prev) => ({ ...prev, maxDepth: Number.parseInt(e.target.value) || 10 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-discovery-depth">Max Discovery Depth</Label>
                        <Input
                          id="max-discovery-depth"
                          type="number"
                          min="1"
                          max="100"
                          value={config.maxDiscoveryDepth || 10}
                          onChange={(e) => setConfig((prev) => ({ ...prev, maxDiscoveryDepth: Number.parseInt(e.target.value) || 10 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="delay">Delay (milliseconds)</Label>
                        <Input
                          id="delay"
                          type="number"
                          min="0"
                          max="10000"
                          value={config.delay || 0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, delay: Number.parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="crawl-entire-domain"
                          checked={config.crawlEntireDomain || false}
                          onCheckedChange={(checked) =>
                            setConfig((prev) => ({ ...prev, crawlEntireDomain: checked as boolean }))
                          }
                        />
                        <Label htmlFor="crawl-entire-domain" className="text-sm">
                          Crawl entire domain
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allow-subdomains"
                          checked={config.allowSubdomains || false}
                          onCheckedChange={(checked) =>
                            setConfig((prev) => ({ ...prev, allowSubdomains: checked as boolean }))
                          }
                        />
                        <Label htmlFor="allow-subdomains" className="text-sm">
                          Allow subdomains
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ignore-query-parameters"
                          checked={config.ignoreQueryParameters || false}
                          onCheckedChange={(checked) =>
                            setConfig((prev) => ({ ...prev, ignoreQueryParameters: checked as boolean }))
                          }
                        />
                        <Label htmlFor="ignore-query-parameters" className="text-sm">
                          Ignore query parameters
                        </Label>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="include-paths">Include Paths (comma-separated)</Label>
                        <Textarea
                          id="include-paths"
                          value={config.includePaths?.join(", ") || ""}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              includePaths: e.target.value
                                .split(",")
                                .map((path) => path.trim())
                                .filter(Boolean),
                            }))
                          }
                          placeholder="/blog, /docs, /products"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="exclude-paths">Exclude Paths (comma-separated)</Label>
                        <Textarea
                          id="exclude-paths"
                          value={config.excludePaths?.join(", ") || ""}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              excludePaths: e.target.value
                                .split(",")
                                .map((path) => path.trim())
                                .filter(Boolean),
                            }))
                          }
                          placeholder="/admin, /private, /temp"
                          rows={2}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Batch Options */}
              {type === "batch" && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span>Batch Options</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max-concurrency">Max Concurrency</Label>
                        <Input
                          id="max-concurrency"
                          type="number"
                          min="1"
                          max="50"
                          value={config.maxConcurrency || 5}
                          onChange={(e) => setConfig((prev) => ({ ...prev, maxConcurrency: Number.parseInt(e.target.value) || 5 }))}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ignore-invalid-urls"
                          checked={config.ignoreInvalidURLs || false}
                          onCheckedChange={(checked) =>
                            setConfig((prev) => ({ ...prev, ignoreInvalidURLs: checked as boolean }))
                          }
                        />
                        <Label htmlFor="ignore-invalid-urls" className="text-sm">
                          Ignore invalid URLs
                        </Label>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
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
