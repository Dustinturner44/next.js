export class NextJsDevtoolsAPIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NextJsDevtoolsAPIError'
  }
}

export async function makeDevtoolsRequest<T>(
  baseUrl: string,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (!baseUrl) {
    throw new NextJsDevtoolsAPIError('Base URL is required.')
  }

  const normalizedBaseUrl = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl

  const url = `${normalizedBaseUrl}/_next/devtools-api${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`

      if (response.status === 404) {
        errorMessage += `\n\nTroubleshooting:\n1. Ensure you're running a Next.js dev server (not production build)\n2. Enable the devtools API in your next.config.js:\n   experimental: {\n     devtoolsApi: true\n   }\n3. Restart your Next.js dev server after making config changes\n4. Verify you're using a Next.js version that supports the devtools API`
      } else if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.error) {
          errorMessage += `\n\nServer error: ${errorData.error}`
        }
      }

      throw new NextJsDevtoolsAPIError(errorMessage)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof NextJsDevtoolsAPIError) {
      throw error
    }
    throw new NextJsDevtoolsAPIError(
      `Failed to connect to Next.js dev server at ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
