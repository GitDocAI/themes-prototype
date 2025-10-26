import { useState, useEffect } from 'react'
import { configLoader } from '../services/configLoader'

interface FooterItem {
  type: string
  reference: string
}

interface FooterProps {
  theme: 'light' | 'dark'
}

export const Footer: React.FC<FooterProps> = ({ theme }) => {
  const [siteName, setSiteName] = useState('')
  const [footerItems, setFooterItems] = useState<FooterItem[]>([])
  const [colors, setColors] = useState({
    text: '',
    secondaryText: '',
    border: ''
  })

  useEffect(() => {
    const config = configLoader.getConfig()
    if (config) {
      setSiteName(configLoader.getName())
      setFooterItems(configLoader.getFooterItems())
      setColors({
        text: configLoader.getTextColor(theme),
        secondaryText: configLoader.getSecondaryTextColor(theme),
        border: theme === 'light' ? '#e5e7eb' : '#4b5563'
      })
    }
  }, [theme])

  const currentYear = new Date().getFullYear()

  return (
    <footer
      style={{
        borderTop: `0.5px solid ${colors.border}`,
        padding: '24px 32px',
        marginTop: '60px'
      }}
    >
      <div
        style={{
          width: '100%'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          {/* Site name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: colors.text
              }}
            >
              {siteName}
            </span>
          </div>

          {/* Social links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {footerItems.map((item, idx) => {
              // Map social media types to PrimeIcons
              const iconMap: Record<string, string> = {
                'github': 'github',
                'linkedin': 'linkedin',
                'x': 'twitter',
                'facebook': 'facebook',
                'youtube': 'youtube',
                'instagram': 'instagram',
                'link': 'link'
              }
              const iconName = iconMap[item.type.toLowerCase()] || 'link'

              return (
                <a
                  key={idx}
                  href={item.reference}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.type}
                  style={{
                    color: colors.secondaryText,
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.text
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.secondaryText
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  }}
                >
                  <i className={`pi pi-${iconName}`} style={{ fontSize: '28px' }} />
                </a>
              )
            })}
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '16px'
          }}
        >
          <small
            style={{
              fontSize: '11px',
              color: colors.secondaryText,
              opacity: 0.6
            }}
          >
            © {currentYear} all rights reserved
          </small>
        </div>
      </div>
    </footer>
  )
}
