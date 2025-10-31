/**
 * Page Loader Service
 * Loads page content from JSON files
 */

export interface Block {
  type: string
  content?: string
  items?: string[]
  code?: string
  title?: string
  snippets?: Array<{ language: string; code: string }>
  variant?: string
  [key: string]: any
}

export interface PageData {
  blocks: Block[]
}

class PageLoader {
  private cache: Map<string, PageData> = new Map()

  /**
   * Load page content from JSON file
   * Converts .mdx path to .json and loads from public folder via /api/docs/
   */
  async loadPage(pagePath: string): Promise<PageData | null> {
    try {
      // Check memory cache first
      if (this.cache.has(pagePath)) {
        return this.cache.get(pagePath)!
      }

      // Convert .mdx to .json and add /api/docs/ prefix
      const jsonPath = `/api/docs${pagePath.replace(/\.mdx$/, '.json')}`

      // Add timestamp to URL for cache busting
      const cacheBuster = `?t=${Date.now()}`
      const urlWithCacheBuster = `${jsonPath}${cacheBuster}`

      // Fetch from public folder with cache control headers
      const response = await fetch(urlWithCacheBuster, {
        cache: 'no-cache', // Force fresh fetch every time
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        console.error(`Failed to load page: ${jsonPath}`)
        return null
      }

      const data = await response.json()

      // Store in memory cache
      this.cache.set(pagePath, data)

      return data
    } catch (error) {
      console.error(`Error loading page ${pagePath}:`, error)
      return null
    }
  }

  /**
   * Clear cache for a specific page or all pages
   */
  clearCache(pagePath?: string): void {
    if (pagePath) {
      this.cache.delete(pagePath)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Invalidate cache for a page after saving
   * Clears both .json and .mdx versions
   */
  invalidateCache(pagePath: string): void {
    // Clear both .json and .mdx versions
    const jsonPath = pagePath.replace(/\.mdx$/, '.json')
    const mdxPath = pagePath.replace(/\.json$/, '.mdx')

    this.cache.delete(pagePath)
    this.cache.delete(jsonPath)
    this.cache.delete(mdxPath)

    console.log(`[PageLoader] Cache invalidated for: ${pagePath}`)
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

export const pageLoader = new PageLoader()
