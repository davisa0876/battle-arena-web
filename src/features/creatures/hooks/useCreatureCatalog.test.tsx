import { act, renderHook, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import { ApiError } from '../../../shared/lib/api/client'
import * as creaturesApi from '../api/creatures'
import type { Creature, PaginatedCreatures } from '../types'
import { useCreatureCatalog, useCreatureTypes } from './useCreatureCatalog'

vi.mock('../api/creatures')

const mockedApi = vi.mocked(creaturesApi)

function wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

function creature(id: number, name: string): Creature {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    height_cm: 60,
    weight_g: 8500,
    image_ref: null,
    image_url: null,
    types: [{ id: 1, name: 'Fire', slug: 'fire' }],
    base_stats: { hp: 1, attack: 1, defense: 1, special_attack: 1, special_defense: 1, speed: 1 },
  }
}

function page(creatures: Creature[], meta: Partial<PaginatedCreatures['meta']> = {}): PaginatedCreatures {
  return {
    data: creatures,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 12,
      total: creatures.length,
      from: creatures.length ? 1 : null,
      to: creatures.length || null,
      ...meta,
    },
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const baseArgs = { search: '', type: '', page: 1, retryToken: 0 }

describe('useCreatureTypes', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('starts empty and loads the creature types', async () => {
    const types = [
      { id: 1, name: 'Fire', slug: 'fire' },
      { id: 2, name: 'Water', slug: 'water' },
    ]
    mockedApi.fetchCreatureTypes.mockResolvedValue({ data: types })

    const { result } = renderHook(() => useCreatureTypes(), { wrapper })

    expect(result.current).toEqual([])
    await waitFor(() => expect(result.current).toEqual(types))
    expect(mockedApi.fetchCreatureTypes).toHaveBeenCalledTimes(1)
    expect(mockedApi.fetchCreatureTypes).toHaveBeenCalledWith(expect.any(AbortSignal))
  })

  it('falls back to an empty list when the request fails', async () => {
    mockedApi.fetchCreatureTypes.mockRejectedValue(new ApiError('Unable to connect to the API'))

    const { result } = renderHook(() => useCreatureTypes(), { wrapper })

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current).toEqual([])
  })

  it('aborts the request on unmount and ignores a late rejection', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const request = deferred<{ data: { id: number; name: string; slug: string }[] }>()
    mockedApi.fetchCreatureTypes.mockReturnValue(request.promise)

    const { result, unmount } = renderHook(() => useCreatureTypes(), { wrapper })
    const signal = mockedApi.fetchCreatureTypes.mock.calls[0][0] as AbortSignal
    expect(signal.aborted).toBe(false)

    unmount()
    expect(signal.aborted).toBe(true)

    await act(async () => {
      request.reject(new DOMException('aborted', 'AbortError'))
      await request.promise.catch(() => undefined)
    })

    expect(result.current).toEqual([])
    expect(errorSpy).not.toHaveBeenCalled()
  })
})

