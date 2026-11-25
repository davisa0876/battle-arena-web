import i18n, { normalizeLanguage } from '../../../i18n'

const DEFAULT_BASE_URL = 'http://localhost:8000'
const DEFAULT_TIMEOUT_MS = 8_000
const XSRF_COOKIE_NAME = 'XSRF-TOKEN'
const XSRF_HEADER_NAME = 'X-XSRF-TOKEN'

export type ValidationErrors = Record<string, string[]>

export type ApiErrorKind = 'timeout' | 'network' | 'validation' | 'http' | 'aborted' | 'unknown'

export class ApiError extends Error {
  readonly status: number | undefined
  readonly errors: ValidationErrors
  readonly kind: ApiErrorKind
  /** Technical detail for logs only — never render in the UI. */
  readonly debugMessage: string | undefined
  override readonly cause: unknown

  constructor(
    message: string,
    status?: number,
    cause?: unknown,
    errors: ValidationErrors = {},
    kind: ApiErrorKind = 'unknown',
    debugMessage?: string,
  ) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.cause = cause
    this.errors = errors
    this.kind = kind
    this.debugMessage = debugMessage
  }

  get isValidation(): boolean {
    return this.status === 422
  }

  /** First validation message for a field, if the API reported one. */
  firstError(field: string): string | undefined {
    return this.errors[field]?.[0]
  }
}

export interface ApiClientOptions {
  baseUrl?: string
  timeoutMs?: number
  /** Called whenever the API answers 401 so the app can drop its session state. */
  onUnauthorized?: (error: ApiError) => void
}

export interface RequestOptions {
  body?: unknown
  signal?: AbortSignal
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

function acceptLanguage(): string {
  return normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
}

/** Reads the (URL-encoded) XSRF token Laravel stores in a readable cookie. Never persisted elsewhere. */
export function readXsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  for (const part of document.cookie.split(';')) {
    const separator = part.indexOf('=')
    if (separator === -1) {
      continue
    }
    if (part.slice(0, separator).trim() === XSRF_COOKIE_NAME) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim())
      } catch {
        return null
      }
    }
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseValidationErrors(body: unknown): { message?: string; errors: ValidationErrors } {
  if (!isRecord(body)) {
    return { errors: {} }
  }

  const errors: ValidationErrors = {}
  if (isRecord(body.errors)) {
    for (const [field, value] of Object.entries(body.errors)) {
      if (Array.isArray(value)) {
        errors[field] = value.filter((item): item is string => typeof item === 'string')
      } else if (typeof value === 'string') {
        errors[field] = [value]
      }
    }
  }

  return { message: typeof body.message === 'string' ? body.message : undefined, errors }
}

function statusMessage(status: number): string {
  switch (status) {
    case 401:
      return i18n.t('errors:unauthenticated')
    case 403:
      return i18n.t('errors:forbidden')
    case 404:
      return i18n.t('errors:notFound')
    case 419:
      return i18n.t('errors:sessionExpired')
    case 429:
      return i18n.t('errors:tooManyRequests')
    default:
      return status >= 500 ? i18n.t('errors:server') : i18n.t('errors:generic')
  }
}

