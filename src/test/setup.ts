import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom has no ResizeObserver; components only need it to exist in tests.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Vitest globals are not enabled, so Testing Library's automatic cleanup is not registered.
afterEach(() => {
  cleanup()
})

// jsdom does not implement scrollIntoView.
Element.prototype.scrollIntoView ??= () => {}
