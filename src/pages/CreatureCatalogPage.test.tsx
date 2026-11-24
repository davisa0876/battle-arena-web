import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import * as creaturesApi from '../api/creatures'
import { CreatureCatalogPage } from './CreatureCatalogPage'

vi.mock('../api/creatures')

const mockedApi = vi.mocked(creaturesApi)

function renderCatalog(initialEntry = '/creatures') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/creatures" element={<CreatureCatalogPage />} />
      </Routes>
    </MemoryRouter>,
  )
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
    expect(mockedApi.fetchCreatures).toHaveBeenCalled()
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
})
