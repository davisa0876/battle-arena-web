import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n, { resources } from '../../../i18n'
import { ApiError } from '../../../shared/lib/api/client'
import { makeRules } from '../../../test/fixtures'
import * as rulesApi from '../api/gameRules'
import type { GameRules } from '../types'
import { GameRulesPage } from './GameRulesPage'

vi.mock('../api/gameRules')

const mockedApi = vi.mocked(rulesApi)

// Deliberately unusual numbers: the page must render what the API sends, not its own constants.
const rules: GameRules = makeRules({
  version: '9.9.9',
  progression: {
    formula: 'step * level',
    starting_level: 4,
    starting_xp: 88,
    xp_increment_per_level: 137,
    max_level: 77,
    curve_samples: [
      { level: 1, xp_to_next_level: 4321, total_xp_required: 0 },
      { level: 2, xp_to_next_level: 98765, total_xp_required: 4321 },
    ],
  },
  selection: {
    stage_1: { unlock_level: 2, allowance_cap: 13, allowance_at_unlock: null, increment_per_level: null, defined_through_level: null },
    stage_2: { unlock_level: 17, allowance_cap: null, allowance_at_unlock: 3, increment_per_level: 2, defined_through_level: 41 },
    stage_3: { unlock_level: null, allowance_cap: null, allowance_at_unlock: null, increment_per_level: null, defined_through_level: null },
    samples: [
      { trainer_level: 1, stage_1_allowance: 8, stage_2_allowance: 0 },
      { trainer_level: 2, stage_1_allowance: 9, stage_2_allowance: 6543 },
    ],
  },
  battle: {
    pve_min_trainer_level: 3,
    pvp_min_trainer_level: 29,
    pvp_online_presence: {
      while_authenticated: true,
      requires_pvp_min_level: true,
      requires_pvp_screen: false,
    },
    rewards: { pve: { win: 111, loss: 222 }, pvp: { win: 333, loss: 444 } },
    playable: false,
  },
  starter_slugs: ['bulbasaur', 'eevee'],
  features: { pve: false, pvp: false, collection: true, evolution_execution: false, brand_new_flag: true },
})

function renderPage() {
  return render(
    <MemoryRouter>
      <GameRulesPage />
    </MemoryRouter>,
  )
}

