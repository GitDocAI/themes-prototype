import { useState, useEffect } from 'react'
import { pageLoader, type PageData } from '../services/pageLoader'
import { PageRenderer } from './PageRenderer'
import { ContentService } from '../services/contentService'
import { apiReferenceLoader } from '../services/apiReferenceLoader'
import { isApiReferencePath } from '../utils/apiReferenceUtils'
import { ApiReference } from './ApiReference'
import type { ApiReferenceProps } from '../types/ApiReference'

interface PageViewerProps {
  pagePath: string
  theme: 'light' | 'dark'
  isDevMode?: boolean
}

export const PageViewer: React.FC<PageViewerProps> = ({ pagePath, theme, isDevMode = false }) => {
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [apiReferenceData, setApiReferenceData] = useState<ApiReferenceProps | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPage = async () => {
      if (!pagePath) {
        setPageData(null)
        setApiReferenceData(null)
        return
      }

      try {
        setError(null)

        // Check if this is an API reference page
        if (isApiReferencePath(pagePath)) {
          const apiData = await apiReferenceLoader.loadApiReference(pagePath)

          if (!apiData) {
            setError('API reference not found')
            setApiReferenceData(null)
            setPageData(null)
          } else {
            setApiReferenceData(apiData)
            setPageData(null)
          }
        } else {
          // Regular page
          const data = await pageLoader.loadPage(pagePath)

          if (!data) {
            setError('Page not found')
            setPageData(null)
            setApiReferenceData(null)
          } else {
            setPageData(data)
            setApiReferenceData(null)
          }
        }
      } catch (err) {
        console.error('Error loading page:', err)
        setError('Failed to load page')
        setPageData(null)
        setApiReferenceData(null)
      }
    }

    loadPage()
  }, [pagePath])

  if (error) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c00'
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Error</h3>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    )
  }

  // Render API reference page
  if (apiReferenceData) {
    return <ApiReference {...apiReferenceData} theme={theme} />
  }

  if (!pageData) {
    return (
      <div style={{ padding: '20px', color: '#6b7280' }}>
        <p>Select a page from the sidebar to view its content.</p>
      </div>
    )
  }

  // If in dev mode, use the editable PageRenderer
  if (isDevMode) {
    const editablePageData = {
      id: pagePath,
      title: pageData.blocks?.find((b: any) => b.type === 'h1')?.content || 'Untitled',
      description: '',
      // Support both formats: legacy blocks array or new Tiptap content
      blocks: pageData.blocks ? pageData.blocks.map((block: any, idx: number) => ({
        ...block,
        id: `block-${idx}`
      })) : undefined,
      content: (pageData as any).content // Tiptap JSON format
    }

    return (
      <PageRenderer
        pageData={editablePageData as any}
        theme={theme}
        isDevMode={true}
        onSave={async (pageId, updatedData) => {

          // Save in Tiptap JSON format
          const dataToSave = {
            content: updatedData.content
          }

          // Convert .mdx path to .json for saving
          const jsonPath = pageId.replace(/\.mdx$/, '.json')
          await ContentService.saveContent(jsonPath, JSON.stringify(dataToSave, null, 2))
        }}
      />
    )
  }

  // Preview mode - read-only, use TiptapEditor in non-editable mode
  const previewPageData = {
    id: pagePath,
    title: pageData.blocks?.find((b: any) => b.type === 'h1')?.content || 'Untitled',
    description: '',
    // Support both formats: legacy blocks array or new Tiptap content
    blocks: pageData.blocks,
    content: (pageData as any).content // Tiptap JSON format
  }

  return (
    <PageRenderer
      pageData={previewPageData as any}
      theme={theme}
      isDevMode={false}
      onSave={async () => {
        // No-op in preview mode
      }}
    />
  )
}
