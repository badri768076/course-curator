'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Subtitles } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/services/ai/video-chatbot';

interface FloatingChatbotProps {
  videoId: string;
  videoTitle: string;
}

export function FloatingChatbot({ videoId, videoTitle }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('FloatingChatbot rendered with videoId:', videoId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChatbot = async () => {
    if (isInitialized) return;
    
    try {
      const { initializeVideoChatbot } = await import('@/services/ai/video-chatbot');
      await initializeVideoChatbot(videoId);
      setIsInitialized(true);
      
      // Fetch transcript for subtitles
      const { getTranscriptText } = await import('@/services/youtube/transcript');
      const transcriptText = await getTranscriptText(videoId);
      setTranscript(transcriptText);
      
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm your AI assistant for "${videoTitle}". I've analyzed this video's transcript and can answer any questions about it. What would you like to know?`,
        },
      ]);
    } catch (error) {
      console.error('Failed to initialize chatbot:', error);
      setMessages([
        {
          role: 'assistant',
          content: 'Sorry, I had trouble loading the video transcript. Please try again.',
        },
      ]);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && !isInitialized) {
      initializeChatbot();
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

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleToggle}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
          border: '2px solid white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
          zIndex: 9999,
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? (
          <X size={24} color="white" />
        ) : (
          <MessageSquare size={24} color="white" />
        )}
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '5rem',
            right: '2rem',
            width: '400px',
            height: '500px',
            background: 'rgba(0,0,0,0.95)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(168, 85, 247, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="hsl(var(--primary-violet))" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                Video Assistant
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowSubtitles(!showSubtitles)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: showSubtitles ? 'hsl(var(--primary-violet))' : 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                }}
                title="Show/Hide Subtitles"
              >
                <Subtitles size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {/* Subtitles Section */}
            {showSubtitles && (
              <div
                style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Subtitles size={14} color="hsl(var(--primary-violet))" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                    Video Subtitles
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', lineHeight: '1.6', maxHeight: '200px', overflowY: 'auto' }}>
                  {transcript || 'Loading transcript...'}
                </div>
              </div>
            )}

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
                      : '1px solid rgba(255,255,255,0.1)',
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
                <span>Analyzing video...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about this video..."
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
      )}
    </>
  );
}
