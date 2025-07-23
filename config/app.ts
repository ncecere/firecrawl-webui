// Application configuration
export const APP_CONFIG = {
  name: "Firecrawl WebUI",
  version: "1.0.0",
  description: "A web interface for the Firecrawl API",
  
  // Default settings
  defaults: {
    apiEndpoint: "http://localhost:3002",
    theme: "system" as const,
    jobsPerPage: 10,
    maxJobHistory: 50,
  },
  
  // Feature flags
  features: {
    darkMode: true,
    jobExport: true,
    batchProcessing: true,
    llmExtraction: true,
    advancedOptions: true,
  },
  
  // UI configuration
  ui: {
    sidebar: {
      defaultWidth: 320,
      minWidth: 280,
      maxWidth: 500,
    },
    
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20, 50],
    },
    
    polling: {
      enabled: true,
      interval: 3000,
      maxAttempts: 120,
    },
  },
  
  // Validation rules
  validation: {
    url: {
      maxLength: 2048,
      protocols: ['http:', 'https:'],
    },
    
    jobName: {
      maxLength: 100,
      minLength: 1,
    },
    
    batchUrls: {
      maxCount: 1000,
      minCount: 1,
    },
  },
  
  // Performance settings
  performance: {
    localStorage: {
      maxJobs: 50,
      maxResultsPerJob: 5,
      compressionThreshold: 1024 * 1024, // 1MB
    },
    
    ui: {
      virtualScrolling: true,
      lazyLoading: true,
      debounceDelay: 300,
    },
  },
  
  // Error handling
  errors: {
    retryAttempts: 3,
    retryDelay: 1000,
    showStackTrace: process.env.NODE_ENV === 'development',
  },
} as const

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    ...APP_CONFIG,
    
    // Development overrides
    ...(isDevelopment && {
      errors: {
        ...APP_CONFIG.errors,
        showStackTrace: true,
      },
      ui: {
        ...APP_CONFIG.ui,
        polling: {
          ...APP_CONFIG.ui.polling,
          interval: 1000, // Faster polling in development
        },
      },
    }),
    
    // Production overrides
    ...(isProduction && {
      performance: {
        ...APP_CONFIG.performance,
        localStorage: {
          ...APP_CONFIG.performance.localStorage,
          maxJobs: 100, // More jobs in production
        },
      },
    }),
  }
}

// Type for the configuration
export type AppConfig = typeof APP_CONFIG
