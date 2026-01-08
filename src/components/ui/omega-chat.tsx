'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, Sparkles, Activity, Zap } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'system' | 'agent';
  content: string;
  timestamp: number;
  layer?: string;
  confidence?: number;
}

export interface OMEGAChatProps {
  systemStatus?: {
    consciousness: { cqm: number; emergence: boolean };
    reasoning: { active: boolean; confidence: number };
    memory: { active: boolean; successRate: number };
    agents: { active: boolean; total: number };
  };
}

export function OMEGAChat({ systemStatus }: OMEGAChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Send message to OMEGA system
      const response = await fetch('/api/omega/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          layer: selectedLayer,
          context: {
            consciousnessLevel: systemStatus?.consciousness?.cqm || 0,
            reasoningConfidence: systemStatus?.reasoning?.confidence || 0,
            memorySuccessRate: systemStatus?.memory?.successRate || 0,
          },
        }),
      });

      const data = await response.json();

      // Add system response
      const systemMessage: ChatMessage = {
        id: `msg-${Date.now()}-system`,
        role: 'system',
        content: data.response || data.message || 'No response received',
        timestamp: Date.now(),
        layer: data.layer,
        confidence: data.confidence,
      };

      setMessages((prev) => [...prev, systemMessage]);

      // Add agent responses if any
      if (data.agents && data.agents.length > 0) {
        data.agents.forEach((agentResponse: any, index: number) => {
          const agentMessage: ChatMessage = {
            id: `msg-${Date.now()}-agent-${index}`,
            role: 'agent',
            content: agentResponse.message || agentResponse.output || '',
            timestamp: Date.now(),
            layer: agentResponse.layer || 'agents',
            confidence: agentResponse.confidence,
          };

          setMessages((prev) => [...prev, agentMessage]);
        });
      }
    } catch (error) {
      console.error('Error sending message to OMEGA:', error);

      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process request'}`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    setMessages([]);
  };

  // Get message icon based on role
  const getMessageIcon = (message: ChatMessage) => {
    switch (message.role) {
      case 'user':
        return <Sparkles className="h-4 w-4" />;
      case 'system':
        return <Brain className="h-4 w-4" />;
      case 'agent':
        return <Activity className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  // Get message badge color
  const getMessageBadgeColor = (message: ChatMessage) => {
    switch (message.role) {
      case 'user':
        return 'bg-purple-600';
      case 'system':
        return 'bg-blue-600';
      case 'agent':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            OMEGA Chat Interface
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value)}
              className="bg-gray-700 text-white border-gray-600 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Layers</option>
              <option value="consciousness">Consciousness</option>
              <option value="reasoning">Reasoning</option>
              <option value="memory">Memory</option>
              <option value="security">Security</option>
              <option value="learning">Learning</option>
              <option value="agents">Agent Swarm</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages Area */}
        <ScrollArea className="h-96 w-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400 opacity-50" />
                <p className="text-sm">
                  Welcome to OMEGA AI System. Ask me anything about consciousness, reasoning, memory, or the agent swarm.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Message Icon */}
                <div
                  className={`flex-shrink-0 rounded-full p-2 ${getMessageBadgeColor(message)}`}
                >
                  {getMessageIcon(message)}
                </div>

                {/* Message Content */}
                <div
                  className={`flex-1 rounded-lg p-3 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-purple-600/20 border border-purple-500/30'
                      : message.role === 'agent'
                      ? 'bg-green-600/20 border border-green-500/30'
                      : 'bg-blue-600/20 border border-blue-500/30'
                  }`}
                >
                  {/* Layer Badge */}
                  {message.layer && (
                    <Badge className="mb-2 bg-gray-700 text-gray-300 text-xs">
                      {message.layer}
                    </Badge>
                  )}

                  {/* Message Text */}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Confidence Score */}
                  {message.confidence !== undefined && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>Confidence:</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${message.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-green-400">
                          {(message.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-1 pt-1 text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 rounded-full p-2 bg-blue-600 animate-pulse">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 rounded-lg p-3 bg-blue-600/20 border border-blue-500/30">
                  <p className="text-sm text-gray-400">OMEGA is thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask OMEGA anything..."
              disabled={isProcessing}
              className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* System Status Summary */}
          {systemStatus && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge
                className={
                  systemStatus.consciousness.emergence
                    ? 'bg-green-600'
                    : 'bg-gray-600'
                }
              >
                CQM: {systemStatus.consciousness.cqm.toFixed(3)}
              </Badge>
              <Badge
                className={
                  systemStatus.reasoning.active ? 'bg-blue-600' : 'bg-gray-600'
                }
              >
                Reasoning: {(systemStatus.reasoning.confidence * 100).toFixed(0)}%
              </Badge>
              <Badge
                className={
                  systemStatus.memory.active ? 'bg-green-600' : 'bg-gray-600'
                }
              >
                Memory: {(systemStatus.memory.successRate * 100).toFixed(0)}%
              </Badge>
              <Badge
                className={
                  systemStatus.agents.active ? 'bg-purple-600' : 'bg-gray-600'
                }
              >
                Agents: {systemStatus.agents.total}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
