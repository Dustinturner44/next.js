'use client'
import {Link} from "next"
import { useState, useEffect, useRef } from 'react'


interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  color?: string
}

export default function Page() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarWidth, setSidebarWidth] = useState(0)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  // Monitor sidebar width changes
  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebarPortal = document.getElementById('__next-dev-sidebar-portal')
      if (sidebarPortal && sidebarPortal.firstElementChild) {
        const width = sidebarPortal.firstElementChild.offsetWidth
        setSidebarWidth(width)
      } else {
        setSidebarWidth(0)
      }
    }

    updateSidebarWidth()
    const resizeObserver = new ResizeObserver(updateSidebarWidth)

    const checkForSidebar = () => {
      const sidebarPortal = document.getElementById('__next-dev-sidebar-portal')
      if (sidebarPortal && sidebarPortal.firstElementChild) {
        resizeObserver.observe(sidebarPortal.firstElementChild)
        updateSidebarWidth()
      }
    }

    checkForSidebar()
    const mutationObserver = new MutationObserver(checkForSidebar)
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dark-notes-app')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const notesWithDates = parsed.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }))
        setNotes(notesWithDates)
        if (notesWithDates.length > 0) {
          setSelectedNote(notesWithDates[0])
        }
      } catch (e) {
        console.error('Failed to parse saved notes')
      }
    }
  }, [])

  // Save notes to localStorage
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('dark-notes-app', JSON.stringify(notes))
    }
  }, [notes])

  // Super Dark Theme Colors
  const colors = {
    bg: {
      primary: '#000000',
      secondary: '#0a0a0a',
      tertiary: '#111111',
      hover: '#1a1a1a',
      border: '#222222',
    },
    text: {
      primary: '#e5e5e5',
      secondary: '#999999',
      tertiary: '#666666',
    },
    accent: {
      primary: '#7c3aed',
      hover: '#8b5cf6',
      danger: '#dc2626',
    },
  }

  const styles = {
    page: {
      height: '100vh',
      backgroundColor: colors.bg.primary,
      color: colors.text.primary,
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      WebkitFontSmoothing: 'antialiased' as const,
      MozOsxFontSmoothing: 'grayscale' as const,
      display: 'flex',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
    },
    sidebar: {
      flex: '0 0 auto',
      width: '25%',
      minWidth: '250px',
      maxWidth: '400px',
      backgroundColor: colors.bg.secondary,
      borderRight: `1px solid ${colors.bg.border}`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    mainContent: {
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    sidebarHeader: {
      padding: '24px',
      borderBottom: `1px solid ${colors.bg.border}`,
    },
    logo: {
      fontSize: '20px',
      fontWeight: 700,
      color: colors.text.primary,
      margin: 0,
    },
    searchBox: {
      margin: '16px',
    },
    searchInput: {
      width: '100%',
      padding: '10px 16px',
      backgroundColor: colors.bg.tertiary,
      border: `1px solid ${colors.bg.border}`,
      borderRadius: '8px',
      fontSize: '14px',
      color: colors.text.primary,
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    newNoteButton: {
      margin: '0 16px 16px',
      padding: '12px',
      backgroundColor: colors.accent.primary,
      color: colors.text.primary,
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    notesList: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '8px',
    },
    noteItem: {
      padding: '12px 16px',
      margin: '4px 0',
      backgroundColor: colors.bg.tertiary,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: `1px solid transparent`,
    },
    noteItemActive: {
      backgroundColor: colors.bg.hover,
      border: `1px solid ${colors.accent.primary}`,
    },
    noteTitle: {
      fontSize: '14px',
      fontWeight: 500,
      color: colors.text.primary,
      margin: 0,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    noteDate: {
      fontSize: '12px',
      color: colors.text.tertiary,
      margin: '4px 0 0',
    },
    editor: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: colors.bg.secondary,
    },
    editorHeader: {
      padding: '24px 32px',
      borderBottom: `1px solid ${colors.bg.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    editorTitle: {
      fontSize: '24px',
      fontWeight: 600,
      color: colors.text.primary,
      border: 'none',
      backgroundColor: 'transparent',
      outline: 'none',
      width: '100%',
      marginRight: '16px',
    },
    deleteButton: {
      padding: '8px 16px',
      backgroundColor: 'transparent',
      color: colors.accent.danger,
      border: `1px solid ${colors.accent.danger}`,
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    editorContent: {
      flex: 1,
      padding: '32px',
    },
    editorTextarea: {
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      border: 'none',
      outline: 'none',
      fontSize: '16px',
      lineHeight: 1.6,
      color: colors.text.primary,
      resize: 'none',
      fontFamily: 'inherit',
    },
    emptyState: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    emptyStateText: {
      fontSize: '18px',
      color: colors.text.tertiary,
    },
  }

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setNotes((prev) => [newNote, ...prev])
    setSelectedNote(newNote)
    setTimeout(() => titleRef.current?.focus(), 100)
  }

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      )
    )
    if (selectedNote?.id === id) {
      setSelectedNote((prev) =>
        prev ? { ...prev, ...updates, updatedAt: new Date() } : null
      )
    }
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
    if (selectedNote?.id === id) {
      const remainingNotes = notes.filter((note) => note.id !== id)
      setSelectedNote(remainingNotes.length > 0 ? remainingNotes[0] : null)
    }
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.logo}>Dark Notes</h1>
        </div>
        
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <button
          onClick={createNewNote}
          style={styles.newNoteButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.accent.hover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.accent.primary
          }}
        >
          + New Note
        </button>

        <div style={styles.notesList}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              style={{
                ...styles.noteItem,
                ...(selectedNote?.id === note.id ? styles.noteItemActive : {}),
              }}
              onMouseEnter={(e) => {
                if (selectedNote?.id !== note.id) {
                  e.currentTarget.style.backgroundColor = colors.bg.hover
                }
              }}
              onMouseLeave={(e) => {
                if (selectedNote?.id !== note.id) {
                  e.currentTarget.style.backgroundColor = colors.bg.tertiary
                }
              }}
            >
              <h3 style={styles.noteTitle}>{note.title || 'Untitled'}</h3>
              <p style={styles.noteDate}>{formatDate(note.updatedAt)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {selectedNote ? (
          <div style={styles.editor}>
            <div style={styles.editorHeader}>
              <input
                ref={titleRef}
                type="text"
                value={selectedNote.title}
                onChange={(e) =>
                  updateNote(selectedNote.id, { title: e.target.value })
                }
                style={styles.editorTitle}
                placeholder="Note title..."
              />
              <button
                onClick={() => {
                  if (confirm('Delete this note?')) {
                    deleteNote(selectedNote.id)
                  }
                }}
                style={styles.deleteButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.accent.danger
                  e.currentTarget.style.color = colors.text.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = colors.accent.danger
                }}
              >
                Delete
              </button>
            </div>
            <div style={styles.editorContent}>
              <textarea
                ref={contentRef}
                value={selectedNote.content}
                onChange={(e) =>
                  updateNote(selectedNote.id, { content: e.target.value })
                }
                style={styles.editorTextarea}
                placeholder="Start typing..."
              />
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p style={styles.emptyStateText}>
              {notes.length === 0
                ? 'Create your first note'
                : 'Select a note to edit'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
