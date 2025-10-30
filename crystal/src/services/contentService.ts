/**
 * Content Service
 * Handles saving content to filesystem or API
 */

import { pageLoader } from './pageLoader'
import { apiReferenceLoader } from './apiReferenceLoader'
import { configLoader } from './configLoader'

export class ContentService {
  private static getBackendUrl(): string {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'
  }

  /**
   * Save content to backend API
   */
  static async saveContent(docId: string, content: string): Promise<void> {
    // Remove leading slash from docId if present to avoid double slashes
    const cleanDocId = docId.startsWith('/') ? docId.slice(1) : docId
    const url = `${this.getBackendUrl()}/docs/${cleanDocId}`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ContentService] Error response:', errorText)
      throw new Error(`Failed to save content: ${response.statusText} - ${errorText}`)
    }

    // Invalidate cache after successful save
    pageLoader.invalidateCache(docId)
    apiReferenceLoader.invalidateCache(docId)

    console.log(`[ContentService] Content saved and cache invalidated for: ${docId}`)
  }

  /**
   * Save configuration to backend API
   */
  static async saveConfig(config: any): Promise<void> {
    const configString = JSON.stringify(config, null, 2)

    const response = await fetch(`${this.getBackendUrl()}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: configString,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to save configuration: ${response.statusText} - ${errorText}`)
    }

    // Reload config after successful save to invalidate cache
    await configLoader.reloadConfig()

    console.log('[ContentService] Configuration saved and cache reloaded')
  }
}
