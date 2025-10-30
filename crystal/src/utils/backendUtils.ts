/**
 * Backend Utilities
 * Provides helpers for backend communication
 */

/**
 * Get the backend API URL from environment variables
 */
export function getBackendUrl(): string {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'
}

/**
 * Fetch gitdocai.config.json from public folder
 */
export async function fetchConfig(): Promise<any> {
  const response = await fetch('/gitdocai.config.json')

  if (!response.ok) {
    throw new Error(`Failed to load config: ${response.statusText}`)
  }

  return response.json()
}
