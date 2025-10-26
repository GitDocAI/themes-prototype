import { useEffect, useState } from 'react'
import type { NavigationItem } from '../types/navigation'

interface PrevNextNavigationProps {
  currentPath: string
  sidebarItems: NavigationItem[]
  onNavigate?: (path: string) => void
  theme: 'light' | 'dark'
  primaryColor: string
}

interface FlatPage {
  title: string
  page: string
}

export const PrevNextNavigation: React.FC<PrevNextNavigationProps> = ({
  currentPath,
  sidebarItems,
  onNavigate,
  theme,
  primaryColor
}) => {
  const [pages, setPages] = useState<FlatPage[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)

  // Flatten the navigation tree to get a linear list of pages
  function flattenPages(items: NavigationItem[]): FlatPage[] {
    return items.flatMap(item => {
      if (item.type === 'page' || item.type === 'swagger' || item.type === 'openapi') {
        return [{ title: item.title, page: item.page || '' }]
      }
      if (item.type === 'group' || item.type === 'dropdown') {
        if (item.children) return flattenPages(item.children)
      }
      return []
    })
  }

  useEffect(() => {
    const flat = flattenPages(sidebarItems)
    setPages(flat)

    const index = flat.findIndex(p => p.page === currentPath)
    setCurrentIndex(index)
  }, [currentPath, sidebarItems])

  if (currentIndex === null || pages.length === 0) return null

  const prev = pages[currentIndex - 1]
  const next = pages[currentIndex + 1]

  const handleClick = (page: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(page)
    }
  }

  // Convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '59, 130, 246'
  }

  const primaryRgb = hexToRgb(primaryColor)

  return (
    <div
      style={{
        marginTop: 'auto',
        paddingTop: '24px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      {prev ? (
        <a
          href={prev.page}
          onClick={handleClick(prev.page)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: theme === 'light' ? '#374151' : '#d1d5db',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = primaryColor
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme === 'light' ? '#374151' : '#d1d5db'
          }}
        >
          <i className="pi pi-arrow-left" style={{ fontSize: '16px' }} />
          <span style={{ fontSize: '18px', fontWeight: '500' }}>{prev.title}</span>
        </a>
      ) : (
        <div></div>
      )}

      {next ? (
        <a
          href={next.page}
          onClick={handleClick(next.page)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: theme === 'light' ? '#374151' : '#d1d5db',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = primaryColor
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme === 'light' ? '#374151' : '#d1d5db'
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: '500' }}>{next.title}</span>
          <i className="pi pi-arrow-right" style={{ fontSize: '16px' }} />
        </a>
      ) : (
        <div></div>
      )}
    </div>
  )
}
