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

function setXsrfCookie(value: string | null) {
  document.cookie = value === null
    ? 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    : `XSRF-TOKEN=${value}; path=/`
}

function emptyResponse(status = 204): Response {
  return new Response(null, { status })
}

describe('ApiClient credentials, CSRF and mutations', () => {
  beforeEach(async () => {
    vi.stubGlobal('fetch', fetchMock)
    setXsrfCookie(null)
    await i18n.changeLanguage('en')
  })

  afterEach(async () => {
    setXsrfCookie(null)
    vi.clearAllMocks()
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    localStorage.clear()
    sessionStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('sends credentials: include on GET requests without adding XSRF headers', async () => {
    setXsrfCookie('abc')
    fetchMock.mockImplementation(async () => jsonResponse({ ok: true }))

    await new ApiClient({ baseUrl: 'http://api.test' }).get('/api/me')

    const init = fetchMock.mock.calls[0][1]
    expect(init?.credentials).toBe('include')
    expect(init?.method).toBe('GET')
    expect(init?.headers).not.toHaveProperty('X-XSRF-TOKEN')
  })

  it('ensureCsrfCookie calls GET {base}/sanctum/csrf-cookie with credentials', async () => {
    fetchMock.mockImplementation(async () => emptyResponse())

    await new ApiClient({ baseUrl: 'http://api.test/' }).ensureCsrfCookie()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://api.test/sanctum/csrf-cookie')
    expect(init?.method).toBe('GET')
    expect(init?.credentials).toBe('include')
  })

  it('POSTs a JSON body with the decoded XSRF cookie, Accept and Accept-Language', async () => {
    setXsrfCookie(encodeURIComponent('tok=en/with+chars'))
    fetchMock.mockImplementation(async () => jsonResponse({ ok: true }))
    await i18n.changeLanguage('pt-BR')

    const result = await new ApiClient({ baseUrl: 'http://api.test' }).post<{ ok: boolean }>('/api/login', {
      email: 'a@b.co',
      password: 'secret',
    })

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://api.test/api/login')
    expect(init?.method).toBe('POST')
    expect(init?.credentials).toBe('include')
    expect(init?.body).toBe(JSON.stringify({ email: 'a@b.co', password: 'secret' }))
    expect(init?.headers).toEqual({
      Accept: 'application/json',
      'Accept-Language': 'pt-BR',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': 'tok=en/with+chars',
    })
  })

  it('fetches the CSRF cookie first when a mutating request has no XSRF cookie yet', async () => {
    fetchMock.mockImplementationOnce(async () => {
      setXsrfCookie('fresh')
      return emptyResponse()
    })
    fetchMock.mockImplementationOnce(async () => jsonResponse({ done: true }))

    await new ApiClient({ baseUrl: 'http://api.test' }).patch('/api/me/profile', { bio: 'hi' })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/sanctum/csrf-cookie')
    expect(fetchMock.mock.calls[1][0]).toBe('http://api.test/api/me/profile')
    expect(fetchMock.mock.calls[1][1]?.method).toBe('PATCH')
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ 'X-XSRF-TOKEN': 'fresh' })
  })

  it('supports DELETE and empty (204) responses', async () => {
    setXsrfCookie('abc')
    fetchMock.mockImplementation(async () => emptyResponse())

    const result = await new ApiClient({ baseUrl: 'http://api.test' }).delete('/api/me/avatar')

    expect(result).toBeUndefined()
    expect(fetchMock.mock.calls[0][1]?.method).toBe('DELETE')
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined()
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty('Content-Type')
  })

  it('uploads FormData without a manual Content-Type and without JSON encoding', async () => {
    setXsrfCookie('abc')
    fetchMock.mockImplementation(async () => jsonResponse({ ok: true }))
    const form = new FormData()
    form.append('avatar', new File(['x'], 'a.png', { type: 'image/png' }))

    await new ApiClient({ baseUrl: 'http://api.test' }).upload('/api/me/avatar', form)

    const init = fetchMock.mock.calls[0][1]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(form)
    expect(init?.credentials).toBe('include')
    expect(init?.headers).not.toHaveProperty('Content-Type')
    expect(init?.headers).toMatchObject({ 'X-XSRF-TOKEN': 'abc' })
  })

  it('parses Laravel 422 validation errors into ApiError.errors', async () => {
    setXsrfCookie('abc')
    fetchMock.mockImplementation(async () =>
      jsonResponse(
        { message: 'The email field is required.', errors: { email: ['The email field is required.'], handle: ['Taken'] } },
        { status: 422 },
      ),
    )

    const error = await new ApiClient({ baseUrl: 'http://api.test' })
      .post('/api/register', {})
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    const apiError = error as ApiError
    expect(apiError.status).toBe(422)
    expect(apiError.isValidation).toBe(true)
    expect(apiError.message).toBe('The email field is required.')
    expect(apiError.errors).toEqual({ email: ['The email field is required.'], handle: ['Taken'] })
    expect(apiError.firstError('handle')).toBe('Taken')
    expect(apiError.firstError('missing')).toBeUndefined()
  })

  it('falls back to a localized message for a 422 without a body message', async () => {
    setXsrfCookie('abc')
    fetchMock.mockImplementation(async () => jsonResponse({}, { status: 422 }))

    await expect(new ApiClient({ baseUrl: 'http://api.test' }).post('/api/x', {})).rejects.toMatchObject({
      status: 422,
      message: resources.en.errors.validationFailed,
      errors: {},
    })
  })

  it('retries exactly once after a 419 by refreshing the CSRF cookie', async () => {
    setXsrfCookie('stale')
    fetchMock
      .mockImplementationOnce(async () => jsonResponse({ message: 'CSRF token mismatch.' }, { status: 419 }))
      .mockImplementationOnce(async () => {
        setXsrfCookie('renewed')
        return emptyResponse()
      })
      .mockImplementationOnce(async () => jsonResponse({ ok: true }))

    const result = await new ApiClient({ baseUrl: 'http://api.test' }).post('/api/logout')

    expect(result).toEqual({ ok: true })
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      'http://api.test/api/logout',
      'http://api.test/sanctum/csrf-cookie',
      'http://api.test/api/logout',
    ])
    expect(fetchMock.mock.calls[2][1]?.headers).toMatchObject({ 'X-XSRF-TOKEN': 'renewed' })
  })

  it('does not retry a second 419 and surfaces a localized session error', async () => {
    setXsrfCookie('stale')
    fetchMock.mockImplementation(async (input) =>
      String(input).endsWith('/csrf-cookie') ? emptyResponse() : jsonResponse({}, { status: 419 }),
    )

    await expect(new ApiClient({ baseUrl: 'http://api.test' }).post('/api/logout')).rejects.toMatchObject({
      status: 419,
      message: resources.en.errors.sessionExpired,
    })
    // request, csrf refresh, single retry -> 3 calls, no further loop.
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('notifies the unauthorized handler on 401 and rejects with a localized ApiError', async () => {
    const onUnauthorized = vi.fn()
    fetchMock.mockImplementation(async () => jsonResponse({ message: 'Unauthenticated.' }, { status: 401 }))
    const client = new ApiClient({ baseUrl: 'http://api.test', onUnauthorized })

    await expect(client.get('/api/me')).rejects.toMatchObject({
      status: 401,
      message: resources.en.errors.unauthenticated,
    })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(onUnauthorized.mock.calls[0][0]).toBeInstanceOf(ApiError)

    client.setUnauthorizedHandler(undefined)
    await expect(client.get('/api/me')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('maps 403 and 429 to localized messages', async () => {
    const client = new ApiClient({ baseUrl: 'http://api.test' })

    fetchMock.mockImplementationOnce(async () => jsonResponse({}, { status: 403 }))
    await expect(client.get('/api/x')).rejects.toMatchObject({ message: resources.en.errors.forbidden })

    fetchMock.mockImplementationOnce(async () => jsonResponse({}, { status: 429 }))
    await expect(client.get('/api/x')).rejects.toMatchObject({ message: resources.en.errors.tooManyRequests })
  })

  it('never writes tokens or credentials to localStorage / sessionStorage', async () => {
    setXsrfCookie('abc')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    fetchMock.mockImplementation(async () => jsonResponse({ token: 'bearer-looking' }))

    await new ApiClient({ baseUrl: 'http://api.test' }).post('/api/login', { email: 'a@b.co', password: 'x' })

    expect(setItem).not.toHaveBeenCalled()
    expect(Object.keys(localStorage).filter((key) => /token|auth|bearer|session/i.test(key))).toEqual([])
    expect(sessionStorage.length).toBe(0)
    setItem.mockRestore()
  })

  it('never sends an Authorization header', async () => {
    setXsrfCookie('abc')
    fetchMock.mockImplementation(async () => jsonResponse({}))
    const client = new ApiClient({ baseUrl: 'http://api.test' })

    await client.get('/api/me')
    await client.post('/api/logout')

    for (const call of fetchMock.mock.calls) {
      expect(call[1]?.headers).not.toHaveProperty('Authorization')
    }
  })

  it('resolveUrl keeps absolute URLs and prefixes relative paths', () => {
    const client = new ApiClient({ baseUrl: 'http://api.test/' })

    expect(client.resolveUrl('/api/avatars/1')).toBe('http://api.test/api/avatars/1')
    expect(client.resolveUrl('https://cdn.test/a.png')).toBe('https://cdn.test/a.png')
  })
})
