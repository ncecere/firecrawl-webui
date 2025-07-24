"use client"

import { useEffect, useState } from 'react'

export function SchedulerInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initializeScheduler = async () => {
      if (initialized) return

      try {
        console.log('Initializing scheduler...')
        
        const response = await fetch('/api/startup', {
          method: 'POST',
        })

        const data = await response.json()

        if (data.success) {
          console.log('✅ Scheduler initialized successfully')
          console.log(`📋 ${data.activeJobs} active jobs scheduled`)
          setInitialized(true)
        } else {
          console.error('❌ Failed to initialize scheduler:', data.error)
        }
      } catch (error) {
        console.error('❌ Failed to initialize scheduler:', error)
      }
    }

    // Initialize scheduler on component mount
    initializeScheduler()
  }, [initialized])

  // This component doesn't render anything visible
  return null
}
