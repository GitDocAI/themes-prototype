import { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { Banner } from './components/Banner'
import { SettingsSidebar } from './components/SettingsSidebar'
import { TabBar } from './components/TabBar'
import { Sidebar } from './components/Sidebar'
import { Footer } from './components/Footer'
import { PageViewer } from './components/PageViewer'
import { TOC } from './components/TOC'
import { RightPanel } from './components/RightPanel'
import { PrevNextNavigation } from './components/PrevNextNavigation'
import { SearchModal } from './components/SearchModal'
import { configLoader } from './services/configLoader'
import { navigationService } from './services/navigationService'
import type { Tab } from './services/configLoader'
import type { NavigationItem } from './types/navigation'
import { useTheme } from './hooks/useTheme'
import { useRightPanelContent } from './hooks/useRightPanelContent'
import { useConfig } from './hooks/useConfig'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primeicons/primeicons.css'
import './App.css'

function App() {
  const { theme, toggleTheme, isConfigLoaded } = useTheme()
  const { updateTrigger } = useConfig() // Subscribe to config changes
  const viteMode = import.meta.env.VITE_MODE || 'production'
  const isProductionMode = viteMode === 'production'
  const isDevModeEnv = viteMode === 'dev'
  const [isDevMode, setIsDevMode] = useState<boolean>(isDevModeEnv)
  const [isSettingsSidebarOpen, setIsSettingsSidebarOpen] = useState<boolean>(false)
  const [error] = useState<string | null>(null)
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [currentTab, setCurrentTab] = useState<string>('')
  const [tabs, setTabs] = useState<Tab[]>([])
  const [primaryColor, setPrimaryColor] = useState<string>('#3b82f6')
  const [sidebarItems, setSidebarItems] = useState<NavigationItem[]>([])
  const [currentPath, setCurrentPath] = useState<string>('')
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false)

  // Use custom hook to detect RightPanel content
  const rightPanelContent = useRightPanelContent(currentPath)

  // Debug log
  useEffect(() => {
  }, [rightPanelContent])

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchModal(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Initialize navigation from URL, localStorage, or defaults
  useEffect(() => {
    if (isConfigLoaded) {
      const config = configLoader.getConfig()
      if (config) {
        setPrimaryColor(configLoader.getPrimaryColor(theme))

        // Initialize navigation state
        const navState = navigationService.initialize()

        // Set version
        if (navState.version) {
          setCurrentVersion(navState.version)
        }

        // Load tabs
        const loadedTabs = configLoader.getTabs(navState.version)
        setTabs(loadedTabs)

        // Set tab
        if (navState.tab) {
          setCurrentTab(navState.tab)
        }

        // Set page
        if (navState.page) {
          setCurrentPath(navState.page)
        }

      }
    }
  }, [isConfigLoaded, theme])

  // Update sidebar items when version or tab changes
  useEffect(() => {
    if (tabs.length > 0 && currentTab) {
      const currentTabObj = tabs.find(t => t.tab === currentTab)
      if (currentTabObj && currentTabObj.items) {
        setSidebarItems(currentTabObj.items)
      } else {
        setSidebarItems([])
      }
    }
  }, [currentTab, tabs])

  // Update document title when page changes
  useEffect(() => {
    if (currentPath) {
      const breadcrumb = navigationService.getBreadcrumb(currentPath, currentVersion, currentTab)
      if (breadcrumb.length > 0) {
        // Only use the last item (page title) from breadcrumb
        const pageTitle = breadcrumb[breadcrumb.length - 1]
        document.title = `${pageTitle} - ${configLoader.getConfig()?.name || 'Documentation'}`
      }
    }
  }, [currentPath, currentVersion, currentTab])

  // React to config changes without page reload
  useEffect(() => {
    if (updateTrigger > 0) {
      const config = configLoader.getConfig()
      if (config) {
        setPrimaryColor(configLoader.getPrimaryColor(theme))
        const loadedTabs = configLoader.getTabs(currentVersion)
        setTabs(loadedTabs)
        // Don't update sidebarItems here - let the other useEffect handle it when tabs changes
      }
    }
  }, [updateTrigger, currentVersion, theme])

  if (!isConfigLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#3b82f6' }}></i>
      </div>
    )
  }

  if (error) {
    return (
      <>
        <Navbar theme={theme} onThemeChange={toggleTheme} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c00'
          }}>
            <h2 style={{ margin: '0 0 10px 0' }}>Error Loading Documentation</h2>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        </div>
      </>
    )
  }

  const handleVersionChange = (version: string) => {
    // Use navigation service to change version
    const newState = navigationService.changeVersion(version)

    setCurrentVersion(newState.version!)

    // Update tabs when version changes
    const versionTabs = configLoader.getTabs(newState.version)
    setTabs(versionTabs)

    // Handle tab and sidebar updates
    if (versionTabs.length === 0) {
      // No tabs in this version - clear everything
      setCurrentTab('')
      setSidebarItems([])
      setCurrentPath('')
    } else if (newState.tab) {
      // Version has tabs - update tab and sidebar
      setCurrentTab(newState.tab)

      // Update sidebar items when tab changes
      const currentTabObj = versionTabs.find(t => t.tab === newState.tab)
      if (currentTabObj && currentTabObj.items) {
        setSidebarItems(currentTabObj.items)
      } else {
        setSidebarItems([])
      }

      if (newState.page) {
        setCurrentPath(newState.page)
      } else {
        setCurrentPath('')
      }
    }

  }

  const handleTabChange = (tabName: string) => {

    // Use navigation service to change tab
    const newState = navigationService.changeTab(tabName, currentVersion)

    if (newState.tab) {
      setCurrentTab(newState.tab)
    }

    // Update sidebar items when tab changes
    const currentTabObj = tabs.find(t => t.tab === tabName)
    if (currentTabObj && currentTabObj.items) {
      setSidebarItems(currentTabObj.items)
    } else {
      setSidebarItems([])
    }

    // Always update the path, even if empty
    if (newState.page) {
      setCurrentPath(newState.page)
    } else {
      console.warn('[App] No page found for tab:', tabName)
    }

  }

  const handleNavigate = (path: string, headingId?: string) => {
    // Use navigation service to navigate
    navigationService.navigateTo(path, currentVersion, currentTab)
    setCurrentPath(path)

    // If headingId is provided, scroll to it after a short delay
    if (headingId) {
      setTimeout(() => {
        const element = document.getElementById(headingId)
        if (element) {
          // Scroll to element with smooth behavior
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })

          // Add highlight effect
          element.style.transition = 'background-color 0.3s ease'
          element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'

          setTimeout(() => {
            element.style.backgroundColor = ''
          }, 2000)
        }
      }, 300)
    }
  }

  const toggleDevMode = () => {
    setIsDevMode(prev => !prev)
  }

  const toggleSettingsSidebar = () => {
    setIsSettingsSidebarOpen(prev => !prev)
  }

  return (
    <>
      {/* Main content wrapper that shifts when sidebar is open */}
      <div
        style={{
          marginRight: isSettingsSidebarOpen ? '450px' : '0',
          transition: 'margin-right 0.3s ease'
        }}
      >
        <Banner theme={theme} />
        <Navbar
          theme={theme}
          onThemeChange={toggleTheme}
          onVersionChange={handleVersionChange}
          currentVersion={currentVersion}
          isDevMode={isProductionMode ? false : isDevMode}
          onSearchClick={() => setShowSearchModal(true)}
        />
        {tabs.length > 0 && (
          <TabBar
            tabs={tabs}
            activeTab={currentTab}
            onTabChange={handleTabChange}
            theme={theme}
            primaryColor={primaryColor}
            isDevMode={isProductionMode ? false : isDevMode}
            currentVersion={currentVersion}
          />
        )}

        {/* Layout with Sidebar, Content, and TOC */}
        <div style={{
          display: 'flex',
          width: '100%',
          maxWidth: '1525px',
          margin: '0 auto',
          padding: '0 20px',
          position: 'relative',
          boxSizing: 'border-box',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
        }}>
        {/* Sidebar - Always render, even if empty */}
        <Sidebar
          items={sidebarItems}
          theme={theme}
          primaryColor={primaryColor}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          isDevMode={isProductionMode ? false : isDevMode}
          currentVersion={currentVersion}
          currentTab={currentTab}
        />

        {/* Main content */}
        <div style={{
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: '20px',
          paddingRight: '20px',
          marginLeft: '15px',
          minWidth: 0,
          minHeight: 'calc(100vh - var(--navbar-height, 64px) - var(--tabbar-height, 64px) - 40px)',
        }}>
          {/* Page Viewer */}
          <div style={{ flex: '1 0 auto' }}>
            <PageViewer key={currentPath} pagePath={currentPath} theme={theme} isDevMode={isProductionMode ? false : isDevMode} />
          </div>

          {/* Prev/Next Navigation */}
          {currentPath && sidebarItems.length > 0 && (
            <PrevNextNavigation
              currentPath={currentPath}
              sidebarItems={sidebarItems}
              onNavigate={handleNavigate}
              theme={theme}
              primaryColor={primaryColor}
            />
          )}

          {/* Footer */}
          <Footer theme={theme} isDevMode={isProductionMode ? false : isDevMode} />
        </div>

        {/* Table of Contents or RightPanel(s) - Hide for API Reference pages */}
        {currentPath && !currentPath.includes('api_reference') && (
          rightPanelContent && rightPanelContent.length > 0 ? (
            <div
              style={{
                width: '450px',
                position: 'sticky',
                top: 'var(--sidebar-top, 128px)',
                height: 'calc(100vh - var(--sidebar-top, 128px))',
                overflowY: 'auto',
              }}
            >
              {rightPanelContent.map((panel, index) => (
                <RightPanel
                  key={panel.attrs?.id || `panel-${index}`}
                  theme={theme}
                  content={panel}
                  isDevMode={isProductionMode ? false : isDevMode}
                />
              ))}
            </div>
          ) : (
            <TOC theme={theme} currentPath={currentPath} />
          )
        )}
        </div>
      </div>

      {/* Settings Sidebar - Only if NOT in production mode */}
      {!isProductionMode && (
        <SettingsSidebar
          theme={theme}
          isDevMode={isDevMode}
          onDevModeToggle={toggleDevMode}
          isOpen={isSettingsSidebarOpen}
          onToggle={toggleSettingsSidebar}
        />
      )}

      {/* Search Modal */}
      <SearchModal
        visible={showSearchModal}
        onHide={() => setShowSearchModal(false)}
        onNavigate={handleNavigate}
        theme={theme}
      />
    </>
  )
}

export default App
