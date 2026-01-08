import { createServer, Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'

// --- Interfaces ---

interface User {
  id: string
  username: string
}

type MessageType = 'user' | 'system'

interface Message {
  id: string
  username: string
  content: string
  timestamp: Date
  type: MessageType
}

// --- Event Payloads (Incoming) ---

interface JoinData {
  username: string
}

interface MessageData {
  content: string
  // Note: Although username is sent, the server should rely on socket.id for authentication/identity
  username: string 
}

// --- Event Payloads (Outgoing) ---

interface TestResponse {
  message: string
  data: unknown
  timestamp: string
}

interface UserJoinedResponse {
  user: User
  message: Message
}

interface UserLeftResponse {
  user: Pick<User, 'id' | 'username'>
  message: Message
}

interface UsersListResponse {
  users: User[]
}

// --- Constants & State ---

const PORT = 3003
const users = new Map<string, User>()
const httpServer: HttpServer = createServer()

const io = new Server(httpServer, {
  // Path setup for potential reverse proxies (like Caddy)
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// --- Utility Functions ---

/** Generates a short, non-secure random ID. */
const generateMessageId = (): string => Math.random().toString(36).slice(2, 11)

const createSystemMessage = (content: string): Message => ({
  id: generateMessageId(),
  username: 'System',
  content,
  timestamp: new Date(),
  type: 'system'
})

const createUserMessage = (username: string, content: string): Message => ({
  id: generateMessageId(),
  username,
  content,
  timestamp: new Date(),
  type: 'user'
})

// --- Socket Handlers ---

io.on('connection', (socket: Socket) => {
  const socketId = socket.id
  console.log(`User connected: ${socketId}`)

  // 1. Test Event Handler
  socket.on('test', (data: unknown) => {
    console.log('Received test message:', data)
    const response: TestResponse = { 
      message: 'Server received test message', 
      data: data,
      timestamp: new Date().toISOString()
    }
    socket.emit('test-response', response)
  })

  // 2. Join Event Handler
  socket.on('join', (data: JoinData) => {
    const { username } = data
    
    if (!username) {
        return socket.emit('error', createSystemMessage('Username is required to join.'))
    }

    // Create and store user object
    const user: User = { id: socketId, username }
    users.set(socketId, user)
    
    // Notify all users about the join
    const joinMessage = createSystemMessage(`${username} joined the chat room`)
    io.emit('user-joined', { user, message: joinMessage } as UserJoinedResponse)
    
    // Send current user list back to the new user
    const usersList = Array.from(users.values())
    socket.emit('users-list', { users: usersList } as UsersListResponse)
    
    console.log(`${username} joined the chat room, current online users: ${users.size}`)
  })

  // 3. Message Event Handler
  socket.on('message', (data: MessageData) => {
    const { content } = data
    const user = users.get(socketId)
    
    if (user && content && content.trim()) {
      const message = createUserMessage(user.username, content)
      io.emit('message', message)
      console.log(`${user.username}: ${content}`)
    }
  })

  // 4. Disconnect Handler
  socket.on('disconnect', () => {
    const user = users.get(socketId)
    
    if (user) {
      users.delete(socketId)
      
      // Send leave message to all users
      const leaveMessage = createSystemMessage(`${user.username} left the chat room`)
      const response: UserLeftResponse = { user: { id: socketId, username: user.username }, message: leaveMessage }
      io.emit('user-left', response)
      
      console.log(`${user.username} left the chat room, current online users: ${users.size}`)
    } else {
      console.log(`User disconnected: ${socketId} (unknown identity)`)
    }
  })

  // 5. Error Handler
  socket.on('error', (error) => {
    console.error(`Socket error (${socketId}):`, error)
  })
})

// --- Server Startup & Shutdown ---

httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})

const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal} signal, shutting down server...`)
  httpServer.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))