/**
 * API Reference Loader Service
 * Loads API reference endpoint data from JSON files
 */

import type { ApiReferenceProps } from '../types/ApiReference'
import { getApiReferenceJsonPath } from '../utils/apiReferenceUtils'

class ApiReferenceLoader {
  /**
   * Load API reference data from JSON file
   * @param pagePath - The path to the MDX page (e.g., "/v1.0.0/api_reference/applications/create_application.mdx")
   * @returns API reference data or null if not found
   */
  async loadApiReference(pagePath: string): Promise<ApiReferenceProps | null> {
    try {
      // Convert .mdx path to .json
      const jsonPath = getApiReferenceJsonPath(pagePath)

      // Fetch from public folder
      const response = await fetch(jsonPath)

      if (!response.ok) {
        console.error(`Failed to load API reference: ${jsonPath}`)
        return null
      }

      const data = await response.json()
      return data as ApiReferenceProps
    } catch (error) {
      console.error(`Error loading API reference ${pagePath}:`, error)
      return null
    }
  }
}

export const apiReferenceLoader = new ApiReferenceLoader()
