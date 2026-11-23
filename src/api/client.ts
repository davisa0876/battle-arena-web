const DEFAULT_BASE_URL = 'http://localhost:8000'
const DEFAULT_TIMEOUT_MS = 8_000

export class ApiError extends Error {
  readonly status: number | undefined
  override readonly cause: unknown

  constructor(
    message: string,
    status?: number,
    cause?: unknown,
  ) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.cause = cause
  }
}

export interface ApiClientOptions {
  baseUrl?: string
  timeoutMs?: number
}

export class ApiClient {
  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  async get<TResponse>(path: string, signal?: AbortSignal): Promise<TResponse> {
    const timeoutController = new AbortController()
    const timeoutId = window.setTimeout(() => timeoutController.abort(), this.timeoutMs)
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutController.signal])
      : timeoutController.signal

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: { Accept: 'application/json' },
        signal: combinedSignal,
      })

      if (!response.ok) {
        throw new ApiError(`API request failed with status ${response.status}`, response.status)
      }

      return await response.json() as TResponse
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      if (timeoutController.signal.aborted) {
        throw new ApiError(`API request timed out after ${this.timeoutMs}ms`, undefined, error)
      }
      throw new ApiError('Unable to connect to the API', undefined, error)
    } finally {
      window.clearTimeout(timeoutId)
    }
  }
}

export const apiClient = new ApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL,
})
