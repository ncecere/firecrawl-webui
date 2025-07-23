// Core application types
export interface ApiEndpoint {
  url: string
  name: string
}

export interface AppSettings {
  apiEndpoint: string
  theme: 'light' | 'dark' | 'system'
}

// Re-export all types for easy importing
export * from './jobs'
export * from './api'
