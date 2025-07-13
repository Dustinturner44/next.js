import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'

interface Dev0Project {
  name: string
  status: 'running' | 'paused' | 'killed' | 'creating'
  port?: number
  pid?: number
  cwd: string
  createdAt: number
  isOptimistic?: boolean
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

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

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
      }}
    >
      {children}
    </Dev0Context.Provider>
  )
}
