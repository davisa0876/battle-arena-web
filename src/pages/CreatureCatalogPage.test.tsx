import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../shared/lib/api/client'
import * as creaturesApi from '../features/creatures/api/creatures'
import { CreatureCatalogPage } from '../features/creatures/pages/CreatureCatalogPage'
import type { Creature, PaginatedCreatures } from '../features/creatures/types'
import '../i18n'

vi.mock('../features/creatures/api/creatures')

const mockedApi = vi.mocked(creaturesApi)

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function renderCatalog(initialEntry = '/creatures') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/creatures" element={<CreatureCatalogPage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

function makeCreature(id: number, name: string, typeSlug = 'fire'): Creature {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    height_cm: 60,
    weight_g: 8500,
    image_ref: null,
    image_url: null,
    types: [{ id: 1, name: typeSlug, slug: typeSlug }],
    base_stats: { hp: 1, attack: 1, defense: 1, special_attack: 1, special_defense: 1, speed: 1 },
  }
}

function makePage(creatures: Creature[], meta: Partial<PaginatedCreatures['meta']> = {}): PaginatedCreatures {
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

describe('CreatureCatalogPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads catalog results from the API', async () => {
    mockedApi.fetchCreatureTypes.mockResolvedValue({
      data: [{ id: 1, name: 'Fire', slug: 'fire' }],
    })
    mockedApi.fetchCreatures.mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Charmander',
          slug: 'charmander',
          height_cm: 60,
          weight_g: 8500,
          image_ref: null,
          image_url: 'https://example.test/charmander.png',
          types: [{ id: 1, name: 'Fire', slug: 'fire' }],
          base_stats: {
            hp: 39,
            attack: 52,
            defense: 43,
            special_attack: 60,
            special_defense: 50,
            speed: 65,
          },
        },
      ],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 1,
        from: 1,
        to: 1,
      },
    })

    renderCatalog()

    expect(screen.getByText('Loading creatures...')).toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: 'Charmander' })).toBeInTheDocument()
    expect(mockedApi.fetchCreatures).toHaveBeenCalledWith({ page: 1, per_page: 12 }, expect.any(AbortSignal))
  })

  it('shows an empty catalog state', async () => {
    mockedApi.fetchCreatureTypes.mockResolvedValue({ data: [] })
    mockedApi.fetchCreatures.mockResolvedValue({
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
        from: null,
        to: null,
      },
    })

    renderCatalog()

    expect(await screen.findByText('No creatures found')).toBeInTheDocument()
  })

  it('handles API failure with retry', async () => {
    const user = userEvent.setup()
    mockedApi.fetchCreatureTypes.mockResolvedValue({ data: [] })
    mockedApi.fetchCreatures
      .mockRejectedValueOnce(new ApiError('Unable to connect to the API'))
      .mockResolvedValueOnce({
        data: [
          {
            id: 2,
            name: 'Bulbasaur',
            slug: 'bulbasaur',
            height_cm: 70,
            weight_g: 6900,
            image_ref: null,
            image_url: null,
            types: [{ id: 2, name: 'Grass', slug: 'grass' }],
            base_stats: {
              hp: 45,
              attack: 49,
              defense: 49,
              special_attack: 65,
              special_defense: 65,
              speed: 45,
            },
          },
        ],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 12,
          total: 1,
          from: 1,
          to: 1,
        },
      })

    renderCatalog()

    expect(await screen.findByText('Could not load the catalog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Bulbasaur' })).toBeInTheDocument()
    })
  })

  describe('filters, URL state and pagination', () => {
    const fireAndWater = {
      data: [
        { id: 1, name: 'Fire', slug: 'fire' },
        { id: 2, name: 'Water', slug: 'water' },
      ],
    }

    it('forwards initial URL params (?search&type&page) to the API and hydrates the controls', async () => {
      mockedApi.fetchCreatureTypes.mockResolvedValue(fireAndWater)
      mockedApi.fetchCreatures.mockResolvedValue(
        makePage([makeCreature(1, 'Charmeleon')], { current_page: 2, last_page: 3, total: 25 }),
      )

      renderCatalog('/creatures?search=char&type=fire&page=2')

      expect(await screen.findByRole('heading', { name: 'Charmeleon' })).toBeInTheDocument()
      expect(mockedApi.fetchCreatures).toHaveBeenCalledWith(
        { search: 'char', type: 'fire', page: 2, per_page: 12 },
        expect.any(AbortSignal),
      )
      expect(screen.getByLabelText('Search by name')).toHaveValue('char')
      await waitFor(() => expect(screen.getByRole('combobox', { name: 'Filter by type' })).toHaveValue('fire'))
      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
      expect(screen.getByText('Showing page 2 of 3 · 25 creatures')).toBeInTheDocument()
      expect(screen.getByText('Page 2 / 3')).toBeInTheDocument()
    })

    it.each([
      ['/creatures?page=abc', 1],
      ['/creatures?page=0', 1],
      ['/creatures?page=-4', 1],
      ['/creatures?page=3', 3],
    ])('normalizes %s to page %i', async (url, expectedPage) => {
      mockedApi.fetchCreatureTypes.mockResolvedValue({ data: [] })
      mockedApi.fetchCreatures.mockResolvedValue(makePage([]))

      renderCatalog(url)

      await waitFor(() => expect(mockedApi.fetchCreatures).toHaveBeenCalled())
      expect(mockedApi.fetchCreatures).toHaveBeenCalledWith(
        { page: expectedPage, per_page: 12 },
        expect.any(AbortSignal),
      )
    })

    it('loads the creature types into the type filter', async () => {
      mockedApi.fetchCreatureTypes.mockResolvedValue(fireAndWater)
      mockedApi.fetchCreatures.mockResolvedValue(makePage([]))

      renderCatalog()

      expect(await screen.findByRole('option', { name: 'Water' })).toHaveValue('water')
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        'All types',
        'Fire',
        'Water',
      ])
    })

    it('submitting a search updates the URL, resets the page and calls the API with the term', async () => {
      const user = userEvent.setup()
      mockedApi.fetchCreatureTypes.mockResolvedValue({ data: [] })
      mockedApi.fetchCreatures.mockResolvedValue(makePage([makeCreature(1, 'Charmander')]))

      renderCatalog('/creatures?page=2')
      await screen.findByRole('heading', { name: 'Charmander' })

      await user.type(screen.getByLabelText('Search by name'), '  pika ')
      await user.click(screen.getByRole('button', { name: 'Search' }))

      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/creatures?search=pika'))
      expect(screen.getByTestId('location').textContent).toBe('/creatures?search=pika')
      await waitFor(() =>
        expect(mockedApi.fetchCreatures).toHaveBeenLastCalledWith(
          { search: 'pika', page: 1, per_page: 12 },
          expect.any(AbortSignal),
        ),
      )
    })

    it('submitting with Enter applies the search', async () => {
      const user = userEvent.setup()
      mockedApi.fetchCreatureTypes.mockResolvedValue({ data: [] })
      mockedApi.fetchCreatures.mockResolvedValue(makePage([]))

      renderCatalog()
      await screen.findByText('No creatures found')

      await user.type(screen.getByLabelText('Search by name'), 'bulba{Enter}')

      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('?search=bulba'))
    })

    it('does not put a blank search in the URL', async () => {
      const user = userEvent.setup()
      mockedApi.fetchCreatureTypes.mockResolvedValue({ data: [] })
      mockedApi.fetchCreatures.mockResolvedValue(makePage([]))

      renderCatalog('/creatures?type=fire')
      await screen.findByText('No creatures found')

      await user.type(screen.getByLabelText('Search by name'), '   ')
      await user.click(screen.getByRole('button', { name: 'Search' }))

      await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/creatures?type=fire'))
    })

    it('changing the type filter updates the URL, keeps the search and resets the page', async () => {
      const user = userEvent.setup()
      mockedApi.fetchCreatureTypes.mockResolvedValue(fireAndWater)
      mockedApi.fetchCreatures.mockResolvedValue(
        makePage([makeCreature(1, 'Squirtle', 'water')], { current_page: 2, last_page: 3 }),
      )

      renderCatalog('/creatures?search=sq&page=2')
      await screen.findByRole('heading', { name: 'Squirtle' })
      await screen.findByRole('option', { name: 'Water' })

      await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by type' }), 'water')

      await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/creatures?search=sq&type=water'))
      await waitFor(() =>
        expect(mockedApi.fetchCreatures).toHaveBeenLastCalledWith(
          { search: 'sq', type: 'water', page: 1, per_page: 12 },
          expect.any(AbortSignal),
        ),
      )
    })

    it('selecting "All types" removes the type from the URL', async () => {
      const user = userEvent.setup()
      mockedApi.fetchCreatureTypes.mockResolvedValue(fireAndWater)
      mockedApi.fetchCreatures.mockResolvedValue(makePage([makeCreature(1, 'Charmander')]))

      renderCatalog('/creatures?type=fire')
      await screen.findByRole('heading', { name: 'Charmander' })
      await screen.findByRole('option', { name: 'Fire' })

      await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by type' }), 'All types')

      await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/creatures'))
      await waitFor(() =>
        expect(mockedApi.fetchCreatures).toHaveBeenLastCalledWith({ page: 1, per_page: 12 }, expect.any(AbortSignal)),
      )
    })

    it('clearing filters empties the URL and the search input and reloads unfiltered results', async () => {
      const user = userEvent.setup()
      mockedApi.fetchCreatureTypes.mockResolvedValue(fireAndWater)
      mockedApi.fetchCreatures.mockResolvedValue(makePage([makeCreature(1, 'Charmander')]))

      renderCatalog('/creatures?search=char&type=fire&page=2')
      await screen.findByRole('heading', { name: 'Charmander' })

      await user.click(screen.getByRole('button', { name: 'Clear' }))

      await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/creatures'))
      expect(screen.getByLabelText('Search by name')).toHaveValue('')
      expect(screen.getByRole('combobox', { name: 'Filter by type' })).toHaveValue('')
      expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
      await waitFor(() =>
        expect(mockedApi.fetchCreatures).toHaveBeenLastCalledWith({ page: 1, per_page: 12 }, expect.any(AbortSignal)),
      )
    })

    it('paginates with Next / Previous while preserving filters in the URL', async () => {
      const user = userEvent.setup()
      mockedApi.fetchCreatureTypes.mockResolvedValue({ data: [] })
      mockedApi.fetchCreatures.mockImplementation(async (params) =>
        makePage([makeCreature(params?.page ?? 1, `Creature${params?.page ?? 1}`)], {
          current_page: params?.page ?? 1,
          last_page: 3,
          total: 30,
        }),
      )

      renderCatalog('/creatures?search=c')
      await screen.findByRole('heading', { name: 'Creature1' })
      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Next' }))

      expect(await screen.findByRole('heading', { name: 'Creature2' })).toBeInTheDocument()
      expect(screen.getByTestId('location').textContent).toBe('/creatures?search=c&page=2')
      expect(mockedApi.fetchCreatures).toHaveBeenLastCalledWith(
        { search: 'c', page: 2, per_page: 12 },
        expect.any(AbortSignal),
      )

      await user.click(screen.getByRole('button', { name: 'Next' }))
      expect(await screen.findByRole('heading', { name: 'Creature3' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Previous' }))
      expect(await screen.findByRole('heading', { name: 'Creature2' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Previous' }))
      expect(await screen.findByRole('heading', { name: 'Creature1' })).toBeInTheDocument()
      // page 1 is the default, so it is dropped from the URL
      expect(screen.getByTestId('location').textContent).toBe('/creatures?search=c')
    })

    it('renders a link to the detail page for every creature', async () => {
      mockedApi.fetchCreatureTypes.mockResolvedValue({ data: [] })
      mockedApi.fetchCreatures.mockResolvedValue(
        makePage([makeCreature(1, 'Charmander'), makeCreature(2, 'Bulbasaur', 'grass')], { total: 2 }),
      )

      renderCatalog()

      expect(await screen.findByRole('link', { name: /Charmander/ })).toHaveAttribute('href', '/creatures/charmander')
      expect(screen.getByRole('link', { name: /Bulbasaur/ })).toHaveAttribute('href', '/creatures/bulbasaur')
      expect(screen.getByText('Showing page 1 of 1 · 2 creatures')).toBeInTheDocument()
    })

    it('shows the ApiError message in the error state', async () => {
      mockedApi.fetchCreatureTypes.mockResolvedValue({ data: [] })
      mockedApi.fetchCreatures.mockRejectedValue(new ApiError('API request failed with status 500', 500))

      renderCatalog()

      expect(await screen.findByText('Could not load the catalog')).toBeInTheDocument()
      expect(screen.getByText('API request failed with status 500')).toBeInTheDocument()
    })

    it('shows the translated fallback message for unexpected errors', async () => {
      mockedApi.fetchCreatureTypes.mockResolvedValue({ data: [] })
      mockedApi.fetchCreatures.mockRejectedValue(new Error('boom'))

      renderCatalog()

      expect(await screen.findByText('Unable to load the creature catalog.')).toBeInTheDocument()
    })

    it('keeps the filters usable when the types request fails', async () => {
      mockedApi.fetchCreatureTypes.mockRejectedValue(new ApiError('Unable to connect to the API'))
      mockedApi.fetchCreatures.mockResolvedValue(makePage([makeCreature(1, 'Charmander')]))

      renderCatalog()

      await screen.findByRole('heading', { name: 'Charmander' })
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['All types'])
    })
  })
})
