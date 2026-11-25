import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import { ApiError } from '../../../shared/lib/api/client'
import { authenticatedValue, makeProgress, makeUser, renderWithAuth } from '../../../test/authTestUtils'
import { makeCreature, makeOwned, makeRules } from '../../../test/fixtures'
import * as creaturesApi from '../../creatures/api/creatures'
import * as rulesApi from '../../game-rules/api/gameRules'
import type { GameRules } from '../../game-rules/types'
import * as collectionApi from '../api/collection'
import { MyCollectionPage } from './MyCollectionPage'

vi.mock('../api/collection')
vi.mock('../../creatures/api/creatures')
vi.mock('../../game-rules/api/gameRules')

const collection = vi.mocked(collectionApi)
const creatures = vi.mocked(creaturesApi)
const rulesMock = vi.mocked(rulesApi)

const rules: GameRules = makeRules({
  starter_slugs: ['bulbasaur', 'charmander'],
  features: { starter_selection: true, evolution_execution: false },
})

function renderPage(auth = authenticatedValue()) {
  return renderWithAuth(<MyCollectionPage />, { auth })
}

describe('MyCollectionPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    rulesMock.fetchGameRules.mockResolvedValue(rules)
    creatures.fetchCreatureBySlug.mockImplementation(async (slug) => ({
      data: makeCreature(slug === 'bulbasaur' ? 1 : 4, slug === 'bulbasaur' ? 'Bulbasaur' : 'Charmander'),
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading message, then an error with retry', async () => {
    collection.fetchMyCreatures.mockRejectedValueOnce(new ApiError('Unable to connect to the API'))
    collection.fetchMyCreatures.mockResolvedValueOnce([makeOwned(1, 'Pikachu', { is_active: true })])

    renderPage()

    expect(screen.getByRole('status', { name: 'Loading your collection...' })).toBeInTheDocument()
    expect(await screen.findByText('Unable to connect to the API')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Pikachu' })).toBeInTheDocument()
  })

  it('offers the server-defined starters when the collection is empty', async () => {
    collection.fetchMyCreatures.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Your collection is empty')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Choose Bulbasaur' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose Charmander' })).toBeInTheDocument()
    expect(creatures.fetchCreatureBySlug).toHaveBeenCalledWith('bulbasaur', expect.any(AbortSignal))
    expect(creatures.fetchCreatureBySlug).toHaveBeenCalledWith('charmander', expect.any(AbortSignal))
  })

  it('selects a starter and reloads the collection', async () => {
    collection.fetchMyCreatures.mockResolvedValueOnce([])
    collection.fetchMyCreatures.mockResolvedValueOnce([makeOwned(4, 'Charmander', { is_active: true })])
    collection.selectStarter.mockResolvedValue(undefined)

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Choose Charmander' }))

    expect(collection.selectStarter).toHaveBeenCalledWith('charmander')
    expect(await screen.findByRole('heading', { level: 2, name: 'Charmander' })).toBeInTheDocument()
    expect(screen.queryByText('Your collection is empty')).not.toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows an API error when starter selection fails', async () => {
    collection.fetchMyCreatures.mockResolvedValue([])
    collection.selectStarter.mockRejectedValue(
      new ApiError('Invalid starter.', 422, undefined, { creature_slug: ['Invalid starter.'] }),
    )

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Choose Bulbasaur' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid starter.')
  })

  it('explains when the server disabled starter selection', async () => {
    collection.fetchMyCreatures.mockResolvedValue([])
    rulesMock.fetchGameRules.mockResolvedValue({ ...rules, features: { starter_selection: false } })

    renderPage()

    expect(await screen.findByText('Starter selection is not available right now.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Choose/ })).not.toBeInTheDocument()
  })

  it('lists owned creatures with level, locked evolutions and lets the trainer switch the active one', async () => {
    collection.fetchMyCreatures.mockResolvedValueOnce([
      makeOwned(4, 'Charmander', {
        is_active: true,
        level: 7,
        evolution_options: [
          {
            creature: makeCreature(5, 'Charmeleon'),
            eligible: false,
            locked: true,
            reason_code: 'requirements_not_defined',
          },
        ],
      }),
      makeOwned(25, 'Pikachu'),
    ])
    collection.fetchMyCreatures.mockResolvedValueOnce([
      makeOwned(4, 'Charmander'),
      makeOwned(25, 'Pikachu', { is_active: true }),
    ])
    collection.setActiveCreature.mockResolvedValue(undefined)

    renderPage()

    const charmander = (await screen.findByRole('heading', { level: 2, name: 'Charmander' })).closest('article') as HTMLElement
    expect(within(charmander).getByText('Lv. 7')).toBeInTheDocument()
    expect(within(charmander).getByText('Charmeleon')).toBeInTheDocument()
    expect(within(charmander).getByText('Locked')).toBeInTheDocument()
    expect(within(charmander).getByText('Evolution requirements have not been defined yet.')).toBeInTheDocument()
    expect(within(charmander).queryByRole('button', { name: 'Set as active' })).not.toBeInTheDocument()
    expect(screen.getByText('Creatures owned: 2')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Set as active' }))

    expect(collection.setActiveCreature).toHaveBeenCalledWith(25)
    await waitFor(() => {
      const pikachu = screen.getByRole('heading', { level: 2, name: 'Pikachu' }).closest('article') as HTMLElement
      expect(within(pikachu).getByText('Active')).toBeInTheDocument()
    })
  })

  it('shows selection allowances and PvP unlock status from the /me trainer payload', async () => {
    collection.fetchMyCreatures.mockResolvedValue([makeOwned(25, 'Pikachu', { is_active: true })])
    const user = makeUser({
      progress: makeProgress({
        selection_allowances: [
          { evolution_stage: 1, total: 6, used: 2, remaining: 4 },
          { evolution_stage: 2, total: 0, used: 0, remaining: 0 },
        ],
        pvp_level_unlocked: true,
      }),
    })

    renderPage(authenticatedValue({ user }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Creature selections' })).toBeInTheDocument()
    expect(screen.getByText('Stage 1')).toBeInTheDocument()
    expect(screen.getByText('4 of 6 left')).toBeInTheDocument()
    expect(screen.getByText('2 used')).toBeInTheDocument()
    expect(screen.getByText('Stage 2')).toBeInTheDocument()
    expect(screen.getByText('0 of 0 left')).toBeInTheDocument()
    expect(screen.getByText('Unlocked')).toBeInTheDocument()
  })

  it('hides the allowances block when the API did not send owner-only fields', async () => {
    collection.fetchMyCreatures.mockResolvedValue([makeOwned(25, 'Pikachu')])

    renderPage()

    expect(await screen.findByRole('heading', { level: 2, name: 'Pikachu' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Creature selections' })).not.toBeInTheDocument()
  })
})