describe('GameRulesPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads the rules from the API and shows loading first', async () => {
    mockedApi.fetchGameRules.mockResolvedValue(rules)

    renderPage()

    expect(screen.getByRole('status', { name: 'Loading the rules...' })).toBeInTheDocument()
    expect(await screen.findByText('Rules version 9.9.9')).toBeInTheDocument()
    expect(mockedApi.fetchGameRules).toHaveBeenCalledTimes(1)
  })

  it('renders sections A-F with translated headings', async () => {
    mockedApi.fetchGameRules.mockResolvedValue(rules)

    renderPage()
    await screen.findByText('Rules version 9.9.9')

    const titles = [
      'Trainer levels',
      'Creature selection',
      'Battle eligibility',
      'Battle XP rewards',
      'Evolution and trainer level',
      'Development status',
    ]
    for (const title of titles) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6)
  })

  it('shows the XP curve, increment, formula and max level exactly as the API provides them', async () => {
    mockedApi.fetchGameRules.mockResolvedValue(rules)

    renderPage()
    const table = await screen.findByRole('table', { name: /XP needed to advance/ })

    // 4,321 is both level 1's XP to advance and level 2's cumulative total.
    expect(within(table).getAllByText('4,321')).toHaveLength(2)
    expect(within(table).getByText('98,765')).toBeInTheDocument()
    expect(screen.getByText('XP increment per level: 137')).toBeInTheDocument()
    expect(screen.getByText('step * level')).toBeInTheDocument()
    expect(screen.getByText('Maximum level: 77')).toBeInTheDocument()
  })

  it('describes selection quotas from the API config and renders the allowance samples', async () => {
    mockedApi.fetchGameRules.mockResolvedValue(rules)

    renderPage()
    await screen.findByText('Rules version 9.9.9')

    expect(
      screen.getByText(
        'Stage 1 creatures: unlocked at trainer level 2. Your allowance equals your trainer level, up to a maximum of 13.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Stage 2 creatures: unlocked at trainer level 17 with 3 allowed at unlock, plus 2 more for each level after that\./),
    ).toBeInTheDocument()
    expect(screen.getByText(/defined through trainer level 41/)).toBeInTheDocument()
    expect(screen.getByText('Stage 3 creatures: selection rules are not defined yet.')).toBeInTheDocument()

    const samples = screen.getByRole('table', { name: /Selection allowance by trainer level/ })
    expect(within(samples).getByText('6,543')).toBeInTheDocument()
    expect(within(samples).getByText('8')).toBeInTheDocument()
  })

  it('shows stage 3 as unlocked only when the API defines an unlock level', async () => {
    mockedApi.fetchGameRules.mockResolvedValue({
      ...rules,
      selection: { ...rules.selection, stage_3: { ...rules.selection.stage_3, unlock_level: 55 } },
    })

    renderPage()

    expect(await screen.findByText('Stage 3 creatures: unlocked at trainer level 55.')).toBeInTheDocument()
  })

  it('shows PvE/PvP minimum levels from the API', async () => {
    mockedApi.fetchGameRules.mockResolvedValue(rules)

    renderPage()
    await screen.findByText('Rules version 9.9.9')

    expect(screen.getByText('PvE (solo battles) opens at trainer level 3.')).toBeInTheDocument()
    expect(screen.getByText('PvP (battles against other trainers) opens at trainer level 29.')).toBeInTheDocument()
    expect(screen.getByText(/Battles are not playable yet/)).toBeInTheDocument()
  })

  it('renders battle XP rewards as Coming Soon while battles are not playable', async () => {
    mockedApi.fetchGameRules.mockResolvedValue(rules)

    renderPage()
    const table = await screen.findByRole('table', { name: 'Trainer XP per battle result' })

    expect(within(table).getByText('111 XP')).toBeInTheDocument()
    expect(within(table).getByText('222 XP')).toBeInTheDocument()
    expect(within(table).getByText('333 XP')).toBeInTheDocument()
    expect(within(table).getByText('444 XP')).toBeInTheDocument()
    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
    expect(screen.getByText(/cannot be earned yet/)).toBeInTheDocument()
  })

  it('drops the Coming Soon notice once the API reports battles as playable', async () => {
    mockedApi.fetchGameRules.mockResolvedValue({ ...rules, battle: { ...rules.battle, playable: true } })

    renderPage()
    await screen.findByRole('table', { name: 'Trainer XP per battle result' })

    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument()
    expect(screen.getByText('Battles are playable.')).toBeInTheDocument()
  })

  it('lists server starters and feature flags with Available / Coming soon states', async () => {
    mockedApi.fetchGameRules.mockResolvedValue(rules)

    renderPage()
    await screen.findByText('Rules version 9.9.9')

    expect(screen.getByText('bulbasaur')).toBeInTheDocument()
    expect(screen.getByText('eevee')).toBeInTheDocument()

    const pve = screen.getByText('PvE battles').closest('li') as HTMLElement
    expect(within(pve).getByText('Coming soon')).toBeInTheDocument()
    expect(screen.queryByText('Battles')).not.toBeInTheDocument()
    const collection = screen.getByText('Creature collection').closest('li') as HTMLElement
    expect(within(collection).getByText('Available')).toBeInTheDocument()
    // Unknown flags still render, falling back to their key.
    expect(screen.getByText('brand_new_flag')).toBeInTheDocument()
  })

  it('switches the evolution copy based on the evolution_execution flag', async () => {
    mockedApi.fetchGameRules.mockResolvedValueOnce(rules)
    const { unmount } = renderPage()
    expect(await screen.findByText('Evolving is not available yet.')).toBeInTheDocument()
    unmount()

    mockedApi.fetchGameRules.mockResolvedValueOnce({ ...rules, features: { ...rules.features, evolution_execution: true } })
    renderPage()
    expect(await screen.findByText('Evolution is enabled on the server.')).toBeInTheDocument()
  })

  it('separates trainer level, evolution stage and owned creature level in section E', async () => {
    mockedApi.fetchGameRules.mockResolvedValue(rules)

    renderPage()
    const section = (await screen.findByRole('heading', { level: 2, name: 'Evolution and trainer level' })).closest(
      'section',
    ) as HTMLElement

    expect(within(section).getByText(/Trainer level is your account progression/)).toBeInTheDocument()
    expect(within(section).getByText(/Evolution stage is a property of a catalog creature/)).toBeInTheDocument()
    expect(within(section).getByText(/Owned creature level belongs to one creature/)).toBeInTheDocument()
  })

  it('handles an empty XP curve and empty selection samples', async () => {
    mockedApi.fetchGameRules.mockResolvedValue({
      ...rules,
      progression: { ...rules.progression, curve_samples: [] },
      selection: { ...rules.selection, samples: [] },
    })

    renderPage()

    expect(await screen.findByText('No XP curve samples were provided by the server.')).toBeInTheDocument()
    expect(screen.getByText('No selection samples were provided by the server.')).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: /XP needed to advance/ })).not.toBeInTheDocument()
  })

  it('is publicly readable: it only needs the rules endpoint, no session', async () => {
    mockedApi.fetchGameRules.mockResolvedValue(rules)

    renderPage()

    expect(await screen.findByText('Rules version 9.9.9')).toBeInTheDocument()
  })

  it('shows the API error with a retry button', async () => {
    mockedApi.fetchGameRules.mockRejectedValueOnce(new ApiError('Unable to connect to the API'))
    mockedApi.fetchGameRules.mockResolvedValueOnce(rules)

    renderPage()

    expect(await screen.findByText('Unable to connect to the API')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Rules version 9.9.9')).toBeInTheDocument()
    expect(mockedApi.fetchGameRules).toHaveBeenCalledTimes(2)
  })

  it('re-renders copy in another language while keeping API numbers', async () => {
    mockedApi.fetchGameRules.mockResolvedValue(rules)
    await i18n.changeLanguage('fr')

    renderPage()

    expect(await screen.findByRole('heading', { level: 2, name: resources.fr.gameRules.sections.b.title })).toBeInTheDocument()
    expect(screen.getAllByText(/4\s?321/).length).toBeGreaterThan(0)
    expect(screen.getByText(/niveau de dresseur 29/)).toBeInTheDocument()
  })
})
