/**
 * Content Service
 * Handles saving content to filesystem or API
 */

export class ContentService {
  private static getBackendUrl(): string {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'
  }

  private static isBackendMode(): boolean {
    // Check if we should use backend API
    return import.meta.env.VITE_USE_BACKEND === 'true'
  }

  /**
   * Save content to backend API or download as file
   */
  static async saveContent(docId: string, content: string): Promise<void> {

    if (this.isBackendMode()) {
      // Backend API mode: Send to Go server
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

    } else {
      // Fallback mode: Download the file
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${docId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Show instructions
      alert(
        `Content downloaded as ${docId}.json\n\n` +
        `Please replace the file in your documentation folder manually.`
      )
    }
  }

  /**
   * Save configuration
   */
  static async saveConfig(config: any): Promise<void> {
    const configString = JSON.stringify(config, null, 2)

    if (this.isBackendMode()) {
      // Backend API mode: Send to Go server
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

    } else {
      // Fallback mode: Download the file
      const blob = new Blob([configString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'gitdocai.config.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert(
        'Configuration downloaded!\n\n' +
        'Please replace the file at:\n' +
        '/public/gitdocai.config.json'
      )
    }
  }
}
