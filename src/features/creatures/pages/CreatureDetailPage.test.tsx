import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import { ApiError } from '../../../shared/lib/api/client'
import * as creaturesApi from '../api/creatures'
import type { Creature } from '../types'
import { CreatureDetailPage } from './CreatureDetailPage'

vi.mock('../api/creatures')

const mockedApi = vi.mocked(creaturesApi)

function renderDetail(initialEntry = '/creatures/charmander') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/creatures" element={<p>Catalog route</p>} />
        <Route path="/creatures/:slug" element={<CreatureDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const charmander: Creature = {
  id: 4,
  name: 'Charmander',
  slug: 'charmander',
  height_cm: 60,
  weight_g: 8500,
  image_ref: null,
  image_url: 'https://example.test/charmander.png',
  types: [
    { id: 1, name: 'Fire', slug: 'fire' },
    { id: 3, name: 'Dragon', slug: 'dragon' },
  ],
  base_stats: {
    hp: 39,
    attack: 52,
    defense: 43,
    special_attack: 60,
    special_defense: 50,
    speed: 65,
  },
}

describe('CreatureDetailPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading message first and then the creature', async () => {
    mockedApi.fetchCreatureBySlug.mockResolvedValue({ data: charmander })

    renderDetail()

    expect(screen.getByText('Loading creature...')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Charmander' })).toBeInTheDocument()
    expect(screen.queryByText('Loading creature...')).not.toBeInTheDocument()
    expect(mockedApi.fetchCreatureBySlug).toHaveBeenCalledWith('charmander', expect.any(AbortSignal))
  })

  it('renders the hero: eyebrow, type badges and artwork', async () => {
    mockedApi.fetchCreatureBySlug.mockResolvedValue({ data: charmander })

    renderDetail()

    await screen.findByRole('heading', { level: 1, name: 'Charmander' })
    expect(screen.getByText('Creature Detail')).toBeInTheDocument()
    expect(screen.getByText('Fire')).toBeInTheDocument()
    expect(screen.getByText('Dragon')).toBeInTheDocument()
    expect(screen.getByAltText('Charmander')).toHaveAttribute('src', 'https://example.test/charmander.png')
  })

  it('renders formatted height/weight and every base stat', async () => {
    mockedApi.fetchCreatureBySlug.mockResolvedValue({ data: charmander })

    renderDetail()

    await screen.findByRole('heading', { level: 1, name: 'Charmander' })
    expect(screen.getByText('Height').nextElementSibling).toHaveTextContent('0.60 m')
    expect(screen.getByText('Weight').nextElementSibling).toHaveTextContent('8.5 kg')
    expect(screen.getByRole('heading', { level: 2, name: 'Base stats' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Evolutions' })).not.toBeInTheDocument()

    const expected: Record<string, number> = {
      HP: 39,
      Attack: 52,
      Defense: 43,
      'Special Attack': 60,
      'Special Defense': 50,
      Speed: 65,
    }
    for (const [label, value] of Object.entries(expected)) {
      expect(screen.getByRole('meter', { name: label })).toHaveAttribute('aria-valuenow', String(value))
    }
  })

  it('falls back to the em dash placeholder when height and weight are unknown', async () => {
    mockedApi.fetchCreatureBySlug.mockResolvedValue({
      data: { ...charmander, height_cm: null, weight_g: null },
    })

    renderDetail()

    await screen.findByRole('heading', { level: 1, name: 'Charmander' })
    expect(screen.getByText('Height').nextElementSibling).toHaveTextContent('—')
    expect(screen.getByText('Weight').nextElementSibling).toHaveTextContent('—')
  })

  it('uses image_ref when image_url is missing', async () => {
    mockedApi.fetchCreatureBySlug.mockResolvedValue({
      data: { ...charmander, image_url: null, image_ref: 'https://example.test/ref.png' },
    })

    renderDetail()

    expect(await screen.findByAltText('Charmander')).toHaveAttribute('src', 'https://example.test/ref.png')
  })

  it('shows the artwork fallback when the creature has no image', async () => {
    mockedApi.fetchCreatureBySlug.mockResolvedValue({
      data: { ...charmander, image_url: null, image_ref: null },
    })

    renderDetail()

    expect(
      await screen.findByRole('img', { name: 'No artwork available for Charmander' }),
    ).toBeInTheDocument()
  })

  it('renders evolutions below the stats', async () => {
    mockedApi.fetchCreatureBySlug.mockResolvedValue({
      data: {
        ...charmander,
        evolution_stage: 1,
        evolutions: [
          {
            id: 5,
            name: 'Charmeleon',
            slug: 'charmeleon',
            height_cm: 110,
            weight_g: 19000,
            image_ref: null,
            image_url: null,
            evolution_stage: 2,
            types: [{ id: 1, name: 'Fire', slug: 'fire' }],
            base_stats: charmander.base_stats,
            evolutions: [
              {
                id: 6,
                name: 'Charizard',
                slug: 'charizard',
                height_cm: 170,
                weight_g: 90500,
                image_ref: null,
                image_url: null,
                evolution_stage: 3,
                types: [
                  { id: 1, name: 'Fire', slug: 'fire' },
                  { id: 3, name: 'Flying', slug: 'flying' },
                ],
                base_stats: charmander.base_stats,
                evolutions: [],
              },
            ],
          },
        ],
      },
    })

    renderDetail()

    await screen.findByRole('heading', { level: 2, name: 'Evolutions' })
    expect(screen.getByRole('link', { name: /Charmeleon/i })).toHaveAttribute('href', '/creatures/charmeleon')
    expect(screen.getByRole('link', { name: /Charizard/i })).toHaveAttribute('href', '/creatures/charizard')
    expect(screen.getByText('Stage 2')).toBeInTheDocument()
    expect(screen.getByText('Stage 3')).toBeInTheDocument()
  })

  it('links back to the catalog', async () => {
    const user = userEvent.setup()
    mockedApi.fetchCreatureBySlug.mockResolvedValue({ data: charmander })

    renderDetail()

    const back = await screen.findByRole('link', { name: '← Back to catalog' })
    expect(back).toHaveAttribute('href', '/creatures')

    await user.click(back)
    expect(await screen.findByText('Catalog route')).toBeInTheDocument()
  })

  it('shows a not-found message without a retry button for a 404', async () => {
    mockedApi.fetchCreatureBySlug.mockRejectedValue(new ApiError('API request failed with status 404', 404))

    renderDetail('/creatures/ghost')

    expect(await screen.findByText('Creature not found.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })

  it('shows the error message and recovers through Retry', async () => {
    const user = userEvent.setup()
    mockedApi.fetchCreatureBySlug
      .mockRejectedValueOnce(new ApiError('Unable to connect to the API'))
      .mockResolvedValueOnce({ data: charmander })

    renderDetail()

    expect(await screen.findByText('Unable to connect to the API')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Charmander' })).toBeInTheDocument()
    expect(mockedApi.fetchCreatureBySlug).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('Unable to connect to the API')).not.toBeInTheDocument()
  })

  it('shows the translated fallback for unexpected errors', async () => {
    mockedApi.fetchCreatureBySlug.mockRejectedValue(new Error('boom'))

    renderDetail()

    expect(await screen.findByText('Unable to load this creature.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('keeps showing the error if the retry fails again', async () => {
    const user = userEvent.setup()
    mockedApi.fetchCreatureBySlug.mockRejectedValue(new ApiError('API request failed with status 500', 500))

    renderDetail()
    await screen.findByText('API request failed with status 500')

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => expect(mockedApi.fetchCreatureBySlug).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('API request failed with status 500')).toBeInTheDocument()
  })

  it('decodes the slug route param before calling the API', async () => {
    mockedApi.fetchCreatureBySlug.mockResolvedValue({ data: charmander })

    renderDetail('/creatures/mr%20mime')

    await screen.findByRole('heading', { level: 1, name: 'Charmander' })
    expect(mockedApi.fetchCreatureBySlug).toHaveBeenCalledWith('mr mime', expect.any(AbortSignal))
  })

  it('renders the stats inside an article with a labelled meters group', async () => {
    mockedApi.fetchCreatureBySlug.mockResolvedValue({ data: charmander })

    renderDetail()

    const article = await screen.findByRole('article')
    expect(within(article).getAllByRole('meter')).toHaveLength(6)
  })
})
