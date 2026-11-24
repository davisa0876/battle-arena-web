import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n, { resources } from '../../../i18n'
import { ApiClient, ApiError } from './client'

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

/** A fetch implementation that never resolves and rejects with an AbortError once its signal aborts. */
function hangingFetch(): typeof fetch {
  return ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal
      const rejectAborted = () => reject(new DOMException('The operation was aborted.', 'AbortError'))

      if (signal?.aborted) {
        rejectAborted()
        return
      }
      signal?.addEventListener('abort', rejectAborted, { once: true })
    })) as typeof fetch
}

describe('ApiError', () => {
  it('exposes name, message, status and cause', () => {
    const cause = new Error('root cause')
    const error = new ApiError('Boom', 500, cause)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('Boom')
    expect(error.status).toBe(500)
    expect(error.cause).toBe(cause)
  })

  it('leaves status and cause undefined when omitted', () => {
    const error = new ApiError('No status')

    expect(error.status).toBeUndefined()
    expect(error.cause).toBeUndefined()
  })
})

describe('ApiClient', () => {
  beforeEach(async () => {
    vi.stubGlobal('fetch', fetchMock)
    await i18n.changeLanguage('en')
  })

  afterEach(async () => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('performs a JSON GET with Accept and Accept-Language headers', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ data: [1, 2, 3] }))
    const client = new ApiClient({ baseUrl: 'http://api.test' })

    const result = await client.get<{ data: number[] }>('/api/things')

    expect(result).toEqual({ data: [1, 2, 3] })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://api.test/api/things')
    expect(init?.headers).toEqual({
      Accept: 'application/json',
      'Accept-Language': 'en',
    })
    expect(init?.signal).toBeDefined()
  })

  it('sends the normalized current i18n language in Accept-Language', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}))
    const client = new ApiClient({ baseUrl: 'http://api.test' })

    await i18n.changeLanguage('pt-BR')
    await client.get('/api/ping')

    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ 'Accept-Language': 'pt-BR' })

    await i18n.changeLanguage('fr')
    await client.get('/api/ping')

    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ 'Accept-Language': 'fr' })
  })

  it('strips a single trailing slash from the base URL', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}))
    const client = new ApiClient({ baseUrl: 'http://api.test/' })

    await client.get('/api/creatures?page=2')

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/creatures?page=2')
  })

  it('keeps a base URL without trailing slash unchanged', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}))
    const client = new ApiClient({ baseUrl: 'http://api.test:8000' })

    await client.get('/api/health')

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test:8000/api/health')
  })

  it('defaults the base URL to http://localhost:8000', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}))

    await new ApiClient().get('/api/health')

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8000/api/health')
  })

  it('throws an ApiError carrying the HTTP status when the response is not ok', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ message: 'nope' }, { status: 500 }))
    const client = new ApiClient({ baseUrl: 'http://api.test' })

    const error = await client.get('/api/boom').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toBe('API request failed with status 500')
    expect((error as ApiError).status).toBe(500)
  })

  it('localizes status, timeout and offline messages using the errors namespace', async () => {
    await i18n.changeLanguage('fr')
    const client = new ApiClient({ baseUrl: 'http://api.test', timeoutMs: 20 })

    fetchMock.mockImplementationOnce(async () => jsonResponse({}, { status: 503 }))
    await expect(client.get('/api/x')).rejects.toMatchObject({
      message: resources.fr.errors.requestFailed.replace('{{status}}', '503'),
      status: 503,
    })

    fetchMock.mockImplementationOnce(hangingFetch())
    await expect(client.get('/api/x')).rejects.toMatchObject({
      message: resources.fr.errors.timeout.replace('{{ms}}', '20'),
    })

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(client.get('/api/x')).rejects.toMatchObject({ message: resources.fr.errors.offline })
  })

  it('uses the English resource strings by default', async () => {
    fetchMock.mockImplementationOnce(async () => jsonResponse({}, { status: 500 }))

    await expect(new ApiClient({ baseUrl: 'http://api.test' }).get('/api/x')).rejects.toMatchObject({
      message: resources.en.errors.requestFailed.replace('{{status}}', '500'),
    })
  })

  it('preserves a 404 status so callers can distinguish not found', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ message: 'missing' }, { status: 404 }))
    const client = new ApiClient({ baseUrl: 'http://api.test' })

    await expect(client.get('/api/creatures/ghost')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'API request failed with status 404',
    })
  })

  it('throws a timeout ApiError when the request exceeds timeoutMs', async () => {
    fetchMock.mockImplementation(hangingFetch())
    const client = new ApiClient({ baseUrl: 'http://api.test', timeoutMs: 20 })

    const error = await client.get('/api/slow').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toBe('API request timed out after 20ms')
    expect((error as ApiError).status).toBeUndefined()
    expect((error as ApiError).cause).toBeInstanceOf(DOMException)
  })

  it('times out using fake timers without waiting in real time', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(hangingFetch())
    const client = new ApiClient({ baseUrl: 'http://api.test', timeoutMs: 5_000 })

    const pending = client.get('/api/slow').catch((caught: unknown) => caught)
    await vi.advanceTimersByTimeAsync(4_999)
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    const error = await pending

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toBe('API request timed out after 5000ms')
  })

  it('throws "Unable to connect" when fetch rejects with a network error', async () => {
    const networkError = new TypeError('Failed to fetch')
    fetchMock.mockRejectedValue(networkError)
    const client = new ApiClient({ baseUrl: 'http://api.test' })

    const error = await client.get('/api/down').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toBe('Unable to connect to the API')
    expect((error as ApiError).status).toBeUndefined()
    expect((error as ApiError).cause).toBe(networkError)
  })

  it('throws "Unable to connect" when the body is not valid JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>not json</html>', { status: 200 }))
    const client = new ApiClient({ baseUrl: 'http://api.test' })

    await expect(client.get('/api/html')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Unable to connect to the API',
    })
  })

  it('rethrows an ApiError raised by fetch as-is (same instance, no wrapping)', async () => {
    const original = new ApiError('custom failure', 418)
    fetchMock.mockRejectedValue(original)
    const client = new ApiClient({ baseUrl: 'http://api.test' })

    const error = await client.get('/api/teapot').catch((caught: unknown) => caught)

    expect(error).toBe(original)
    expect((error as ApiError).status).toBe(418)
  })

  it('reports "Unable to connect" (not timeout) when the caller aborts before the timeout fires', async () => {
    // Actual behavior: only the internal timeout controller is inspected, so a caller-initiated
    // abort is surfaced as a connection failure whose cause is the AbortError from fetch.
    fetchMock.mockImplementation(hangingFetch())
    const client = new ApiClient({ baseUrl: 'http://api.test', timeoutMs: 10_000 })
    const callerController = new AbortController()

    const pending = client.get('/api/slow', callerController.signal).catch((caught: unknown) => caught)
    callerController.abort()
    const error = await pending

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toBe('Unable to connect to the API')
    expect(((error as ApiError).cause as DOMException).name).toBe('AbortError')
  })

  it('reports "Unable to connect" when the caller signal is already aborted', async () => {
    fetchMock.mockImplementation(hangingFetch())
    const client = new ApiClient({ baseUrl: 'http://api.test', timeoutMs: 10_000 })

    await expect(client.get('/api/slow', AbortSignal.abort())).rejects.toMatchObject({
      message: 'Unable to connect to the API',
    })
  })

  it('reports a timeout when the timeout fires while a (still active) caller signal is provided', async () => {
    fetchMock.mockImplementation(hangingFetch())
    const client = new ApiClient({ baseUrl: 'http://api.test', timeoutMs: 20 })
    const callerController = new AbortController()

    await expect(client.get('/api/slow', callerController.signal)).rejects.toMatchObject({
      message: 'API request timed out after 20ms',
    })
    expect(callerController.signal.aborted).toBe(false)
  })

  it('passes a combined signal that aborts when the caller signal aborts', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}))
    const client = new ApiClient({ baseUrl: 'http://api.test' })
    const callerController = new AbortController()

    await client.get('/api/x', callerController.signal)
    const passedSignal = fetchMock.mock.calls[0][1]?.signal as AbortSignal

    expect(passedSignal).not.toBe(callerController.signal)
    expect(passedSignal.aborted).toBe(false)
    callerController.abort()
    expect(passedSignal.aborted).toBe(true)
  })

  it('clears the timeout once the request settles so it never aborts later', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(async () => jsonResponse({ ok: true }))
    const client = new ApiClient({ baseUrl: 'http://api.test', timeoutMs: 1_000 })

    await client.get('/api/ok')
    const passedSignal = fetchMock.mock.calls[0][1]?.signal as AbortSignal
    await vi.advanceTimersByTimeAsync(5_000)

    expect(passedSignal.aborted).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears the timeout after a failed request as well', async () => {
    vi.useFakeTimers()
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const client = new ApiClient({ baseUrl: 'http://api.test', timeoutMs: 1_000 })

    await client.get('/api/down').catch(() => undefined)

    expect(vi.getTimerCount()).toBe(0)
  })
})
