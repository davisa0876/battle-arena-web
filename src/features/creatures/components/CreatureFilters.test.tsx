import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import type { CreatureType } from '../types'
import { CreatureFilters } from './CreatureFilters'

const types: CreatureType[] = [
  { id: 1, name: 'Fire', slug: 'fire' },
  { id: 2, name: 'Water', slug: 'water' },
]

interface Overrides {
  search?: string
  type?: string
  draftSearch?: string
  types?: CreatureType[]
}

function setup(overrides: Overrides = {}) {
  const onDraftSearchChange = vi.fn()
  const onApply = vi.fn()
  const onClear = vi.fn()

  render(
    <CreatureFilters
      search={overrides.search ?? ''}
      type={overrides.type ?? ''}
      draftSearch={overrides.draftSearch ?? ''}
      types={overrides.types ?? types}
      onDraftSearchChange={onDraftSearchChange}
      onApply={onApply}
      onClear={onClear}
    />,
  )

  return { onDraftSearchChange, onApply, onClear }
}

describe('CreatureFilters', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders an accessible search form with all controls', () => {
    setup()

    expect(screen.getByRole('search', { name: 'Filter creatures' })).toBeInTheDocument()
    expect(screen.getByLabelText('Search by name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Emberfang')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filter by type' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
  })

  it('lists "All types" followed by the provided creature types', () => {
    setup()

    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['All types', 'Fire', 'Water'])
    expect(screen.getByRole('option', { name: 'Fire' })).toHaveValue('fire')
  })

  it('renders only "All types" when no types are available', () => {
    setup({ types: [] })

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['All types'])
  })

  it('shows the controlled draft search and selected type', () => {
    setup({ draftSearch: 'char', search: 'char', type: 'water' })

    expect(screen.getByLabelText('Search by name')).toHaveValue('char')
    expect(screen.getByRole('combobox', { name: 'Filter by type' })).toHaveValue('water')
  })

  it('reports every keystroke through onDraftSearchChange without applying', async () => {
    const user = userEvent.setup()
    const { onDraftSearchChange, onApply } = setup()

    await user.type(screen.getByLabelText('Search by name'), 'fox')

    // Controlled input: the parent never updates draftSearch here, so each keystroke is a single char.
    expect(onDraftSearchChange.mock.calls.map(([value]) => value)).toEqual(['f', 'o', 'x'])
    expect(onApply).not.toHaveBeenCalled()
  })

  it('accumulates typed text when the parent owns the draft state', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()

    function Harness() {
      const [draft, setDraft] = useState('')
      return (
        <CreatureFilters
          search=""
          type=""
          draftSearch={draft}
          types={types}
          onDraftSearchChange={setDraft}
          onApply={onApply}
          onClear={vi.fn()}
        />
      )
    }
    render(<Harness />)

    await user.type(screen.getByLabelText('Search by name'), 'fire fox')

    expect(screen.getByLabelText('Search by name')).toHaveValue('fire fox')
  })

  it('submits the draft search on page 1 when clicking Search', async () => {
    const user = userEvent.setup()
    const { onApply } = setup({ draftSearch: 'ember' })

    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith({ search: 'ember', page: 1 })
  })

  it('submits the draft search when pressing Enter in the input', async () => {
    const user = userEvent.setup()
    const { onApply } = setup({ draftSearch: 'ember' })

    await user.type(screen.getByLabelText('Search by name'), '{Enter}')

    expect(onApply).toHaveBeenCalledWith({ search: 'ember', page: 1 })
  })

  it('does not trigger a native form navigation on submit', async () => {
    const { onApply } = setup({ draftSearch: 'ember' })

    // fireEvent returns false when the event's default action was prevented.
    const notPrevented = fireEvent.submit(screen.getByRole('search'))

    expect(notPrevented).toBe(false)
    expect(onApply).toHaveBeenCalledWith({ search: 'ember', page: 1 })
  })

  it('applies the type immediately on change and resets to page 1', async () => {
    const user = userEvent.setup()
    const { onApply } = setup({ draftSearch: 'ignored draft' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by type' }), 'water')

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith({ type: 'water', page: 1 })
  })

  it('applies an empty type when "All types" is chosen', async () => {
    const user = userEvent.setup()
    const { onApply } = setup({ type: 'fire', search: '' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by type' }), 'All types')

    expect(onApply).toHaveBeenCalledWith({ type: '', page: 1 })
  })

  it('hides the Clear button when no filter is active', () => {
    setup()

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })

  it('does not treat an unsubmitted draft as an active filter', () => {
    setup({ draftSearch: 'typed but not submitted' })

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })

  it.each([
    ['an applied search', { search: 'char' }],
    ['an applied type', { type: 'fire' }],
    ['both', { search: 'char', type: 'fire' }],
  ])('shows Clear when %s is active and calls onClear', async (_label, overrides) => {
    const user = userEvent.setup()
    const { onClear, onApply } = setup(overrides)

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(onClear).toHaveBeenCalledTimes(1)
    expect(onApply).not.toHaveBeenCalled()
  })

  it('renders labels in the active language', async () => {
    await i18n.changeLanguage('fr')
    setup()

    expect(screen.getByRole('search', { name: i18n.t('creatures:catalog.filters.aria') })).toBeInTheDocument()
    expect(screen.queryByLabelText('Search by name')).not.toBeInTheDocument()
  })
})
