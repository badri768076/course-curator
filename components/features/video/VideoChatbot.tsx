'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X, MessageSquare } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/services/ai/video-chatbot';

interface VideoChatbotProps {
  videoId: string;
  videoTitle: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function VideoChatbot({ videoId, videoTitle, isOpen = true, onClose }: VideoChatbotProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      initializeChatbot();
    }
  }, [isOpen, isInitialized]);

  const initializeChatbot = async () => {
    try {
      const { initializeVideoChatbot } = await import('@/services/ai/video-chatbot');
      await initializeVideoChatbot(videoId);
      setIsInitialized(true);
      
      // Add welcome message
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm your AI assistant for "${videoTitle}". I can help answer questions about this video's content. What would you like to know?`,
        },
      ]);
    } catch (error) {
      console.error('Failed to initialize chatbot:', error);
      setMessages([
        {
          role: 'assistant',
          content: 'Sorry, I had trouble loading. Please try refreshing the page.',
        },
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { sendChatMessage } = await import('@/services/ai/video-chatbot');
      const response = await sendChatMessage(videoId, userMessage, messages);
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.message },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} color="hsl(var(--primary-violet))" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
            Video Assistant
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: message.role === 'user'
                  ? 'rgba(168, 85, 247, 0.2)'
                  : 'rgba(255,255,255,0.05)',
                border: message.role === 'user'
                  ? '1px solid rgba(168, 85, 247, 0.3)'
                  : '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                fontSize: '0.85rem',
                lineHeight: '1.5',
              }}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
            <Loader2 size={14} className="animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about this video..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: input.trim() && !isLoading
                ? 'rgba(168, 85, 247, 0.2)'
                : 'rgba(255,255,255,0.05)',
              color: input.trim() && !isLoading
                ? 'hsl(var(--primary-violet))'
                : 'hsl(var(--text-muted))',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (input.trim() && !isLoading) {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = input.trim() && !isLoading
                ? 'rgba(168, 85, 247, 0.2)'
                : 'rgba(255,255,255,0.05)';
            }}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
