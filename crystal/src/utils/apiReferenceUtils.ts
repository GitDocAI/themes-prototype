/**
 * API Reference Utilities
 * Helper functions for working with API reference pages
 */

/**
 * Check if a path is an API reference path
 * API reference paths follow the pattern: /version/api_reference/group/endpoint
 */
export function isApiReferencePath(path: string): boolean {
  // Remove leading slash and .mdx extension
  const cleanPath = path.replace(/^\//, '').replace(/\.mdx$/, '')

  // Check if path contains 'api_reference'
  return cleanPath.includes('api_reference')
}

/**
 * Convert a sidebar title to a URL slug
 * Example: "Create Application" -> "create_application"
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '')
}

/**
 * Build the JSON file path for an API reference page
 * Input: "/v1.0.0/api_reference/applications/create_application.mdx"
 * Output: "/v1.0.0/api_reference/applications/create_application.json"
 */
export function getApiReferenceJsonPath(mdxPath: string): string {
  return mdxPath.replace(/\.mdx$/, '.json')
}
