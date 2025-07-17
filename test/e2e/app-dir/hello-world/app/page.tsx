'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'inprogress' | 'done'
  createdAt: Date
  priority: 'low' | 'medium' | 'high'
}

const COLUMNS = {
  todo: { title: 'To Do', color: '#737373' },
  inprogress: { title: 'In Progress', color: '#f59e0b' },
  done: { title: 'Done', color: '#10b981' },
} as const

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>(
    'medium'
  )
  const [sidebarWidth, setSidebarWidth] = useState(0)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Load tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vercel-kanban')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setTasks(
          parsed.map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
          }))
        )
      } catch (e) {
        console.error('Failed to parse saved tasks')
      }
    }
  }, [])

  // Save tasks to localStorage
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('vercel-kanban', JSON.stringify(tasks))
    }
  }, [tasks])

  // Design System
  const colors = {
    neutral: {
      0: '#000000',
      50: '#0a0a0a',
      100: '#0f0f0f',
      150: '#101010',
      200: '#151515',
      250: '#1a1a1a',
      300: '#262626',
      400: '#404040',
      500: '#737373',
      600: '#a3a3a3',
      700: '#d4d4d8',
      800: '#e4e4e7',
      900: '#f4f4f5',
      1000: '#ffffff',
    },
    accent: {
      blue: '#3b82f6',
      green: '#10b981',
      yellow: '#f59e0b',
      red: '#ef4444',
      purple: '#8b5cf6',
    },
  }

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: colors.neutral[50],
      color: colors.neutral[800],
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      WebkitFontSmoothing: 'antialiased' as const,
      MozOsxFontSmoothing: 'grayscale' as const,
      padding: '32px',
      zIndex: 0,
    },
    container: {
      width: sidebarWidth > 0 ? `calc(100% - ${sidebarWidth}px)` : '100%',
      margin: 0,
    },
    header: {
      marginBottom: '48px',
    },
    pageTitle: {
      fontSize: '32px',
      fontWeight: 600,
      color: colors.neutral[1000],
      margin: '0 0 12px 0',
      lineHeight: 1.2,
    },
    pageSubtitle: {
      fontSize: '16px',
      color: colors.neutral[600],
      margin: '0 0 32px 0',
      lineHeight: 1.5,
    },
    navLinks: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap' as const,
    },
    navLink: {
      fontSize: '14px',
      color: colors.accent.blue,
      textDecoration: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      border: `1px solid ${colors.neutral[300]}`,
      backgroundColor: colors.neutral[150],
      cursor: 'pointer',
    },
    addSection: {
      backgroundColor: colors.neutral[150],
      border: `1px solid ${colors.neutral[300]}`,
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '48px',
    },
    addTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: colors.neutral[900],
      margin: '0 0 20px 0',
    },
    form: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr auto',
      gap: '16px',
      alignItems: 'end',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      color: colors.neutral[600],
      fontWeight: 500,
    },
    input: {
      padding: '12px 16px',
      backgroundColor: colors.neutral[250],
      border: `1px solid ${colors.neutral[300]}`,
      borderRadius: '8px',
      fontSize: '14px',
      color: colors.neutral[900],
      outline: 'none',
    },
    textarea: {
      padding: '12px 16px',
      backgroundColor: colors.neutral[250],
      border: `1px solid ${colors.neutral[300]}`,
      borderRadius: '8px',
      fontSize: '14px',
      color: colors.neutral[900],
      outline: 'none',
      resize: 'vertical' as const,
      minHeight: '44px',
      maxHeight: '120px',
    },
    select: {
      padding: '12px 16px',
      backgroundColor: colors.neutral[250],
      border: `1px solid ${colors.neutral[300]}`,
      borderRadius: '8px',
      fontSize: '14px',
      color: colors.neutral[800],
      outline: 'none',
      cursor: 'pointer',
    },
    addButton: {
      padding: '12px 24px',
      backgroundColor: colors.accent.blue,
      color: colors.neutral[1000],
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
      height: 'fit-content',
    },
    board: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '32px',
    },
    column: {
      backgroundColor: colors.neutral[100],
      borderRadius: '16px',
      padding: '24px',
      minHeight: '400px',
    },
    columnHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: `1px solid ${colors.neutral[300]}`,
    },
    columnTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: colors.neutral[900],
      margin: 0,
    },
    columnCount: {
      fontSize: '12px',
      fontWeight: 500,
      padding: '4px 8px',
      borderRadius: '12px',
      backgroundColor: colors.neutral[250],
      color: colors.neutral[600],
    },
    statusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
    },
    taskList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    taskCard: {
      backgroundColor: colors.neutral[150],
      border: `1px solid ${colors.neutral[300]}`,
      borderRadius: '12px',
      padding: '20px',
      cursor: 'grab',
    },
    taskCardDragging: {
      opacity: 0.5,
      cursor: 'grabbing',
    },
    taskTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: colors.neutral[900],
      margin: '0 0 8px 0',
      lineHeight: 1.4,
    },
    taskDescription: {
      fontSize: '13px',
      color: colors.neutral[700],
      margin: '0 0 16px 0',
      lineHeight: 1.5,
    },
    taskFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priority: {
      fontSize: '11px',
      padding: '4px 8px',
      borderRadius: '6px',
      textTransform: 'uppercase' as const,
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
    priorityHigh: {
      backgroundColor: `${colors.accent.red}20`,
      color: colors.accent.red,
    },
    priorityMedium: {
      backgroundColor: `${colors.accent.yellow}20`,
      color: colors.accent.yellow,
    },
    priorityLow: {
      backgroundColor: `${colors.accent.green}20`,
      color: colors.accent.green,
    },
    deleteButton: {
      width: '28px',
      height: '28px',
      border: 'none',
      backgroundColor: 'transparent',
      color: colors.neutral[500],
      cursor: 'pointer',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
    },
    dropZone: {
      minHeight: '60px',
      borderRadius: '8px',
      border: `2px dashed ${colors.neutral[400]}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.neutral[500],
      fontSize: '13px',
    },
    dropZoneActive: {
      borderColor: colors.accent.blue,
      backgroundColor: `${colors.accent.blue}10`,
      color: colors.accent.blue,
    },
  }

  const addTask = () => {
    if (!newTask.trim()) return

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.trim(),
      description: newDescription.trim() || undefined,
      status: 'todo',
      createdAt: new Date(),
      priority: newPriority,
    }

    setTasks((prev) => [task, ...prev])
    setNewTask('')
    setNewDescription('')
    inputRef.current?.focus()
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      addTask()
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      moveTask(taskId, status)
    }
    setDraggedTask(null)
  }

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter((task) => task.status === status)
  }

  const stats = {
    todo: getTasksByStatus('todo').length,
    inprogress: getTasksByStatus('inprogress').length,
    done: getTasksByStatus('done').length,
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>Project Board</h1>
          <p style={styles.pageSubtitle}>
            Organize your work with a visual workflow
          </p>

          <div style={styles.navLinks}>
            <Link href="/test-network" style={styles.navLink}>
              Network Test
            </Link>
            <button
              onClick={() => window.history.pushState({}, '', '/virtual-page')}
              style={styles.navLink}
            >
              Virtual Navigation
            </button>
            <button
              onClick={() => window.location.reload()}
              style={styles.navLink}
            >
              Reload Page
            </button>
          </div>
        </header>

        {/* Add Task Section */}
        <div style={styles.addSection}>
          <h2 style={styles.addTitle}>Add New Task</h2>
          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Task Title</label>
              <input
                ref={inputRef}
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter task title..."
                style={styles.input}
                autoFocus
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Description (optional)</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add more details..."
                style={styles.textarea}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Priority</label>
              <select
                value={newPriority}
                onChange={(e) =>
                  setNewPriority(e.target.value as 'low' | 'medium' | 'high')
                }
                style={styles.select}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button
              onClick={addTask}
              disabled={!newTask.trim()}
              style={{
                ...styles.addButton,
                opacity: !newTask.trim() ? 0.5 : 1,
                cursor: !newTask.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div style={styles.board}>
          {(Object.keys(COLUMNS) as Array<keyof typeof COLUMNS>).map(
            (status) => (
              <div
                key={status}
                style={styles.column}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div style={styles.columnHeader}>
                  <div
                    style={{
                      ...styles.statusDot,
                      backgroundColor: COLUMNS[status].color,
                    }}
                  />
                  <h3 style={styles.columnTitle}>{COLUMNS[status].title}</h3>
                  <span style={styles.columnCount}>{stats[status]}</span>
                </div>

                <div style={styles.taskList}>
                  {getTasksByStatus(status).map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      style={{
                        ...styles.taskCard,
                        ...(draggedTask === task.id
                          ? styles.taskCardDragging
                          : {}),
                      }}
                    >
                      <h4 style={styles.taskTitle}>{task.title}</h4>
                      {task.description && (
                        <p style={styles.taskDescription}>{task.description}</p>
                      )}
                      <div style={styles.taskFooter}>
                        <span
                          style={{
                            ...styles.priority,
                            ...(task.priority === 'high'
                              ? styles.priorityHigh
                              : task.priority === 'medium'
                                ? styles.priorityMedium
                                : styles.priorityLow),
                          }}
                        >
                          {task.priority}
                        </span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={styles.deleteButton}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}

                  {getTasksByStatus(status).length === 0 && (
                    <div style={styles.dropZone}>
                      {status === 'todo'
                        ? 'Add your first task above'
                        : status === 'inprogress'
                          ? 'Drag tasks here to start working'
                          : 'Drag completed tasks here'}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
