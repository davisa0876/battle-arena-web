import { afterEach, describe, expect, it, vi } from 'vitest'
import { PvpRealtimeSession } from './pvpRealtimeSession'

class FakeWebSocket {
  static OPEN = 1
  readyState = FakeWebSocket.OPEN
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null
  sent: string[] = []
  url: string

  constructor(url: string) {
    this.url = url
    queueMicrotask(() => this.onopen?.())
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.readyState = 3
    this.onclose?.()
  }

  emit(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) })
  }
}

describe('PvpRealtimeSession', () => {
  const originalWebSocket = globalThis.WebSocket

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket
    vi.restoreAllMocks()
  })

  it('connects with ticket query, heartbeats, and forwards deduped lobby hints', async () => {
    const sockets: FakeWebSocket[] = []
    globalThis.WebSocket = class extends FakeWebSocket {
      constructor(url: string) {
        super(url)
        sockets.push(this)
      }
    } as unknown as typeof WebSocket

    const hints: Array<{ type: string; eventId: string }> = []
    const session = new PvpRealtimeSession({
      issueTicket: async () => ({ ticket: 'ticket-1', ws_url: 'ws://localhost:3001/ws' }),
      issueGrant: async () => ({ grant: 'g'.repeat(32) }),
      onHint: (hint) => hints.push(hint),
    })

    const connectPromise = session.connect()
    await vi.waitFor(() => expect(sockets[0]).toBeTruthy())
    sockets[0].emit({
      v: 1,
      type: 'connection.ready',
      event_id: 'ready-1',
      sent_at: new Date().toISOString(),
      payload: { connection_id: 'c1', player_id: 1, heartbeat_interval_ms: 25000 },
    })
    await connectPromise

    expect(sockets[0].url).toContain('ticket=ticket-1')

    await session.subscribeRoom('11111111-1111-4111-8111-111111111111')
    expect(sockets[0].sent.some((raw) => raw.includes('room.subscribe'))).toBe(true)

    const changed = {
      v: 1,
      type: 'pvp.room.changed',
      event_id: 'evt-1',
      sent_at: new Date().toISOString(),
      payload: { room_id: '11111111-1111-4111-8111-111111111111', version: 2 },
    }
    sockets[0].emit(changed)
    sockets[0].emit(changed)
    expect(hints).toHaveLength(1)
    expect(hints[0].type).toBe('pvp.room.changed')

    session.close()
  })
})
