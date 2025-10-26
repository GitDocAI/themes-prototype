import { useState, useEffect } from 'react'
import { configLoader } from '../services/configLoader'

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)

  useEffect(() => {
    // Load config and set initial theme
    const initTheme = async () => {
      try {
        await configLoader.loadConfig()
        const defaultTheme = configLoader.getDefaultThemeMode()

        // Check localStorage for saved preference
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        const initialTheme = savedTheme || defaultTheme

        setTheme(initialTheme)
        setIsConfigLoaded(true)
        applyTheme(initialTheme)
      } catch (error) {
        console.error('[useTheme] Failed to load config:', error)
        // Set defaults and mark as loaded anyway to prevent infinite loading
        setTheme('light')
        setIsConfigLoaded(true)
        // Apply default theme without config
        document.body.style.backgroundColor = '#ffffff'
        document.body.style.color = '#111827'
      }
    }

    initTheme()
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const config = configLoader.getConfig()
    if (!config) return

    const backgroundColor = configLoader.getBackgroundColor(newTheme)
    const primaryColor = configLoader.getPrimaryColor(newTheme)
    const textColor = newTheme === 'light' ? '#111827' : '#f9fafb'

    // Apply theme to document
    document.documentElement.style.setProperty('--bg-color', backgroundColor)
    document.documentElement.style.setProperty('--primary-color', primaryColor)
    document.documentElement.style.setProperty('--text-color', textColor)
    document.body.style.backgroundColor = backgroundColor
    document.body.style.color = textColor

    // Update favicon
    const favicon = configLoader.getFavicon()
    if (favicon) {
      updateFavicon(favicon)
    }
  }

  const updateFavicon = (faviconPath: string) => {
    const link: HTMLLinkElement = document.querySelector("link[rel~='icon']") || document.createElement('link')
    link.type = 'image/svg+xml'
    link.rel = 'icon'
    link.href = faviconPath
    if (!document.querySelector("link[rel~='icon']")) {
      document.head.appendChild(link)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  return {
    theme,
    toggleTheme,
    isConfigLoaded
  }
}
