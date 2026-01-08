'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Types ---

type User = {
  id: string;
  username: string;
}

type Message = {
  id: string;
  username: string;
  content: string;
  timestamp: Date | string;
  type: 'user' | 'system';
}

const SOCKET_URL = '/?XTransformPort=3003';

// Helper component for rendering individual messages
const MessageItem = ({ msg }: { msg: Message }) => {
  const isSystem = msg.type === 'system';
  const usernameClass = isSystem ? 'text-blue-600 italic' : 'text-gray-700';
  const contentClass = isSystem ? 'text-blue-500 italic' : 'text-gray-900';

  return (
    <div className="border-b pb-2 last:border-b-0">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-2">
          <p className={`text-sm font-medium truncate ${usernameClass}`}>
            {msg.username}
          </p>
          <p className={contentClass}>
            {msg.content}
          </p>
        </div>
        <span className="text-xs text-gray-500 min-w-[70px] text-right">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default function SocketDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(() => {
    const trimmedMessage = inputMessage.trim();
    const trimmedUsername = username.trim();

    if (socket && trimmedMessage && trimmedUsername) {
      socket.emit('message', {
        content: trimmedMessage,
        username: trimmedUsername
      });
      setInputMessage('');
    }
  }, [socket, inputMessage, username]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  }, [sendMessage]);

  const handleJoin = useCallback(() => {
    const trimmedUsername = username.trim();
    if (socket && trimmedUsername && isConnected) {
      socket.emit('join', { username: trimmedUsername });
      setIsUsernameSet(true);
    }
  }, [socket, username, isConnected]);

  useEffect(() => {
    // Connect to websocket server
    // Never use PORT in the URL, always use XTransformPort
    // DO NOT change the path, it is used by Caddy to forward the request to the correct port
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => setIsConnected(true));
    socketInstance.on('disconnect', () => setIsConnected(false));

    socketInstance.on('message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    socketInstance.on('user-joined', (data: { user: User; message: Message }) => {
      setMessages(prev => [...prev, data.message]);
      setUsers(prev => {
        if (!prev.some(u => u.id === data.user.id)) {
          return [...prev, data.user];
        }
        return prev;
      });
    });

    socketInstance.on('user-left', (data: { user: User; message: Message }) => {
      setMessages(prev => [...prev, data.message]);
      setUsers(prev => prev.filter(u => u.id !== data.user.id));
    });

    socketInstance.on('users-list', (data: { users: User[] }) => {
      setUsers(data.users);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const StatusIndicator = (
    <span className={`text-sm px-2 py-1 rounded transition-colors ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </span>
  );

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            WebSocket Demo
            {StatusIndicator}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isUsernameSet ? (
            <div className="space-y-2">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="Enter your username..."
                disabled={!isConnected}
                className="flex-1"
                maxLength={20}
              />
              <Button
                onClick={handleJoin}
                disabled={!isConnected || !username.trim()}
                className="w-full"
              >
                Join Chat
              </Button>
            </div>
          ) : (
            <>
              {/* Message Display Area */}
              <ScrollArea className="h-80 w-full border rounded-md p-4">
                <div className="space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">
                        Waiting for messages...
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <MessageItem key={msg.id} msg={msg} />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={!isConnected}
                  className="flex-1"
                  maxLength={500}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!isConnected || !inputMessage.trim()}
                >
                  Send
                </Button>
              </div>

              {/* User List */}
              <div className="text-xs text-gray-500 pt-1 border-t">
                <strong className="text-gray-700">Online ({users.length}):</strong> {users.map(u => u.username).join(', ')}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}