import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { inspect } from 'util'

// --- Configuration ---
const DEFAULT_PORT = 3003
// Use bitwise OR 0 for explicit integer coercion (highly optimized way to handle fallback)
const PORT = +(process.env.WEBSOCKET_PORT || DEFAULT_PORT) | 0
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
// Define strict room names for type safety and constant optimization
const DEFAULT_ROOMS = ['metrics', 'agents', 'reasoning', 'memory', 'security'] as const

type RoomName = typeof DEFAULT_ROOMS[number]
type RoomEventMap = Record<RoomName, { JOIN: string, JOINED: string, BROADCAST: string, UPDATE: string }>

// --- Utilities ---

// Minimalistic, efficient logging wrapper. V8 handles object printing well.
const log = (message: string, ...args: any[]) => {
  console.log(`[WS] ${message}`, ...args)
}

// Pre-calculate room event names for execution speed and strict typing
const ROOM_EVENTS = DEFAULT_ROOMS.reduce((acc, room) => {
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
  // Ensure buffer size is adequate but not excessive (10MB)
  maxHttpBufferSize: 1e7,
  transports: ['websocket', 'polling'],
})

/**
 * Sets up strict listeners for defined rooms.
 */
const setupRoomListeners = (socket: Socket) => {
  for (const room of DEFAULT_ROOMS) {
    const events = ROOM_EVENTS[room]

    // Explicit room join request handler
    socket.on(events.JOIN, () => {
      // Check for redundancy (idempotence)
      if (!socket.rooms.has(room)) {
        socket.join(room)
        socket.emit(events.JOINED, { room })
        log(`Socket ${socket.id} joined room: ${room}`)
      }
    })

    // High-traffic broadcast handler
    socket.on(events.BROADCAST, (data: unknown) => {
      // Emit update payload directly to the room
      socket.to(room).emit(events.UPDATE, data)
    })
  }
}

/**
 * Handles client connection, initial setup, and listener configuration.
 */
const handleConnection = (socket: Socket) => {
  log(`[CONNECT] Client connected: ${socket.id}`)

  // Immediately join all default rooms using efficient array join
  socket.join(DEFAULT_ROOMS as string[])

  // Send initialization confirmation
  socket.emit('connected', {
    socketId: socket.id,
    timestamp: Date.now(),
    rooms: DEFAULT_ROOMS
  })

  // Configure dynamic room logic
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
    // Use inspect for critical error logging
    console.error(`[FATAL] SERVER ERROR:`, inspect(err))
  }
  process.exit(1)
})

httpServer.listen(PORT, () => {
  log(`[START] WebSocket service running on port ${PORT} (Origin: ${APP_URL})`)
})

export { io, httpServer }