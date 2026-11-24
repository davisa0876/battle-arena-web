import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../../shared/lib/api/client'
import { fetchCreatureBySlug, fetchCreatures, fetchCreatureTypes } from './creatures'

vi.mock('../../../shared/lib/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

const getMock = vi.mocked(apiClient.get)

describe('creatures API', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchCreatures', () => {
    it('requests the bare collection when no params are given', async () => {
      getMock.mockResolvedValue({ data: [], meta: {} })

      await fetchCreatures()

      expect(getMock).toHaveBeenCalledWith('/api/creatures', undefined)
    })

    it('returns the payload from the API client', async () => {
      const payload = { data: [], meta: { current_page: 1 } }
      getMock.mockResolvedValue(payload)

      await expect(fetchCreatures({ page: 1 })).resolves.toBe(payload)
    })

    it('builds the query string from all params', async () => {
      getMock.mockResolvedValue({})

      await fetchCreatures({ search: 'char', type: 'fire', page: 2, per_page: 12 })

      expect(getMock).toHaveBeenCalledWith(
        '/api/creatures?search=char&type=fire&page=2&per_page=12',
        undefined,
      )
    })

    it('trims search and type', async () => {
      getMock.mockResolvedValue({})

      await fetchCreatures({ search: '  char  ', type: '  fire\t' })

      expect(getMock).toHaveBeenCalledWith('/api/creatures?search=char&type=fire', undefined)
    })

    it('omits empty and whitespace-only search/type', async () => {
      getMock.mockResolvedValue({})

      await fetchCreatures({ search: '', type: '   ' })

      expect(getMock).toHaveBeenCalledWith('/api/creatures', undefined)
    })

    it('omits undefined values', async () => {
      getMock.mockResolvedValue({})

      await fetchCreatures({ search: undefined, type: 'water', page: undefined })

      expect(getMock).toHaveBeenCalledWith('/api/creatures?type=water', undefined)
    })

    it.each([0, -1, -10])('omits non-positive page %s and per_page %s', async (value) => {
      getMock.mockResolvedValue({})

      await fetchCreatures({ page: value, per_page: value })

      expect(getMock).toHaveBeenCalledWith('/api/creatures', undefined)
    })

    it('includes only positive pagination values', async () => {
      getMock.mockResolvedValue({})

      await fetchCreatures({ page: 3, per_page: 0 })
      await fetchCreatures({ page: 0, per_page: 24 })

      expect(getMock).toHaveBeenNthCalledWith(1, '/api/creatures?page=3', undefined)
      expect(getMock).toHaveBeenNthCalledWith(2, '/api/creatures?per_page=24', undefined)
    })

    it('url-encodes special characters in search', async () => {
      getMock.mockResolvedValue({})

      await fetchCreatures({ search: 'mr. mime & co' })

      expect(getMock).toHaveBeenCalledWith('/api/creatures?search=mr.+mime+%26+co', undefined)
    })

    it('passes the AbortSignal through to the client', async () => {
      getMock.mockResolvedValue({})
      const controller = new AbortController()

      await fetchCreatures({ page: 1 }, controller.signal)

      expect(getMock).toHaveBeenCalledWith('/api/creatures?page=1', controller.signal)
    })

    it('propagates client errors', async () => {
      const failure = new Error('network down')
      getMock.mockRejectedValue(failure)

      await expect(fetchCreatures()).rejects.toBe(failure)
    })
  })

  describe('fetchCreatureBySlug', () => {
    it('requests the creature detail endpoint', async () => {
      getMock.mockResolvedValue({ data: {} })

      await fetchCreatureBySlug('bulbasaur')

      expect(getMock).toHaveBeenCalledWith('/api/creatures/bulbasaur', undefined)
    })

    it('encodes special characters in the slug', async () => {
      getMock.mockResolvedValue({ data: {} })

      await fetchCreatureBySlug('mr mime/é?#')

      expect(getMock).toHaveBeenCalledWith(
        `/api/creatures/${encodeURIComponent('mr mime/é?#')}`,
        undefined,
      )
      expect(getMock.mock.calls[0][0]).toBe('/api/creatures/mr%20mime%2F%C3%A9%3F%23')
    })

    it('passes the AbortSignal through to the client', async () => {
      getMock.mockResolvedValue({ data: {} })
      const controller = new AbortController()

      await fetchCreatureBySlug('pikachu', controller.signal)

      expect(getMock).toHaveBeenCalledWith('/api/creatures/pikachu', controller.signal)
    })
  })

  describe('fetchCreatureTypes', () => {
    it('requests the creature types endpoint', async () => {
      const payload = { data: [{ id: 1, name: 'Fire', slug: 'fire' }] }
      getMock.mockResolvedValue(payload)

      await expect(fetchCreatureTypes()).resolves.toBe(payload)
      expect(getMock).toHaveBeenCalledWith('/api/creature-types', undefined)
    })

    it('passes the AbortSignal through to the client', async () => {
      getMock.mockResolvedValue({ data: [] })
      const controller = new AbortController()

      await fetchCreatureTypes(controller.signal)

      expect(getMock).toHaveBeenCalledWith('/api/creature-types', controller.signal)
    })
  })
})
