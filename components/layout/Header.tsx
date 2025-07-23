"use client"

import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface HeaderProps {
  apiEndpoint: string
  onApiEndpointChange: (endpoint: string) => void
  runningJobsCount: number
}

export function Header({ apiEndpoint, onApiEndpointChange, runningJobsCount }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image 
              src="/firecrawl-webui.png" 
              alt="Firecrawl WebUI Logo" 
              width={48} 
              height={48}
              className="h-10 w-10"
            />
            <h1 className="text-2xl font-bold">Firecrawl WebUI</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="api-endpoint" className="text-sm">
                API Endpoint:
              </Label>
              <Input
                id="api-endpoint"
                value={apiEndpoint}
                onChange={(e) => onApiEndpointChange(e.target.value)}
                className="w-48"
                placeholder="http://localhost:3002"
              />
            </div>
            {runningJobsCount > 0 && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{runningJobsCount} running</span>
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
