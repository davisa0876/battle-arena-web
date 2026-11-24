import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import { ApiError, apiClient } from '../../lib/api/client'
import { SystemStatus } from './SystemStatus'

vi.mock('../../lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/api/client')>()
  return { ...actual, apiClient: { get: vi.fn() } }
})

const getMock = vi.mocked(apiClient.get)

function renderStatus() {
  return render(
    <I18nextProvider i18n={i18n}>
      <SystemStatus />
    </I18nextProvider>,
  )
}

// The component is `hidden sm:flex`; it stays in the DOM, so query it as a live status region.
const statusRegion = () => screen.getByRole('status', { hidden: true })

describe('SystemStatus', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage('en')
  })

  it('shows connecting first, then connected once the health check succeeds', async () => {
    let resolveHealth!: (value: Record<string, unknown>) => void
    getMock.mockReturnValue(new Promise((resolve) => (resolveHealth = resolve)))

    renderStatus()

    expect(statusRegion()).toHaveTextContent('Connecting...')
    expect(statusRegion()).toHaveAttribute('aria-live', 'polite')
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()

    await act(async () => {
      resolveHealth({ status: 'ok' })
    })

    expect(await screen.findByText('API Connected')).toBeInTheDocument()
    expect(statusRegion()).toHaveTextContent('API Connected')
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    expect(getMock).toHaveBeenCalledWith('/api/health', expect.any(AbortSignal))
  })

  it('shows offline with a retry button when the health check fails', async () => {
    getMock.mockRejectedValue(new ApiError('Unable to connect to the API'))

    renderStatus()

    expect(await screen.findByText('API Offline')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('retries: goes back to connecting and recovers to connected', async () => {
    const user = userEvent.setup()
    let resolveSecond!: (value: Record<string, unknown>) => void
    getMock
      .mockRejectedValueOnce(new ApiError('Unable to connect to the API'))
      .mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)))

    renderStatus()
    await screen.findByText('API Offline')

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Connecting...')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    expect(getMock).toHaveBeenCalledTimes(2)

    await act(async () => {
      resolveSecond({ status: 'ok' })
    })

    expect(await screen.findByText('API Connected')).toBeInTheDocument()
  })

  it('stays offline with a retry button when the retry fails again', async () => {
    const user = userEvent.setup()
    getMock.mockRejectedValue(new ApiError('Unable to connect to the API'))

    renderStatus()
    await screen.findByText('API Offline')

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('API Offline')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('aborts the pending health check on unmount and ignores its late failure', async () => {
    let rejectHealth!: (reason: unknown) => void
    getMock.mockReturnValue(new Promise((_resolve, reject) => (rejectHealth = reject)))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { unmount } = renderStatus()
    const signal = getMock.mock.calls[0][1] as AbortSignal

    unmount()
    expect(signal.aborted).toBe(true)

    await act(async () => {
      rejectHealth(new DOMException('aborted', 'AbortError'))
    })

    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('renders the status text in the active language', async () => {
    await i18n.changeLanguage('fr')
    getMock.mockResolvedValue({ status: 'ok' })

    renderStatus()

    await waitFor(() => expect(statusRegion()).toHaveTextContent(i18n.t('navigation:status.connected')))
    expect(statusRegion()).not.toHaveTextContent('API Connected')
  })
})
