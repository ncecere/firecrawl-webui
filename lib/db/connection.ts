import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

// Lazy-loaded database connection
let _db: ReturnType<typeof drizzle> | null = null
let _sqlite: any = null

function initDb() {
  if (_db) return _db

  // Dynamic import to avoid build-time issues
  const Database = require('better-sqlite3')
  
  // Database file path
  const dbPath = path.join(process.cwd(), 'data', 'firecrawl.db')

  // Ensure data directory exists
  const dataDir = path.dirname(dbPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Create SQLite connection
  _sqlite = new Database(dbPath)

  // Enable WAL mode for better concurrent access
  _sqlite.pragma('journal_mode = WAL')

  // Create Drizzle instance
  _db = drizzle(_sqlite, { schema })
  
  return _db
}

// Export lazy-loaded database instance
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const dbInstance = initDb()
    return (dbInstance as any)[prop]
  }
})

// Initialize database with migrations
export async function initializeDatabase() {
  try {
    // Run migrations
    migrate(db, { migrationsFolder: path.join(process.cwd(), 'lib/db/migrations') })
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// Close database connection
export function closeDatabase() {
  if (_sqlite) {
    _sqlite.close()
  }
}

// Export the raw SQLite instance for advanced operations
export function getSqlite() {
  initDb()
  return _sqlite
}
