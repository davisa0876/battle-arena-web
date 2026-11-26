import { describe, expect, it } from 'vitest'
import { makeUser } from '../../../test/authTestUtils'
import { isPvpPresenceEligible } from './isPvpPresenceEligible'

describe('isPvpPresenceEligible', () => {
  it('is false without a user', () => {
    expect(isPvpPresenceEligible(null)).toBe(false)
  })

  it('uses the server pvp_level_unlocked flag when present', () => {
    expect(
      isPvpPresenceEligible(
        makeUser({ progress: { ...makeUser().progress, level: 99, pvp_level_unlocked: false } }),
      ),
    ).toBe(false)
    expect(
      isPvpPresenceEligible(
        makeUser({ progress: { ...makeUser().progress, level: 1, pvp_level_unlocked: true } }),
      ),
    ).toBe(true)
  })

  it('falls back to the default PvP min level when the flag is omitted', () => {
    expect(isPvpPresenceEligible(makeUser({ progress: { ...makeUser().progress, level: 5 } }))).toBe(
      false,
    )
    expect(isPvpPresenceEligible(makeUser({ progress: { ...makeUser().progress, level: 6 } }))).toBe(
      true,
    )
  })
})
