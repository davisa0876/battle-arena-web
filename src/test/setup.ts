import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest globals are not enabled, so Testing Library's automatic cleanup is not registered.
afterEach(() => {
  cleanup()
})
