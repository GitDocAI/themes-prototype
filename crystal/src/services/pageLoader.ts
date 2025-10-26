/**
 * Page Loader Service
 * Loads page content from JSON files
 */

export interface Block {
  type: string
  content?: string
  items?: string[]
}

export interface PageData {
  blocks: Block[]
}

class PageLoader {
  /**
   * Load page content from JSON file
   * Converts .mdx path to .json and loads from public folder
   */
  async loadPage(pagePath: string): Promise<PageData | null> {
    try {
      // Convert .mdx to .json
      const jsonPath = pagePath.replace(/\.mdx$/, '.json')

      // Fetch from public folder
      const response = await fetch(jsonPath)

      if (!response.ok) {
        console.error(`Failed to load page: ${jsonPath}`)
        return null
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Error loading page ${pagePath}:`, error)
      return null
    }
  }
}

export const pageLoader = new PageLoader()
