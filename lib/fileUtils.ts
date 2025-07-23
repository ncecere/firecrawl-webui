import JSZip from "jszip"
import { saveAs } from "file-saver"
import { Job } from "@/types/jobs"

// File name sanitization
export const sanitizeFileName = (name: string): string => {
  return name
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid chars
    .replace(/\s+/g, '_') // Replace spaces
    .replace(/_+/g, '_') // Remove duplicate underscores
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 100) // Limit length
}

// Extract domain from URL
export const extractDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '')
    return sanitizeFileName(domain.replace(/\./g, '-'))
  } catch {
    return 'unknown-domain'
  }
}

// Extract page slug from URL
export const extractPageSlug = (url: string): string => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const slug = pathname.split('/').filter(Boolean).pop() || 'index'
    return sanitizeFileName(slug)
  } catch {
    return 'unknown-page'
  }
}

// Format date for file names
export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

// Get file extension for format
export const getFileExtension = (format: string): string => {
  const extensions: Record<string, string> = {
    'markdown': '.md',
    'html': '.html',
    'rawHtml': '.html',
    'screenshot': '.png'
  }
  return extensions[format] || '.txt'
}

// Generate file name for downloads
export const generateFileName = (
  startingUrl: string, 
  pageUrl: string, 
  format: string, 
  index?: number
): string => {
  const domain = extractDomain(startingUrl)
  const pageSlug = extractPageSlug(pageUrl)
  const date = formatDate(new Date())
  const extension = getFileExtension(format)
  
  const baseName = `${domain}_${pageSlug}_${date}`
  const indexSuffix = index !== undefined ? `_${index}` : ''
  
  return `${baseName}${indexSuffix}${extension}`
}

// Download JSON results
export const downloadJsonResults = (job: Job): void => {
  if (!job.data) return

  const dataStr = JSON.stringify(job.data, null, 2)
  const dataBlob = new Blob([dataStr], { type: "application/json" })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${job.config.name || "results"}-${job.id}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Download ZIP files for scrape/crawl/batch jobs
export const downloadZipFiles = async (job: Job): Promise<void> => {
  if (!job.data || job.data.length === 0) return

  // Warning for large jobs
  if (job.data.length > 100) {
    const confirmed = confirm(
      `This job has ${job.data.length} pages. Generating a zip file may take some time and use significant memory. Continue?`
    )
    if (!confirmed) return
  }

  try {
    const zip = new JSZip()
    const selectedFormats = job.config.formats || ['markdown']
    const startingUrl = getJobUrl(job) || 'unknown-site'
    
    // Track file names to handle duplicates
    const fileNameCounts: Record<string, number> = {}

    for (let i = 0; i < job.data.length; i++) {
      const item = job.data[i]
      const pageUrl = item.metadata?.sourceURL || item.url || `page-${i}`

      for (const format of selectedFormats) {
        let content = ''
        let fileName = generateFileName(startingUrl, pageUrl, format)

        // Handle duplicate file names
        if (fileNameCounts[fileName]) {
          fileNameCounts[fileName]++
          const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'))
          const ext = fileName.substring(fileName.lastIndexOf('.'))
          fileName = `${nameWithoutExt}_${fileNameCounts[fileName]}${ext}`
        } else {
          fileNameCounts[fileName] = 1
        }

        // Extract content based on format
        switch (format) {
          case 'markdown':
            content = item.markdown || ''
            break
          case 'html':
            content = item.html || ''
            break
          case 'rawHtml':
            content = item.rawHtml || ''
            break
          case 'screenshot':
            if (item.screenshot) {
              // Handle base64 screenshot data
              const base64Data = item.screenshot.replace(/^data:image\/[a-z]+;base64,/, '')
              zip.file(fileName, base64Data, { base64: true })
              continue
            }
            break
          default:
            content = JSON.stringify(item[format] || '', null, 2)
        }

        if (content) {
          zip.file(fileName, content)
        }
      }
    }

    // Generate and download the zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const zipFileName = `${job.config.name || 'firecrawl-results'}_${formatDate(new Date())}.zip`
    saveAs(zipBlob, sanitizeFileName(zipFileName))

  } catch (error) {
    console.error('Error generating zip file:', error)
    alert('Failed to generate zip file. Please try downloading as JSON instead.')
  }
}

// Copy map results to clipboard
export const copyMapResults = async (job: Job): Promise<void> => {
  if (!job.data || job.data.length === 0) return

  try {
    // For map jobs, data is an array of URL strings
    const urlList = job.data.join('\n')
    await navigator.clipboard.writeText(urlList)
    
    // Show a brief success message (you could replace this with a toast notification)
    const button = document.activeElement as HTMLButtonElement
    const originalTitle = button?.title || ''
    if (button) {
      button.title = 'Copied!'
      setTimeout(() => {
        button.title = originalTitle
      }, 2000)
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    // Fallback: create a text area and select the text for manual copying
    const textArea = document.createElement('textarea')
    textArea.value = job.data.join('\n')
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('URLs copied to clipboard!')
  }
}

// Helper to get URL from job
const getJobUrl = (job: Job): string | undefined => {
  if ('url' in job) return job.url
  if ('urls' in job && job.urls.length > 0) return job.urls[0]
  return undefined
}
