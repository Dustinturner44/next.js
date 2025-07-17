import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'

export interface Dev0Project {
  name: string
  displayName?: string
  status: 'running' | 'paused' | 'killed' | 'creating'
  port?: number
  pid?: number
  cwd: string
  absolutePath?: string
  createdAt: number
  isOptimistic?: boolean
  deploymentUrl?: string
}

interface Dev0ContextType {
  projects: Dev0Project[]
  isLoading: boolean
  error: string | null
  creatingProjectIds: Set<string>
  fetchProjects: () => Promise<void>
  createProject: () => Promise<Dev0Project | null>
  killProject: (name: string) => Promise<void>
  startProject: (name: string) => Promise<void>
  updateDisplayName: (projectName: string, displayName: string) => Promise<void>
  getDisplayName: (projectName: string) => string
}

const Dev0Context = createContext<Dev0ContextType | null>(null)

export const useDev0Context = () => {
  const context = useContext(Dev0Context)
  if (!context) {
    throw new Error('useDev0Context must be used within Dev0Provider')
  }
  return context
}

const DEV0_API_URL = 'http://localhost:40000'

// Generate a temporary ID for optimistic updates
const generateTempId = () =>
  `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

export const Dev0Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [projects, setProjects] = useState<Dev0Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingProjectIds] = useState(new Set<string>())
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({})

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`${DEV0_API_URL}/get-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      // Filter out optimistic projects and replace with real ones
      setProjects((prevProjects) => {
        const realProjects = data.projects || []
        console.log('Fetched projects with display names:', realProjects.map((p: Dev0Project) => ({ 
          name: p.name, 
          displayName: p.displayName 
        })))
        const optimisticProjects = prevProjects.filter((p) => p.isOptimistic)

        // Remove optimistic projects that now exist as real projects
        const filteredOptimistic = optimisticProjects.filter(
          (opt) =>
            !realProjects.some(
              (real: Dev0Project) =>
                opt.name === real.name || opt.name.includes('temp-')
            )
        )

        return [...realProjects, ...filteredOptimistic]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
      console.error('Failed to fetch dev-0 projects:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createProject = useCallback(async () => {
    const tempId = generateTempId()
    const optimisticProject: Dev0Project = {
      name: tempId,
      status: 'creating',
      cwd: `projects/${tempId}`,
      createdAt: Date.now(),
      isOptimistic: true,
    }

    // Add optimistic project immediately
    setProjects((prev) => [...prev, optimisticProject])
    creatingProjectIds.add(tempId)

    try {
      setError(null)
      const response = await fetch(`${DEV0_API_URL}/create-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      // Replace optimistic project with real one
      setProjects((prev) =>
        prev.map((p) => (p.name === tempId ? data.project : p))
      )
      creatingProjectIds.delete(tempId)

      // Fetch all projects to ensure consistency
      setTimeout(fetchProjects, 500)

      return data.project
    } catch (err) {
      // Remove optimistic project on error
      setProjects((prev) => prev.filter((p) => p.name !== tempId))
      creatingProjectIds.delete(tempId)
      setError(err instanceof Error ? err.message : 'Failed to create project')
      console.error('Failed to create dev-0 project:', err)
      return null
    }
  }, [fetchProjects, creatingProjectIds])

  const killProject = useCallback(
    async (name: string) => {
      try {
        setError(null)
        const response = await fetch(`${DEV0_API_URL}/kill-project`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        await fetchProjects()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to kill project')
        console.error('Failed to kill dev-0 project:', err)
      }
    },
    [fetchProjects]
  )

  const startProject = useCallback(
    async (name: string) => {
      try {
        setError(null)
        const response = await fetch(`${DEV0_API_URL}/start-project`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        await fetchProjects()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start project')
        console.error('Failed to start dev-0 project:', err)
      }
    },
    [fetchProjects]
  )

  const updateDisplayName = useCallback(async (projectName: string, displayName: string) => {
    console.log('updateDisplayName called:', projectName, '->', displayName)
    
    // Optimistically update the project's displayName
    setProjects(prev => prev.map(p => 
      p.name === projectName ? { ...p, displayName } : p
    ))
    
    // Also update the displayNames map for consistency
    setDisplayNames(prev => ({ ...prev, [projectName]: displayName }))
    
    try {
      setError(null)
      const url = `${DEV0_API_URL}/set-display-name`
      console.log('Making request to:', url)
      console.log('Request body:', { projectName, displayName })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, displayName }),
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }
      console.log('Display name saved successfully')
      // Don't refetch immediately to avoid timing issues with the UI
      // The optimistic update should be sufficient
    } catch (err) {
      // On error, revert the optimistic update by fetching fresh data
      setError(err instanceof Error ? err.message : 'Failed to update display name')
      console.error('Failed to update display name:', err)
      await fetchProjects()
      await fetchDisplayNames()
    }
  }, [fetchProjects, fetchDisplayNames])

  const getDisplayName = useCallback((projectName: string) => {
    // First check if the project has a displayName property
    const project = projects.find(p => p.name === projectName)
    if (project?.displayName) {
      return project.displayName
    }
    // Fall back to displayNames map
    return displayNames[projectName] || projectName
  }, [projects, displayNames])

  // Fetch display names on mount
  const fetchDisplayNames = useCallback(async () => {
    try {
      const response = await fetch(`${DEV0_API_URL}/get-display-names`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setDisplayNames(data.displayNames || {})
    } catch (err) {
      console.error('Failed to fetch display names:', err)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
    fetchDisplayNames()

    // Listen for refresh events
    const handleRefresh = () => {
      fetchProjects()
      fetchDisplayNames()
    }

    window.addEventListener('dev0-refresh-projects', handleRefresh)
    return () => {
      window.removeEventListener('dev0-refresh-projects', handleRefresh)
    }
  }, [fetchProjects, fetchDisplayNames])

  return (
    <Dev0Context.Provider
      value={{
        projects,
        isLoading,
        error,
        creatingProjectIds,
        fetchProjects,
        createProject,
        killProject,
        startProject,
        updateDisplayName,
        getDisplayName,
      }}
    >
      {children}
    </Dev0Context.Provider>
  )
}
