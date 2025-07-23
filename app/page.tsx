"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, Link, Layers, Map } from "lucide-react"
import ScrapeCrawlForm from "@/components/scrape-crawl-form"
import MapForm from "@/components/map-form"
import { Header } from "@/components/layout/Header"
import { StatsCards } from "@/components/layout/StatsCards"
import { JobList } from "@/components/jobs/JobList"
import { JobDetails } from "@/components/jobs/JobDetails"
import { useJobs } from "@/hooks/useJobs"
import { useApiEndpoint } from "@/hooks/useLocalStorage"
import { Job } from "@/types/jobs"

export default function FirecrawlFrontend() {
  const [activeTab, setActiveTab] = useState("scrape")
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [apiEndpoint, setApiEndpoint] = useApiEndpoint()
  
  const {
    jobs,
    stats,
    addJob,
    retryJob,
    clearAllJobs,
  } = useJobs({ apiEndpoint })

  const handleJobCreate = (job: Job) => {
    addJob(job)
  }

  const handleViewDetails = (jobId: string) => {
    setSelectedJob(jobId)
  }

  const handleRetry = (jobId: string) => {
    retryJob(jobId)
  }

  const selectedJobData = selectedJob ? jobs.find((job) => job.id === selectedJob) : null

  const runningJobsCount = stats.running

  return (
    <div className="min-h-screen bg-background">
      <Header 
        apiEndpoint={apiEndpoint}
        onApiEndpointChange={setApiEndpoint}
        runningJobsCount={runningJobsCount}
      />

      <main className="container mx-auto px-4 py-8">
        <StatsCards stats={stats} />

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
            <JobList 
              jobs={jobs}
              onViewDetails={handleViewDetails}
              onRetry={handleRetry}
              onClearAll={clearAllJobs}
            />

            {selectedJobData && (
              <JobDetails 
                job={selectedJobData}
                onClose={() => setSelectedJob(null)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
