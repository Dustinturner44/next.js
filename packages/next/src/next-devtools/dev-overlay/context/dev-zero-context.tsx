import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'

interface Dev0Project {
  name: string
  status: 'running' | 'paused' | 'killed'
  port?: number
  pid?: number
  cwd: string
  createdAt: number
}

interface Dev0ContextType {
  projects: Dev0Project[]
  isLoading: boolean
  error: string | null
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

export const Dev0Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [projects, setProjects] = useState<Dev0Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setProjects(data.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
      console.error('Failed to fetch dev-0 projects:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createProject = useCallback(async () => {
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
      await fetchProjects()
      return data.project
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      console.error('Failed to create dev-0 project:', err)
      return null
    }
  }, [fetchProjects])

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