describe('useCreatureCatalog', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage('en')
  })

  it('is loading first and becomes ready with creatures and meta', async () => {
    mockedApi.fetchCreatures.mockResolvedValue(
      page([creature(1, 'Charmander'), creature(2, 'Bulbasaur')], { current_page: 2, last_page: 4, total: 40 }),
    )

    const { result } = renderHook(() => useCreatureCatalog({ ...baseArgs, page: 2 }), { wrapper })

    expect(result.current).toEqual({ status: 'loading' })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current).toEqual({
      status: 'ready',
      creatures: [creature(1, 'Charmander'), creature(2, 'Bulbasaur')],
      total: 40,
      lastPage: 4,
      page: 2,
    })
  })

  it('requests the API with search, type, page and per_page 12', async () => {
    mockedApi.fetchCreatures.mockResolvedValue(page([]))

    renderHook(() => useCreatureCatalog({ search: 'char', type: 'fire', page: 3, retryToken: 0 }), { wrapper })

    await waitFor(() => expect(mockedApi.fetchCreatures).toHaveBeenCalledTimes(1))
    expect(mockedApi.fetchCreatures).toHaveBeenCalledWith(
      { search: 'char', type: 'fire', page: 3, per_page: 12 },
      expect.any(AbortSignal),
    )
  })

  it('omits empty search and type from the API call', async () => {
    mockedApi.fetchCreatures.mockResolvedValue(page([]))

    renderHook(() => useCreatureCatalog(baseArgs), { wrapper })

    await waitFor(() => expect(mockedApi.fetchCreatures).toHaveBeenCalledTimes(1))
    expect(mockedApi.fetchCreatures).toHaveBeenCalledWith(
      { search: undefined, type: undefined, page: 1, per_page: 12 },
      expect.any(AbortSignal),
    )
  })

  it('reports an ApiError message in the error state', async () => {
    mockedApi.fetchCreatures.mockRejectedValue(new ApiError('API request failed with status 500', 500))

    const { result } = renderHook(() => useCreatureCatalog(baseArgs), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: 'API request failed with status 500' })
  })

  it('uses the translated fallback message for generic errors', async () => {
    mockedApi.fetchCreatures.mockRejectedValue(new Error('kaboom'))

    const { result } = renderHook(() => useCreatureCatalog(baseArgs), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: 'Unable to load the creature catalog.' })
  })

  it('translates the generic error fallback to the active language', async () => {
    await i18n.changeLanguage('fr')
    mockedApi.fetchCreatures.mockRejectedValue('string failure')

    const { result } = renderHook(() => useCreatureCatalog(baseArgs), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toMatchObject({
      status: 'error',
      message: i18n.t('errors:catalogLoad', { lng: 'fr' }),
    })
    expect((result.current as { message: string }).message).not.toBe('Unable to load the creature catalog.')
  })

  it('shows loading until the new result arrives when the query changes', async () => {
    const first = deferred<PaginatedCreatures>()
    const second = deferred<PaginatedCreatures>()
    mockedApi.fetchCreatures.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    const { result, rerender } = renderHook((args) => useCreatureCatalog(args), {
      wrapper,
      initialProps: baseArgs,
    })

    await act(async () => {
      first.resolve(page([creature(1, 'Charmander')]))
    })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    rerender({ ...baseArgs, search: 'bulba' })

    // The previous result must not leak into the new query.
    expect(result.current).toEqual({ status: 'loading' })
    expect(mockedApi.fetchCreatures).toHaveBeenCalledTimes(2)

    await act(async () => {
      second.resolve(page([creature(2, 'Bulbasaur')]))
    })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current).toMatchObject({ status: 'ready', creatures: [creature(2, 'Bulbasaur')] })
  })

  it('aborts the previous request when the query changes and ignores its result', async () => {
    const first = deferred<PaginatedCreatures>()
    const second = deferred<PaginatedCreatures>()
    mockedApi.fetchCreatures.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    const { result, rerender } = renderHook((args) => useCreatureCatalog(args), {
      wrapper,
      initialProps: baseArgs,
    })
    const firstSignal = mockedApi.fetchCreatures.mock.calls[0][1] as AbortSignal

    rerender({ ...baseArgs, type: 'water' })
    expect(firstSignal.aborted).toBe(true)

    await act(async () => {
      second.resolve(page([creature(2, 'Squirtle')]))
    })
    // Like a real fetch, the aborted request rejects with an AbortError.
    await act(async () => {
      first.reject(new DOMException('aborted', 'AbortError'))
      await first.promise.catch(() => undefined)
    })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current).toMatchObject({ creatures: [creature(2, 'Squirtle')] })
  })

  it('does not set an error when the request was aborted', async () => {
    const request = deferred<PaginatedCreatures>()
    mockedApi.fetchCreatures.mockReturnValue(request.promise)

    const { result, unmount } = renderHook(() => useCreatureCatalog(baseArgs), { wrapper })
    const signal = mockedApi.fetchCreatures.mock.calls[0][1] as AbortSignal

    unmount()
    expect(signal.aborted).toBe(true)

    await act(async () => {
      request.reject(new ApiError('Unable to connect to the API'))
      await request.promise.catch(() => undefined)
    })

    expect(result.current).toEqual({ status: 'loading' })
  })

  it('ignores a rejection from an aborted request after the query changes', async () => {
    const first = deferred<PaginatedCreatures>()
    const second = deferred<PaginatedCreatures>()
    mockedApi.fetchCreatures.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    const { result, rerender } = renderHook((args) => useCreatureCatalog(args), {
      wrapper,
      initialProps: baseArgs,
    })

    rerender({ ...baseArgs, page: 2 })
    await act(async () => {
      first.reject(new DOMException('aborted', 'AbortError'))
      await first.promise.catch(() => undefined)
    })

    expect(result.current).toEqual({ status: 'loading' })

    await act(async () => {
      second.resolve(page([creature(3, 'Pidgey')], { current_page: 2, last_page: 2 }))
    })
    await waitFor(() => expect(result.current.status).toBe('ready'))
  })

  it('refetches when retryToken changes', async () => {
    mockedApi.fetchCreatures
      .mockRejectedValueOnce(new ApiError('Unable to connect to the API'))
      .mockResolvedValueOnce(page([creature(1, 'Charmander')]))

    const { result, rerender } = renderHook((args) => useCreatureCatalog(args), {
      wrapper,
      initialProps: baseArgs,
    })

    await waitFor(() => expect(result.current.status).toBe('error'))

    rerender({ ...baseArgs, retryToken: 1 })
    expect(result.current).toEqual({ status: 'loading' })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(mockedApi.fetchCreatures).toHaveBeenCalledTimes(2)
  })

  it('refetches when the active language changes', async () => {
    mockedApi.fetchCreatures.mockResolvedValue(page([creature(1, 'Charmander')]))

    const { result } = renderHook(() => useCreatureCatalog(baseArgs), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      await i18n.changeLanguage('es')
    })

    await waitFor(() => expect(mockedApi.fetchCreatures).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.status).toBe('ready'))
  })
})
