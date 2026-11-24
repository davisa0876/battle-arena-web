import { act, renderHook, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import { ApiError } from '../../../shared/lib/api/client'
import * as creaturesApi from '../api/creatures'
import type { Creature, CreatureDetailResponse } from '../types'
import { useCreatureDetail } from './useCreatureDetail'

vi.mock('../api/creatures')

const mockedApi = vi.mocked(creaturesApi)

function wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

function creature(name: string): Creature {
  return {
    id: 1,
    name,
    slug: name.toLowerCase(),
    height_cm: 70,
    weight_g: 6900,
    image_ref: null,
    image_url: null,
    types: [{ id: 2, name: 'Grass', slug: 'grass' }],
    base_stats: { hp: 45, attack: 49, defense: 49, special_attack: 65, special_defense: 65, speed: 45 },
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

describe('useCreatureDetail', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage('en')
  })

  it('returns notFound with the missingSlug message for an empty slug and does not fetch', () => {
    const { result } = renderHook(() => useCreatureDetail('', 0), { wrapper })

    expect(result.current).toEqual({ status: 'error', message: 'Missing creature slug.', notFound: true })
    expect(mockedApi.fetchCreatureBySlug).not.toHaveBeenCalled()
  })

  it('starts loading and resolves to the ready creature', async () => {
    mockedApi.fetchCreatureBySlug.mockResolvedValue({ data: creature('Bulbasaur') })

    const { result } = renderHook(() => useCreatureDetail('bulbasaur', 0), { wrapper })

    expect(result.current).toEqual({ status: 'loading' })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current).toEqual({ status: 'ready', creature: creature('Bulbasaur') })
    expect(mockedApi.fetchCreatureBySlug).toHaveBeenCalledWith('bulbasaur', expect.any(AbortSignal))
  })

  it('maps a 404 ApiError to a translated notFound state', async () => {
    mockedApi.fetchCreatureBySlug.mockRejectedValue(new ApiError('API request failed with status 404', 404))

    const { result } = renderHook(() => useCreatureDetail('ghost', 0), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: 'Creature not found.', notFound: true })
  })

  it('surfaces the message of other ApiErrors without notFound', async () => {
    mockedApi.fetchCreatureBySlug.mockRejectedValue(new ApiError('API request failed with status 500', 500))

    const { result } = renderHook(() => useCreatureDetail('bulbasaur', 0), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: 'API request failed with status 500' })
    expect(result.current).not.toHaveProperty('notFound')
  })

  it('surfaces network ApiErrors (no status)', async () => {
    mockedApi.fetchCreatureBySlug.mockRejectedValue(new ApiError('Unable to connect to the API'))

    const { result } = renderHook(() => useCreatureDetail('bulbasaur', 0), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: 'Unable to connect to the API' })
  })

  it('uses the translated detailLoad fallback for non-ApiErrors', async () => {
    mockedApi.fetchCreatureBySlug.mockRejectedValue(new Error('weird'))

    const { result } = renderHook(() => useCreatureDetail('bulbasaur', 0), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toEqual({ status: 'error', message: 'Unable to load this creature.' })
  })

  it('does not set state when the request was aborted by unmount', async () => {
    const request = deferred<CreatureDetailResponse>()
    mockedApi.fetchCreatureBySlug.mockReturnValue(request.promise)

    const { result, unmount } = renderHook(() => useCreatureDetail('bulbasaur', 0), { wrapper })
    const signal = mockedApi.fetchCreatureBySlug.mock.calls[0][1] as AbortSignal

    unmount()
    expect(signal.aborted).toBe(true)

    await act(async () => {
      request.reject(new ApiError('Unable to connect to the API'))
      await request.promise.catch(() => undefined)
    })

    expect(result.current).toEqual({ status: 'loading' })
  })

  it('resets to loading when the slug changes and then shows the new creature', async () => {
    const second = deferred<CreatureDetailResponse>()
    mockedApi.fetchCreatureBySlug
      .mockResolvedValueOnce({ data: creature('Bulbasaur') })
      .mockReturnValueOnce(second.promise)

    const { result, rerender } = renderHook(({ slug }) => useCreatureDetail(slug, 0), {
      wrapper,
      initialProps: { slug: 'bulbasaur' },
    })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    rerender({ slug: 'charmander' })

    expect(result.current).toEqual({ status: 'loading' })
    expect(mockedApi.fetchCreatureBySlug).toHaveBeenLastCalledWith('charmander', expect.any(AbortSignal))

    await act(async () => {
      second.resolve({ data: creature('Charmander') })
    })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current).toMatchObject({ creature: { name: 'Charmander' } })
  })

  it('returns to the missing-slug error when the slug becomes empty', async () => {
    mockedApi.fetchCreatureBySlug.mockResolvedValue({ data: creature('Bulbasaur') })

    const { result, rerender } = renderHook(({ slug }) => useCreatureDetail(slug, 0), {
      wrapper,
      initialProps: { slug: 'bulbasaur' },
    })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    rerender({ slug: '' })

    expect(result.current).toEqual({ status: 'error', message: 'Missing creature slug.', notFound: true })
  })

  it('ignores a stale response from a previous slug', async () => {
    const first = deferred<CreatureDetailResponse>()
    const second = deferred<CreatureDetailResponse>()
    mockedApi.fetchCreatureBySlug.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    const { result, rerender } = renderHook(({ slug }) => useCreatureDetail(slug, 0), {
      wrapper,
      initialProps: { slug: 'bulbasaur' },
    })
    rerender({ slug: 'charmander' })

    await act(async () => {
      second.resolve({ data: creature('Charmander') })
    })
    // Like a real fetch, the aborted request rejects with an AbortError.
    await act(async () => {
      first.reject(new DOMException('aborted', 'AbortError'))
      await first.promise.catch(() => undefined)
    })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current).toMatchObject({ creature: { name: 'Charmander' } })
  })

  it('refetches when retryToken changes', async () => {
    mockedApi.fetchCreatureBySlug
      .mockRejectedValueOnce(new ApiError('API request failed with status 500', 500))
      .mockResolvedValueOnce({ data: creature('Bulbasaur') })

    const { result, rerender } = renderHook(({ token }) => useCreatureDetail('bulbasaur', token), {
      wrapper,
      initialProps: { token: 0 },
    })
    await waitFor(() => expect(result.current.status).toBe('error'))

    rerender({ token: 1 })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(mockedApi.fetchCreatureBySlug).toHaveBeenCalledTimes(2)
    expect(result.current).toMatchObject({ creature: { name: 'Bulbasaur' } })
  })

  it('aborts the in-flight request when retryToken changes', () => {
    const first = deferred<CreatureDetailResponse>()
    mockedApi.fetchCreatureBySlug.mockReturnValueOnce(first.promise).mockReturnValue(new Promise(() => undefined))

    const { rerender } = renderHook(({ token }) => useCreatureDetail('bulbasaur', token), {
      wrapper,
      initialProps: { token: 0 },
    })
    const firstSignal = mockedApi.fetchCreatureBySlug.mock.calls[0][1] as AbortSignal

    rerender({ token: 1 })

    expect(firstSignal.aborted).toBe(true)
    expect(mockedApi.fetchCreatureBySlug).toHaveBeenCalledTimes(2)
  })
})
