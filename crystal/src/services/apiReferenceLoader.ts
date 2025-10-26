/**
 * API Reference Loader Service
 * Loads API reference endpoint data from JSON files
 */

import type { ApiReferenceProps } from '../types/ApiReference'
import { getApiReferenceJsonPath } from '../utils/apiReferenceUtils'

class ApiReferenceLoader {
  private cache: Map<string, ApiReferenceProps> = new Map()

  /**
   * Load API reference data from JSON file
   * @param pagePath - The path to the MDX page (e.g., "/v1.0.0/api_reference/applications/create_application.mdx")
   * @returns API reference data or null if not found
   */
  async loadApiReference(pagePath: string): Promise<ApiReferenceProps | null> {
    try {
      // Check memory cache first
      if (this.cache.has(pagePath)) {
        return this.cache.get(pagePath)!
      }

      // Convert .mdx path to .json
      const jsonPath = getApiReferenceJsonPath(pagePath)

      // Fetch from public folder with cache control headers
      const response = await fetch(jsonPath, {
        cache: 'no-cache', // Force fresh fetch every time
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        console.error(`Failed to load API reference: ${jsonPath}`)
        return null
      }

      const data = await response.json()

      // Store in memory cache
      this.cache.set(pagePath, data as ApiReferenceProps)

      return data as ApiReferenceProps
    } catch (error) {
      console.error(`Error loading API reference ${pagePath}:`, error)
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
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

export const apiReferenceLoader = new ApiReferenceLoader()
