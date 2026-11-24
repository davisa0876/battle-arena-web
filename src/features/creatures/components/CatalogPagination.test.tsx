import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import { CatalogPagination } from './CatalogPagination'

function setup(page: number, lastPage: number) {
  const onPageChange = vi.fn()
  render(<CatalogPagination page={page} lastPage={lastPage} onPageChange={onPageChange} />)
  return { onPageChange }
}

const previous = () => screen.getByRole('button', { name: 'Previous' })
const next = () => screen.getByRole('button', { name: 'Next' })

describe('CatalogPagination', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders a labelled navigation with the current page indicator', () => {
    setup(2, 5)

    expect(screen.getByRole('navigation', { name: 'Catalog pagination' })).toBeInTheDocument()
    expect(screen.getByText('Page 2 / 5')).toBeInTheDocument()
  })

  it('disables Previous (but not Next) on the first page', async () => {
    const user = userEvent.setup()
    const { onPageChange } = setup(1, 5)

    expect(previous()).toBeDisabled()
    expect(next()).toBeEnabled()

    await user.click(previous())
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('disables Next (but not Previous) on the last page', async () => {
    const user = userEvent.setup()
    const { onPageChange } = setup(5, 5)

    expect(next()).toBeDisabled()
    expect(previous()).toBeEnabled()

    await user.click(next())
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('enables both buttons on a middle page', () => {
    setup(3, 5)

    expect(previous()).toBeEnabled()
    expect(next()).toBeEnabled()
  })

  it('calls onPageChange with page - 1 for Previous', async () => {
    const user = userEvent.setup()
    const { onPageChange } = setup(3, 5)

    await user.click(previous())

    expect(onPageChange).toHaveBeenCalledTimes(1)
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with page + 1 for Next', async () => {
    const user = userEvent.setup()
    const { onPageChange } = setup(3, 5)

    await user.click(next())

    expect(onPageChange).toHaveBeenCalledTimes(1)
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('can navigate to the final page from the penultimate page', async () => {
    const user = userEvent.setup()
    const { onPageChange } = setup(4, 5)

    await user.click(next())

    expect(onPageChange).toHaveBeenCalledWith(5)
  })

  it('can navigate back to page 1 from page 2', async () => {
    const user = userEvent.setup()
    const { onPageChange } = setup(2, 5)

    await user.click(previous())

    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('still renders (both buttons disabled) when there is only a single page', () => {
    // Actual behavior: the component does not hide itself for lastPage <= 1; the page grid decides.
    setup(1, 1)

    expect(screen.getByRole('navigation', { name: 'Catalog pagination' })).toBeInTheDocument()
    expect(screen.getByText('Page 1 / 1')).toBeInTheDocument()
    expect(previous()).toBeDisabled()
    expect(next()).toBeDisabled()
  })

  it('disables Next when page exceeds lastPage', () => {
    setup(7, 5)

    expect(next()).toBeDisabled()
    expect(previous()).toBeEnabled()
  })

  it('renders translated labels in the active language', async () => {
    await i18n.changeLanguage('es')
    setup(2, 3)

    expect(screen.getByRole('navigation', { name: i18n.t('creatures:catalog.pagination.aria') })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument()
  })
})
