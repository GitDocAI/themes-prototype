import { Editor } from '@tiptap/react'
import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import './types'

interface EditorToolbarProps {
  editor: Editor
  theme: 'light' | 'dark'
}

export type EditorToolbarRef = {
  openLinkModal: () => void
}

const EditorToolbarComponent = forwardRef<EditorToolbarRef, EditorToolbarProps>(({ editor, theme }, ref) => {
  const [showInsertDropdown, setShowInsertDropdown] = useState(false)
  const [currentTextType, setCurrentTextType] = useState('paragraph')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkModalPosition, setLinkModalPosition] = useState<{ top: number; left: number } | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const linkModalRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowInsertDropdown(false)
      }
      if (linkModalRef.current && !linkModalRef.current.contains(event.target as Node)) {
        setShowLinkModal(false)
        setLinkModalPosition(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update current text type when editor selection changes
  useEffect(() => {
    if (!editor) return

    const updateTextType = () => {
      setCurrentTextType(getCurrentTextType())
    }

    editor.on('selectionUpdate', updateTextType)
    editor.on('update', updateTextType)

    // Initial update
    updateTextType()

    return () => {
      editor.off('selectionUpdate', updateTextType)
      editor.off('update', updateTextType)
    }
  }, [editor])

  // Get current text type
  const getCurrentTextType = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1'
    if (editor.isActive('heading', { level: 2 })) return 'h2'
    if (editor.isActive('heading', { level: 3 })) return 'h3'
    if (editor.isActive('blockquote')) return 'blockquote'
    return 'paragraph'
  }

  // Handle text type change
  const handleTextTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value

    switch (value) {
      case 'h1':
        editor.chain().focus().setHeading({ level: 1 }).run()
        break
      case 'h2':
        editor.chain().focus().setHeading({ level: 2 }).run()
        break
      case 'h3':
        editor.chain().focus().setHeading({ level: 3 }).run()
        break
      case 'blockquote':
        editor.chain().focus().setBlockquote().run()
        break
      case 'paragraph':
        editor.chain().focus().setParagraph().run()
        break
    }
  }

  const buttonStyle = (isActive = false) => ({
    padding: '6px 10px',
    backgroundColor: isActive
      ? (theme === 'light' ? '#e0e7ff' : '#3730a3')
      : 'transparent',
    color: theme === 'light' ? '#374151' : '#d1d5db',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  })

  const iconStyle = {
    fontSize: '16px',
  }

  const insertCard = () => {
    editor
      .chain()
      .focus()
      .setCardBlock({
        title: 'New Card',
        icon: 'pi pi-star',
        href: '',
      })
      .run()
    setShowInsertDropdown(false)
  }

  const insertCodeGroup = () => {
    editor
      .chain()
      .focus()
      .setCodeGroup()
      .run()
    setShowInsertDropdown(false)
  }

  const insertColumnGroup = () => {
    editor
      .chain()
      .focus()
      .setColumnGroup(2) // Always start with 2 columns
      .run()
    setShowInsertDropdown(false)
  }

  const insertRightPanel = () => {
    editor
      .chain()
      .focus()
      .setRightPanel()
      .run()
    setShowInsertDropdown(false)
  }


  const insertInfoBlock = () => {
    editor.chain().focus().insertContent('<div data-type="info-block">Info content</div>').run()
    setShowInsertDropdown(false)
  }

  const insertNoteBlock = () => {
    editor.chain().focus().insertContent('<div data-type="note-block">Note content</div>').run()
    setShowInsertDropdown(false)
  }

  const insertTipBlock = () => {
    editor.chain().focus().insertContent('<div data-type="tip-block">Tip content</div>').run()
    setShowInsertDropdown(false)
  }

  const insertWarningBlock = () => {
    editor.chain().focus().insertContent('<div data-type="warning-block">Warning content</div>').run()
    setShowInsertDropdown(false)
  }

  const insertDangerBlock = () => {
    editor.chain().focus().insertContent('<div data-type="danger-block">Danger content</div>').run()
    setShowInsertDropdown(false)
  }

  const insertAccordion = () => {
    setShowInsertDropdown(false)
  }

  const insertTabs = () => {
    setShowInsertDropdown(false)
  }

  const insertTable = () => {
    setShowInsertDropdown(false)
  }

  const insertImage = () => {
    setShowImageModal(true)
  }

  const insertEndpoint = () => {
    editor.chain().focus().setEndpointBlock({ method: 'GET', path: '/api/endpoint' }).run()
    setShowInsertDropdown(false)
  }

  const insertLabel = () => {
    editor.chain().focus().setLabelBlock({ label: 'Label', color: '#3b82f6', size: 'md' }).run()
    setShowInsertDropdown(false)
  }

  const openLinkModal = () => {
    // Check if we have link data from hover event
    const currentLinkData = (window as any).__currentLinkData

    let previousUrl = ''
    let linkText = ''
    let position = null

    if (currentLinkData) {
      // Use data from hover event
      previousUrl = currentLinkData.href
      linkText = currentLinkData.text
      position = currentLinkData.position
      // Clear the temporary data
      delete (window as any).__currentLinkData
    } else {
      // Fallback to getting from editor state
      previousUrl = editor.getAttributes('link').href || ''
      const { from, to } = editor.state.selection
      linkText = editor.state.doc.textBetween(from, to) || ''
    }

    setLinkUrl(previousUrl)
    setLinkTitle(linkText)
    setLinkModalPosition(position)
    setShowLinkModal(true)
  }

  // Expose openLinkModal to parent component
  useImperativeHandle(ref, () => ({
    openLinkModal,
  }))

  const setLink = () => {
    if (linkUrl === '') {
      editor.chain().focus().unsetLink().run()
      setShowLinkModal(false)
      return
    }

    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    const isLinkActive = editor.isActive('link')

    if (linkTitle && linkTitle.trim() !== '') {
      // User provided a title
      if (isLinkActive || selectedText !== '') {
        // Updating existing link or has selection - replace text and set link
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(`<a href="${linkUrl}">${linkTitle}</a>`)
          .run()
      } else {
        // No selection - insert new link with title
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkTitle}</a>`).run()
      }
    } else {
      // No title provided
      if (selectedText !== '') {
        // Has selection - just add/update link to existing text
        editor.chain().focus().setLink({ href: linkUrl }).run()
      } else {
        // No selection - insert URL as both text and link
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run()
      }
    }

    setShowLinkModal(false)
    setLinkUrl('')
    setLinkTitle('')
    setLinkModalPosition(null)
  }

  const removeLink = () => {
    editor.chain().focus().unsetLink().run()
    setShowLinkModal(false)
    setLinkUrl('')
    setLinkTitle('')
    setLinkModalPosition(null)
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 'calc(var(--navbar-height, 64px) + var(--tabbar-height, 64px))',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 12px',
        backgroundColor: theme === 'light' ? '#f9fafb' : '#1f2937',
        borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
        borderRadius: '8px',
        flexWrap: 'wrap',
      }}
    >
      {/* Text Type Selector */}
      <select
        value={currentTextType}
        onChange={handleTextTypeChange}
        style={{
          padding: '6px 10px',
          paddingRight: '28px',
          backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
          color: theme === 'light' ? '#374151' : '#d1d5db',
          border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
          borderRadius: '4px',
          fontSize: '14px',
          cursor: 'pointer',
          outline: 'none',
          minWidth: '120px',
          backgroundPosition: 'right 8px center',
          backgroundSize: '12px',
        }}
      >
        <option value="paragraph">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="blockquote">Quote</option>
      </select>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: theme === 'light' ? '#e5e7eb' : '#374151',
          margin: '0 4px',
        }}
      />

      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        style={buttonStyle(editor.isActive('bold'))}
        title="Bold"
        onMouseEnter={(e) => {
          if (!editor.isActive('bold')) {
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
          }
        }}
        onMouseLeave={(e) => {
          if (!editor.isActive('bold')) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <strong style={{ fontWeight: 'bold' }}>B</strong>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        style={buttonStyle(editor.isActive('italic'))}
        title="Italic"
        onMouseEnter={(e) => {
          if (!editor.isActive('italic')) {
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
          }
        }}
        onMouseLeave={(e) => {
          if (!editor.isActive('italic')) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <em style={{ fontStyle: 'italic' }}>I</em>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        style={buttonStyle(editor.isActive('strike'))}
        title="Strikethrough"
        onMouseEnter={(e) => {
          if (!editor.isActive('strike')) {
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
          }
        }}
        onMouseLeave={(e) => {
          if (!editor.isActive('strike')) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <span style={{ textDecoration: 'line-through' }}>S</span>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        style={buttonStyle(editor.isActive('underline'))}
        title="Underline"
        onMouseEnter={(e) => {
          if (!editor.isActive('underline')) {
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
          }
        }}
        onMouseLeave={(e) => {
          if (!editor.isActive('underline')) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <span style={{ textDecoration: 'underline' }}>U</span>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        style={buttonStyle(editor.isActive('code'))}
        title="Inline Code"
        onMouseEnter={(e) => {
          if (!editor.isActive('code')) {
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
          }
        }}
        onMouseLeave={(e) => {
          if (!editor.isActive('code')) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <span style={{ fontFamily: 'monospace' }}>&lt;/&gt;</span>
      </button>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: theme === 'light' ? '#e5e7eb' : '#374151',
          margin: '0 4px',
        }}
      />

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={buttonStyle(editor.isActive('bulletList'))}
        title="Bullet List"
        onMouseEnter={(e) => {
          if (!editor.isActive('bulletList')) {
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
          }
        }}
        onMouseLeave={(e) => {
          if (!editor.isActive('bulletList')) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <i className="pi pi-list" style={iconStyle}></i>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={buttonStyle(editor.isActive('orderedList'))}
        title="Numbered List"
        onMouseEnter={(e) => {
          if (!editor.isActive('orderedList')) {
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
          }
        }}
        onMouseLeave={(e) => {
          if (!editor.isActive('orderedList')) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <i className="pi pi-sort-numeric-down" style={iconStyle}></i>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        style={buttonStyle(editor.isActive('taskList'))}
        title="Task List"
        onMouseEnter={(e) => {
          if (!editor.isActive('taskList')) {
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
          }
        }}
        onMouseLeave={(e) => {
          if (!editor.isActive('taskList')) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <i className="pi pi-check-square" style={iconStyle}></i>
      </button>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: theme === 'light' ? '#e5e7eb' : '#374151',
          margin: '0 4px',
        }}
      />

      {/* Code Block */}
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        style={buttonStyle(editor.isActive('codeBlock'))}
        title="Code Block"
        onMouseEnter={(e) => {
          if (!editor.isActive('codeBlock')) {
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
          }
        }}
        onMouseLeave={(e) => {
          if (!editor.isActive('codeBlock')) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{'{ }'}</span>
      </button>

      {/* Horizontal Rule */}
      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        style={buttonStyle()}
        title="Horizontal Rule"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <i className="pi pi-minus" style={iconStyle}></i>
      </button>

      {/* Link Button */}
      <button
        onClick={openLinkModal}
        style={buttonStyle(editor.isActive('link'))}
        title="Insert Link"
        onMouseEnter={(e) => {
          if (!editor.isActive('link')) {
            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
          }
        }}
        onMouseLeave={(e) => {
          if (!editor.isActive('link')) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <i className="pi pi-link" style={iconStyle}></i>
      </button>

      {/* Image Button */}
      <button
        onClick={insertImage}
        style={buttonStyle()}
        title="Insert Image"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <i className="pi pi-image" style={iconStyle}></i>
      </button>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '24px',
          backgroundColor: theme === 'light' ? '#e5e7eb' : '#374151',
          margin: '0 4px',
        }}
      />

      {/* Insert Dropdown for Custom Components */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setShowInsertDropdown(!showInsertDropdown)}
          style={{
            ...buttonStyle(showInsertDropdown),
            fontWeight: '500',
          }}
          title="Insert Custom Component"
          onMouseEnter={(e) => {
            if (!showInsertDropdown) {
              e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
            }
          }}
          onMouseLeave={(e) => {
            if (!showInsertDropdown) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          <i className="pi pi-plus" style={iconStyle}></i>
          Insert
          <i className="pi pi-chevron-down" style={{ fontSize: '12px', marginLeft: '2px' }}></i>
        </button>

        {showInsertDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
              border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              minWidth: '200px',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={insertCard}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-id-card" style={{ fontSize: '16px', color: '#3b82f6' }}></i>
              Card
            </button>

            <button
              onClick={insertCodeGroup}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-code" style={{ fontSize: '16px', color: '#8b5cf6' }}></i>
              Code Group
            </button>

            <button
              onClick={insertColumnGroup}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-table" style={{ fontSize: '16px', color: '#10b981' }}></i>
              Columns
            </button>

            <button
              onClick={insertRightPanel}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-bars" style={{ fontSize: '16px', color: '#f59e0b' }}></i>
              Right Panel
            </button>

            <button
              onClick={insertTipBlock}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-lightbulb" style={{ fontSize: '16px', color: '#4ade80' }}></i>
              Tip
            </button>

            <button
              onClick={insertNoteBlock}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-pencil" style={{ fontSize: '16px', color: '#60a5fa' }}></i>
              Note
            </button>

            <button
              onClick={insertWarningBlock}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-exclamation-triangle" style={{ fontSize: '16px', color: '#facc15' }}></i>
              Warning
            </button>

            <button
              onClick={insertDangerBlock}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-times-circle" style={{ fontSize: '16px', color: '#f87171' }}></i>
              Danger
            </button>

            <button
              onClick={insertInfoBlock}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-info-circle" style={{ fontSize: '16px', color: '#38bdf8' }}></i>
              Info
            </button>

            <button
              onClick={insertAccordion}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-chevron-down" style={{ fontSize: '16px', color: '#a78bfa' }}></i>
              Accordion
            </button>

            <button
              onClick={insertTabs}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-folder" style={{ fontSize: '16px', color: '#f59e0b' }}></i>
              Tabs
            </button>

            <button
              onClick={insertTable}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-table" style={{ fontSize: '16px', color: '#8b5cf6' }}></i>
              Table
            </button>

            <button
              onClick={insertEndpoint}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-arrow-right" style={{ fontSize: '16px', color: '#10b981' }}></i>
              Endpoint
            </button>

            <button
              onClick={insertLabel}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <i className="pi pi-tag" style={{ fontSize: '16px', color: '#3b82f6' }}></i>
              Label
            </button>
          </div>
        )}
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div
          ref={linkModalRef}
          style={{
            position: linkModalPosition ? 'fixed' : 'absolute',
            top: linkModalPosition ? `${linkModalPosition.top + 8}px` : '100%',
            left: linkModalPosition ? `${linkModalPosition.left}px` : '50%',
            transform: linkModalPosition ? 'none' : 'translateX(-50%)',
            marginTop: linkModalPosition ? '0' : '8px',
            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
            border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            padding: '16px',
            zIndex: 1000,
            minWidth: '320px',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                marginBottom: '6px',
              }}
            >
              URL
            </label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: theme === 'light' ? '#f9fafb' : '#374151',
                border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                borderRadius: '6px',
                color: theme === 'light' ? '#374151' : '#e5e7eb',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#60a5fa'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme === 'light' ? '#d1d5db' : '#4b5563'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                marginBottom: '6px',
              }}
            >
              Title (optional)
            </label>
            <input
              type="text"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Link title"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: theme === 'light' ? '#f9fafb' : '#374151',
                border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                borderRadius: '6px',
                color: theme === 'light' ? '#374151' : '#e5e7eb',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#60a5fa'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme === 'light' ? '#d1d5db' : '#4b5563'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {editor.isActive('link') && (
              <button
                onClick={removeLink}
                style={{
                  padding: '8px 16px',
                  backgroundColor: theme === 'light' ? '#f9fafb' : '#374151',
                  color: '#ef4444',
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#fee2e2' : '#991b1b'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#f9fafb' : '#374151'
                }}
              >
                Remove
              </button>
            )}
            <button
              onClick={() => {
                setShowLinkModal(false)
                setLinkModalPosition(null)
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: theme === 'light' ? '#f9fafb' : '#374151',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#4b5563'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f9fafb' : '#374151'
              }}
            >
              Cancel
            </button>
            <button
              onClick={setLink}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }}
            >
              {editor.isActive('link') ? 'Update' : 'Insert'}
            </button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <ImageInsertModal
          theme={theme}
          onSave={(src, alt, caption, type) => {
            editor.chain().focus().setImageBlock({ src, alt, caption, type }).run()
            setShowImageModal(false)
          }}
          onCancel={() => setShowImageModal(false)}
        />
      )}
    </div>
  )
})

EditorToolbarComponent.displayName = 'EditorToolbar'

export { EditorToolbarComponent as EditorToolbar }

// Image Insert Modal Component (simplified version for toolbar)
interface ImageInsertModalProps {
  theme: 'light' | 'dark'
  onSave: (src: string, alt: string, caption: string, type: 'url' | 'local') => void
  onCancel: () => void
}

const ImageInsertModal: React.FC<ImageInsertModalProps> = ({ theme, onSave, onCancel }) => {
  const [imageType, setImageType] = useState<'url' | 'local'>('url')
  const [imageSrc, setImageSrc] = useState<string>('')
  const [imageAlt, setImageAlt] = useState<string>('Image')
  const [imageCaption, setImageCaption] = useState<string>('')
  const [uploading, setUploading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string
        const base64String = base64Data.split(',')[1]

        const timestamp = Date.now()
        const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = `assets/${filename}`

        try {
          const response = await fetch('http://localhost:8080/api/files/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file_path: filePath,
              file_data: base64String,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to upload file')
          }

          const data = await response.json()
          setImageSrc(`/${data.file_path}`)
          setImageType('local')
          setUploading(false)
        } catch (err) {
          console.error('Upload error:', err)
          setError('Failed to upload file. Please try again.')
          setUploading(false)
        }
      }

      reader.onerror = () => {
        setError('Failed to read file')
        setUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (err) {
      console.error('File read error:', err)
      setError('Failed to process file')
      setUploading(false)
    }
  }

  const handleSave = () => {
    if (!imageSrc.trim()) {
      setError('Image source is required')
      return
    }
    if (!imageAlt.trim()) {
      setError('Alt text is required')
      return
    }
    onSave(imageSrc.trim(), imageAlt.trim(), imageCaption.trim(), imageType)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '500px',
          maxWidth: '600px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: theme === 'light' ? '#1f2937' : '#f9fafb',
          }}
        >
          Insert Image
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Image Type Selection */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: theme === 'light' ? '#374151' : '#d1d5db',
              }}
            >
              Image Source Type
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setImageType('url')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: imageType === 'url' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                  color: imageType === 'url' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
              >
                <i className="pi pi-link" style={{ marginRight: '6px' }}></i>
                URL
              </button>
              <button
                onClick={() => setImageType('local')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: imageType === 'local' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                  color: imageType === 'local' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
              >
                <i className="pi pi-upload" style={{ marginRight: '6px' }}></i>
                Local File
              </button>
            </div>
          </div>

          {/* Image Source */}
          {imageType === 'url' ? (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  color: theme === 'light' ? '#6b7280' : '#9ca3af',
                }}
              >
                Image URL
              </label>
              <input
                type="text"
                value={imageSrc}
                onChange={(e) => setImageSrc(e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
                  color: theme === 'light' ? '#374151' : '#d1d5db',
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          ) : (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  color: theme === 'light' ? '#6b7280' : '#9ca3af',
                }}
              >
                Upload Image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#d1d5db',
                  border: `2px dashed ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
                  borderRadius: '6px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
              >
                {uploading ? (
                  <>
                    <i className="pi pi-spin pi-spinner" style={{ marginRight: '8px' }}></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="pi pi-upload" style={{ marginRight: '8px' }}></i>
                    Choose File
                  </>
                )}
              </button>
              {imageSrc && imageType === 'local' && (
                <p
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: theme === 'light' ? '#10b981' : '#34d399',
                  }}
                >
                  <i className="pi pi-check-circle" style={{ marginRight: '4px' }}></i>
                  File uploaded: {imageSrc}
                </p>
              )}
            </div>
          )}

          {/* Alt Text */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
              }}
            >
              Alt Text (Required)
            </label>
            <input
              type="text"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Describe the image"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Caption */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
              }}
            >
              Caption (Optional)
            </label>
            <input
              type="text"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Image caption"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <p style={{ margin: '0', fontSize: '12px', color: '#ef4444' }}>
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleSave}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: uploading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Insert
            </button>

            <button
              onClick={onCancel}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                color: theme === 'light' ? '#374151' : '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
