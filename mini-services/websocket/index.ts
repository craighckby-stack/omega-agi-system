import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { inspect } from 'util'

// --- Configuration ---
const DEFAULT_PORT = 3003
// Coerce environment variable to integer efficiently, falling back to default
const PORT = +(process.env.WEBSOCKET_PORT || DEFAULT_PORT) | 0
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Define strict room names using 'as const' for immutability and type inference
const DEFAULT_ROOMS = ['metrics', 'agents', 'reasoning', 'memory', 'security'] as const

type RoomName = typeof DEFAULT_ROOMS[number]
type RoomEventMap = Record<RoomName, { JOIN: string, JOINED: string, BROADCAST: string, UPDATE: string }>

// --- Utilities ---

// Consistent logging utility
const log = (message: string, ...args: any[]) => {
  // Use V8's native console functionality for structured logging
  console.log(`[WS] ${message}`, ...args)
}

// Pre-calculate room event names for strict typing and execution speed
const ROOM_EVENTS: RoomEventMap = DEFAULT_ROOMS.reduce((acc, room) => {
  acc[room] = {
    JOIN: `join-${room}`,
    JOINED: `joined-${room}`,
    BROADCAST: `broadcast-${room}`,
    UPDATE: `${room}-update`,
  }
  return acc
}, {} as RoomEventMap)

// --- Server Setup ---

const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: APP_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Set buffer limit (10MB) and preferred transports
  maxHttpBufferSize: 1e7,
  transports: ['websocket', 'polling'],
})

/**
 * Sets up explicit listeners allowing clients to subscribe to specific rooms
 * and enabling room-specific broadcasting.
 */
const setupRoomListeners = (socket: Socket) => {
  for (const room of DEFAULT_ROOMS) {
    const events = ROOM_EVENTS[room]

    // Handler for explicit room join request
    socket.on(events.JOIN, () => {
      // Ensure idempotence: only join if not already a member
      if (!socket.rooms.has(room)) {
        socket.join(room)
        socket.emit(events.JOINED, { room, status: 'ok' })
        log(`Socket ${socket.id} subscribed to room: ${room}`)
      } else {
        socket.emit(events.JOINED, { room, status: 'already_joined' })
      }
    })

    // Handler for broadcasting data to all other sockets in this room
    socket.on(events.BROADCAST, (data: unknown) => {
      // Use socket.to(room) to exclude the sender
      socket.to(room).emit(events.UPDATE, data)
    })
  }
}

/**
 * Handles client connection, initialization, and listener configuration.
 */
const handleConnection = (socket: Socket) => {
  log(`[CONNECT] Client connected: ${socket.id}`)

  // Send initialization confirmation immediately
  socket.emit('connected', {
    socketId: socket.id,
    timestamp: Date.now(),
    availableRooms: DEFAULT_ROOMS
  })

  // Configure dynamic room subscription logic
  setupRoomListeners(socket)

  // Disconnection handler
  socket.on('disconnect', (reason) => {
    log(`[DISCONNECT] Client ${socket.id} disconnected (Reason: ${reason})`)
  })
}

io.on('connection', handleConnection)

// --- Server Initialization ---

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${PORT} is already in use.`)
  } else {
    // Use inspect for comprehensive critical error logging
    console.error(`[FATAL] SERVER ERROR:`, inspect(err))
  }
  process.exit(1)
})

httpServer.listen(PORT, () => {
  log(`[START] WebSocket service running on port ${PORT} (Origin: ${APP_URL})`)
})

export { io, httpServer }