export class ApiClient {
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private unauthorizedHandler: ((error: ApiError) => void) | undefined

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.unauthorizedHandler = options.onUnauthorized
  }

  setUnauthorizedHandler(handler: ((error: ApiError) => void) | undefined): void {
    this.unauthorizedHandler = handler
  }

  /** Resolves a possibly relative API path/URL (e.g. avatar URLs) against the configured base URL. */
  resolveUrl(pathOrUrl: string): string {
    return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${this.baseUrl}${pathOrUrl}`
  }

  async get<TResponse>(path: string, signal?: AbortSignal): Promise<TResponse> {
    return this.send<TResponse>('GET', path, { signal })
  }

  async post<TResponse>(path: string, body?: unknown, signal?: AbortSignal): Promise<TResponse> {
    return this.request<TResponse>('POST', path, { body, signal })
  }

  async patch<TResponse>(path: string, body?: unknown, signal?: AbortSignal): Promise<TResponse> {
    return this.request<TResponse>('PATCH', path, { body, signal })
  }

  async delete<TResponse = void>(path: string, signal?: AbortSignal): Promise<TResponse> {
    return this.request<TResponse>('DELETE', path, { signal })
  }

  /** Multipart upload; the browser sets the Content-Type boundary itself. */
  async upload<TResponse>(path: string, formData: FormData, signal?: AbortSignal): Promise<TResponse> {
    return this.request<TResponse>('POST', path, { body: formData, signal })
  }

  /** Primes the Sanctum session + XSRF-TOKEN cookies. Call before login/register. */
  async ensureCsrfCookie(signal?: AbortSignal): Promise<void> {
    await this.send<void>('GET', '/sanctum/csrf-cookie', { signal })
  }

  private async request<TResponse>(
    method: Exclude<HttpMethod, 'GET'>,
    path: string,
    options: RequestOptions,
  ): Promise<TResponse> {
    if (readXsrfToken() === null) {
      await this.ensureCsrfCookie(options.signal)
    }

    try {
      return await this.send<TResponse>(method, path, options)
    } catch (error) {
      if (error instanceof ApiError && error.status === 419) {
        // The session/CSRF pair expired: refresh the cookie and retry exactly once.
        await this.ensureCsrfCookie(options.signal)
        return this.send<TResponse>(method, path, options)
      }
      throw error
    }
  }

  private buildHeaders(method: HttpMethod, body: unknown): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Language': acceptLanguage(),
    }

    if (method === 'GET') {
      return headers
    }

    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    const xsrfToken = readXsrfToken()
    if (xsrfToken) {
      headers[XSRF_HEADER_NAME] = xsrfToken
    }

    return headers
  }

  private async send<TResponse>(
    method: HttpMethod,
    path: string,
    options: RequestOptions,
  ): Promise<TResponse> {
    const timeoutController = new AbortController()
    const timeoutId = window.setTimeout(() => timeoutController.abort(), this.timeoutMs)
    const combinedSignal = options.signal
      ? AbortSignal.any([options.signal, timeoutController.signal])
      : timeoutController.signal
    const { body } = options

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.buildHeaders(method, body),
        credentials: 'include',
        ...(body === undefined
          ? {}
          : { body: body instanceof FormData ? body : JSON.stringify(body) }),
        signal: combinedSignal,
      })

      if (!response.ok) {
        throw await this.toApiError(response)
      }

      const text = await response.text()
      return (text === '' ? undefined : JSON.parse(text)) as TResponse
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          this.unauthorizedHandler?.(error)
        }
        throw error
      }
      if (options.signal?.aborted) {
        throw new ApiError(i18n.t('errors:generic'), undefined, error, {}, 'aborted', 'Request aborted by caller')
      }
      if (timeoutController.signal.aborted) {
        throw new ApiError(
          i18n.t('errors:timeout'),
          undefined,
          error,
          {},
          'timeout',
          `Request timed out after ${this.timeoutMs}ms`,
        )
      }
      throw new ApiError(i18n.t('errors:offline'), undefined, error, {}, 'network', 'Network request failed')
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  private async toApiError(response: Response): Promise<ApiError> {
    let parsed: { message?: string; errors: ValidationErrors } = { errors: {} }

    try {
      parsed = parseValidationErrors(await response.json())
    } catch {
      // Non-JSON error body: fall back to the localized status message.
    }

    if (response.status === 422) {
      const firstFieldMessage = Object.values(parsed.errors)[0]?.[0]
      return new ApiError(
        parsed.message ?? firstFieldMessage ?? i18n.t('errors:validationFailed'),
        422,
        undefined,
        parsed.errors,
        'validation',
      )
    }

    // Auth / session / rate-limit: always use our localized copy (never Laravel English defaults).
    if ([401, 403, 419, 429].includes(response.status)) {
      return new ApiError(
        statusMessage(response.status),
        response.status,
        undefined,
        parsed.errors,
        'http',
        `HTTP ${response.status}`,
      )
    }

    // 5xx: never surface internal server text to players.
    if (response.status >= 500) {
      return new ApiError(
        i18n.t('errors:server'),
        response.status,
        undefined,
        parsed.errors,
        'http',
        `HTTP ${response.status}${parsed.message ? `: ${parsed.message}` : ''}`,
      )
    }

    // Other 4xx: prefer deliberate API product copy when present.
    const safeMessage = parsed.message?.trim() || statusMessage(response.status)
    return new ApiError(
      safeMessage,
      response.status,
      undefined,
      parsed.errors,
      'http',
      `HTTP ${response.status}`,
    )
  }
}

export const apiClient = new ApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL,
})
