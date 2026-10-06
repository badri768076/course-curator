'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X, Bot, Sparkles, Clock, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface ChatCitation {
  time: string;
  seconds: number;
  text: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: ChatCitation[];
}

interface VideoChatbotProps {
  videoId?: string;
  videoTitle?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSeekVideo?: (seconds: number) => void;
}

export function VideoChatbot({
  videoId = '',
  videoTitle = 'Course Lesson',
  isOpen = true,
  onClose,
  onSeekVideo,
}: VideoChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
    if (isOpen && (!isInitialized || messages.length === 0)) {
      initializeChatbot();
    }
  }, [isOpen, videoTitle, videoId]);

  const initializeChatbot = () => {
    setIsInitialized(true);
    const welcome = videoId
      ? `👋 **Hi there!** I'm your AI Study Assistant for **"${videoTitle}"**.\n\nI have indexed this lesson with RAG so you can ask me to explain concepts, summarize timestamps, provide code templates, or quiz you. What would you like to explore?`
      : `👋 **Welcome!** I'm your Course Assistant for **"${videoTitle}"**.\n\nAsk me anything about the course curriculum, study plans, or explanations of any concept!`;

    setMessages([
      {
        role: 'assistant',
        content: welcome,
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setInput('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/youtube-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoId || 'course-overview',
          topicTitle: videoTitle,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          message: query,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            citations: data.citations || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.error || 'I encountered an issue retrieving the answer. Please try asking again!',
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message in VideoChatbot:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to reach the AI assistant. Please check your network and try again.',
        },
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

  const quickPrompts = [
    { label: 'Summarize Key Takeaways', query: 'Summarize the main takeaways and key video timestamps' },
    { label: 'Explain Core Concepts', query: 'Explain the core concept in simple terms' },
    { label: 'Code Implementation', query: 'Give me a complete code implementation pattern for this' },
    { label: 'Quiz Me', query: 'Quiz me on this lesson with practice questions' },
  ];

  if (!isOpen) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid #f1f5f9',
          background: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Bot size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              AI Study Assistant
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {videoId ? 'Video RAG Indexed' : 'Course Tutor'}
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '6px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          background: '#fafafa',
        }}
      >
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: isUser ? '#4f46e5' : '#ffffff',
                  color: isUser ? '#ffffff' : '#1e293b',
                  border: isUser ? 'none' : '1px solid #e2e8f0',
                  boxShadow: isUser ? '0 2px 6px rgba(79, 70, 229, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                  fontSize: '0.82rem',
                  lineHeight: '1.55',
                }}
              >
                {isUser ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                ) : (
                  <div>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p style={{ margin: '0 0 0.45rem 0' }}>{children}</p>,
                        ul: ({ children }) => (
                          <ul style={{ margin: '0.4rem 0 0.4rem 1.1rem', paddingLeft: '0.2rem' }}>
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol style={{ margin: '0.4rem 0 0.4rem 1.1rem', paddingLeft: '0.2rem' }}>
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => <li style={{ marginBottom: '0.25rem' }}>{children}</li>,
                        code: ({ inline, children }: any) =>
                          inline ? (
                            <code
                              style={{
                                background: '#f1f5f9',
                                color: '#0f172a',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                fontFamily: 'monospace',
                              }}
                            >
                              {children}
                            </code>
                          ) : (
                            <pre
                              style={{
                                background: '#0f172a',
                                color: '#f8fafc',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                overflowX: 'auto',
                                fontSize: '0.76rem',
                                margin: '0.5rem 0',
                                lineHeight: '1.45',
                              }}
                            >
                              <code>{children}</code>
                            </pre>
                          ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>

                    {/* Timestamp Badges */}
                    {message.citations && message.citations.length > 0 && (
                      <div
                        style={{
                          marginTop: '0.65rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid #e2e8f0',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                          Jump to Video:
                        </span>
                        {message.citations.map((cit, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => onSeekVideo?.(cit.seconds)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '99px',
                              background: '#e0e7ff',
                              border: '1px solid #c7d2fe',
                              color: '#4338ca',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = '#c7d2fe')}
                            onMouseOut={(e) => (e.currentTarget.style.background = '#e0e7ff')}
                            title={`Seek video to ${cit.time}: ${cit.text}`}
                          >
                            <Clock size={11} />
                            <span>{cit.time}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#64748b',
              fontSize: '0.78rem',
              padding: '0.5rem',
            }}
          >
            <Loader2 size={15} className="animate-spin" color="#4f46e5" />
            <span>Consulting lesson notes & transcript...</span>
          </div>
        )}

        {/* Quick Prompts */}
        {messages.length === 1 && !isLoading && (
          <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Suggested Questions:
            </div>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.query)}
                style={{
                  textAlign: 'left',
                  padding: '0.45rem 0.75rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#334155',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#eef2ff';
                  e.currentTarget.style.borderColor = '#818cf8';
                  e.currentTarget.style.color = '#4338ca';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                <span>{qp.label}</span>
                <Sparkles size={12} color="#6366f1" />
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid #f1f5f9',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about this course..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: '0.82rem',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '0.65rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              background: input.trim() && !isLoading ? '#4f46e5' : '#e2e8f0',
              color: input.trim() && !isLoading ? '#ffffff' : '#94a3b8',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              if (input.trim() && !isLoading) {
                e.currentTarget.style.background = '#4338ca';
              }
            }}
            onMouseOut={(e) => {
              if (input.trim() && !isLoading) {
                e.currentTarget.style.background = '#4f46e5';
              }
            }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
