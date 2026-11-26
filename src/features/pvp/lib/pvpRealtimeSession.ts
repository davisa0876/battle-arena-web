type HintHandler = (hint: { type: string; eventId: string; roomId?: string; invitationId?: string; version?: number }) => void

type SessionOptions = {
  onHint: HintHandler
  onStatus?: (status: 'connecting' | 'ready' | 'closed' | 'error') => void
  issueTicket: () => Promise<{ ticket: string; ws_url: string }>
  issueGrant: (roomId: string) => Promise<{ grant: string }>
}

/**
 * Best-effort Phase 5A/5B.1 websocket session.
 * Auth is ticket-only; room access requires a one-use Laravel grant.
 * Never treat frames as authoritative — callers must REST-rehydrate.
 */
export class PvpRealtimeSession {
  private socket: WebSocket | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private seenEventIds = new Set<string>()
  private subscribedRoomId: string | null = null
  private closed = false
  private readonly options: SessionOptions

  constructor(options: SessionOptions) {
    this.options = options
  }

  async connect(): Promise<void> {
    if (this.closed) {
      return
    }
    this.options.onStatus?.('connecting')
    const ticket = await this.options.issueTicket()
    const url = new URL(ticket.ws_url)
    url.searchParams.set('ticket', ticket.ticket)

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url.toString())
      this.socket = socket
      let settled = false

      socket.onopen = () => {
        // Wait for connection.ready before resolving.
      }

      socket.onmessage = (event) => {
        void this.handleMessage(String(event.data), () => {
          if (!settled) {
            settled = true
            resolve()
          }
        })
      }

      socket.onerror = () => {
        this.options.onStatus?.('error')
        if (!settled) {
          settled = true
          reject(new Error('websocket_error'))
        }
      }

      socket.onclose = () => {
        this.clearHeartbeat()
        this.options.onStatus?.('closed')
        if (!settled) {
          settled = true
          reject(new Error('websocket_closed'))
        }
      }
    })
  }

  async subscribeRoom(roomId: string): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }
    if (this.subscribedRoomId === roomId) {
      return
    }
    if (this.subscribedRoomId) {
      this.send({
        v: 1,
        type: 'room.unsubscribe',
        payload: { room_id: this.subscribedRoomId },
      })
      this.subscribedRoomId = null
    }

    const { grant } = await this.options.issueGrant(roomId)
    this.send({
      v: 1,
      type: 'room.subscribe',
      payload: { grant },
    })
    this.subscribedRoomId = roomId
  }

  close(): void {
    this.closed = true
    this.clearHeartbeat()
    this.socket?.close()
    this.socket = null
    this.subscribedRoomId = null
  }

  private async handleMessage(raw: string, onReady: () => void): Promise<void> {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return
    }

    const type = typeof parsed.type === 'string' ? parsed.type : ''
    const eventId = typeof parsed.event_id === 'string' ? parsed.event_id : ''

    if (eventId) {
      if (this.seenEventIds.has(eventId)) {
        return
      }
      this.seenEventIds.add(eventId)
      if (this.seenEventIds.size > 200) {
        const first = this.seenEventIds.values().next().value
        if (first) {
          this.seenEventIds.delete(first)
        }
      }
    }

    if (type === 'connection.ready') {
      const payload = (parsed.payload ?? {}) as { heartbeat_interval_ms?: number }
      const interval = Number(payload.heartbeat_interval_ms ?? 25000)
      this.clearHeartbeat()
      this.heartbeatTimer = setInterval(() => {
        this.send({ v: 1, type: 'ping' })
      }, Math.max(5_000, interval - 5_000))
      this.options.onStatus?.('ready')
      onReady()
      return
    }

    if (type === 'connection.error') {
      this.options.onStatus?.('error')
      return
    }

    const payload = (parsed.payload ?? {}) as Record<string, unknown>
    if (type === 'pvp.room.changed' || type === 'room.subscription.revoked') {
      this.options.onHint({
        type,
        eventId,
        roomId: typeof payload.room_id === 'string' ? payload.room_id : undefined,
        version: typeof payload.version === 'number' ? payload.version : undefined,
      })
      return
    }

    if (type === 'pvp.invitation.changed') {
      this.options.onHint({
        type,
        eventId,
        invitationId: typeof payload.invitation_id === 'string' ? payload.invitation_id : undefined,
      })
    }
  }

  private send(message: Record<string, unknown>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
}
