import { describe, expect, it } from 'vitest'
import { normalizeAuthUser, normalizeProgress, normalizePublicPlayer } from './normalizeProfile'

describe('normalizeAuthUser', () => {
  it('maps a nested user resource', () => {
    const user = normalizeAuthUser({
      data: {
        id: 7,
        email: 'ash@example.test',
        email_verified_at: null,
        profile: {
          handle: 'ash',
          display_name: 'Ash',
          bio: '',
          avatar_url: 'http://api.test/api/avatars/7',
          collection_is_public: true,
        },
        progress: {
          level: 2,
          total_xp: 130,
          xp_into_level: 30,
          xp_to_next_level: 120,
          xp_for_next_level: 150,
          progress_percent: 20,
          is_max_level: false,
        },
      },
    })

    expect(user).toEqual({
      id: 7,
      email: 'ash@example.test',
      email_verified_at: null,
      profile: {
        handle: 'ash',
        display_name: 'Ash',
        bio: null,
        avatar_url: 'http://api.test/api/avatars/7',
        collection_is_public: true,
      },
      progress: {
        level: 2,
        total_xp: 130,
        xp_into_level: 30,
        xp_to_next_level: 120,
        xp_for_next_level: 150,
        progress_percent: 20,
        is_max_level: false,
      },
    })
  })

  it('accepts a flat user and `{ user }` wrappers', () => {
    const user = normalizeAuthUser({
      user: { id: 1, email: 'a@b.co', handle: 'a', display_name: 'A', level: 4, total_xp: 10 },
    })

    expect(user?.profile.handle).toBe('a')
    expect(user?.progress.level).toBe(4)
    expect(user?.progress.total_xp).toBe(10)
  })

  it('returns null when there is no user', () => {
    expect(normalizeAuthUser(null)).toBeNull()
    expect(normalizeAuthUser({ data: { message: 'nope' } })).toBeNull()
  })
})

describe('normalizeProgress', () => {
  it('derives the percentage and level size when only raw counters are present', () => {
    const progress = normalizeProgress({ level: 3, total_xp: 400, xp_into_level: 75, xp_to_next_level: 75 })

    expect(progress.xp_for_next_level).toBe(150)
    expect(progress.progress_percent).toBe(50)
  })

  it('clamps the percentage and reports max level without a next-level target', () => {
    const progress = normalizeProgress({ level: 100, total_xp: 1, is_max_level: true, progress_percent: 250 })

    expect(progress.progress_percent).toBe(100)
    expect(progress.xp_to_next_level).toBeNull()
    expect(progress.xp_for_next_level).toBeNull()
    expect(progress.is_max_level).toBe(true)
  })
})

describe('normalizeProgress owner-only fields', () => {
  it('parses selection allowances and the PvP flag from the /me trainer payload', () => {
    const progress = normalizeProgress({
      level: 6,
      selection_allowances: [
        { evolution_stage: 2, total: 0, used: 0, remaining: 0 },
        { evolution_stage: 1, total: 6, used: 2, remaining: 4 },
      ],
      pvp_level_unlocked: true,
    })

    expect(progress.selection_allowances).toEqual([
      { evolution_stage: 1, total: 6, used: 2, remaining: 4 },
      { evolution_stage: 2, total: 0, used: 0, remaining: 0 },
    ])
    expect(progress.pvp_level_unlocked).toBe(true)
  })

  it('keeps owner-only fields absent when the API did not send them (public view, older API)', () => {
    const progress = normalizeProgress({ level: 2 })

    expect(progress).not.toHaveProperty('selection_allowances')
    expect(progress).not.toHaveProperty('pvp_level_unlocked')
  })
})

describe('normalizePublicPlayer', () => {
  it('hides the collection when it is private', () => {
    const player = normalizePublicPlayer({
      data: { handle: 'misty', display_name: 'Misty', collection_is_public: false, level: 5, creatures: [{ id: 1 }] },
    })

    expect(player?.collection).toBeNull()
    expect(player?.progress.level).toBe(5)
  })

  it('includes the collection when public and returns null without a handle', () => {
    const player = normalizePublicPlayer({
      data: {
        handle: 'brock',
        display_name: 'Brock',
        collection_is_public: true,
        collection: [
          {
            id: 1,
            creature: { id: 74, name: 'Geodude', slug: 'geodude', types: [], base_stats: {} },
          },
        ],
      },
    })

    expect(player?.collection).toHaveLength(1)
    expect(player?.collection?.[0].creature.slug).toBe('geodude')
    expect(normalizePublicPlayer({ data: {} })).toBeNull()
  })
})
