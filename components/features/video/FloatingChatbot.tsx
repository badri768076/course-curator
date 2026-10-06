'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  Clock,
  Bot,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ time: string; seconds: number; text: string }>;
}

interface FloatingChatbotProps {
  videoId: string;
  videoTitle: string;
  onSeekVideo?: (seconds: number) => void;
}

export function FloatingChatbot({ videoId, videoTitle, onSeekVideo }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load welcome message when video or topic changes
  useEffect(() => {
    if (videoId && videoId !== 'default') {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! 👋 I'm your AI Study Assistant for **"${videoTitle || 'this lecture'}"**.\n\nI have indexed this video using **RAG** (Retrieval-Augmented Generation). Ask me anything about what the instructor explains, request code examples, or ask for a quiz!`,
        },
      ]);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! 👋 I'm your AI Study Assistant. I'm ready to help you learn once a topic video is active!`,
        },
      ]);
    }
  }, [videoId, videoTitle]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setInput('');
    const newMsg: ChatMessage = { role: 'user', content: query };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/youtube-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoId || 'default',
          topicTitle: videoTitle,
          messages: updatedMessages.map((m) => ({
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
            content: data.reply || (data.error
              ? `Note: ${data.error}. Let's discuss key concepts from this topic!`
              : 'I could not retrieve an answer at this moment. Please try asking again.'),
          },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I had trouble connecting to the AI service. Please verify your connection and try again.',
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
    { label: 'Summarize video', query: 'Summarize the key takeaways and main points covered in this video.' },
    { label: 'Core concepts', query: 'What are the main concepts and definitions introduced in this video?' },
    { label: 'Code & Example', query: 'Can you give me a practical implementation or code example for this?' },
    { label: 'Quiz me', query: 'Quiz me with 2-3 conceptual questions on this topic.' },
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={handleToggle}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(124, 58, 237, 0.4)',
          zIndex: 9999,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
        title="Open AI Study Assistant"
      >
        {isOpen ? <X size={24} color="#ffffff" /> : <MessageSquare size={24} color="#ffffff" />}
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '6.2rem',
            right: '2rem',
            width: '420px',
            maxWidth: 'calc(100vw - 2.5rem)',
            height: '600px',
            maxHeight: 'calc(100vh - 8rem)',
            background: 'rgba(15, 17, 26, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(124, 58, 237, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9998,
            overflow: 'hidden',
            animation: 'fadeInUp 0.2s ease-out forwards',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.9rem 1.1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(124, 58, 237, 0.3)',
                }}
              >
                <Bot size={17} color="#ffffff" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                  AI Video Tutor
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>RAG Indexed & Ready</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '94%',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    padding: '0.75rem 0.95rem',
                    borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background:
                      msg.role === 'user'
                        ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                        : 'rgba(255, 255, 255, 0.05)',
                    border:
                      msg.role === 'user'
                        ? '1px solid rgba(168, 85, 247, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    fontSize: '0.82rem',
                    lineHeight: '1.55',
                    boxShadow: msg.role === 'user' ? '0 4px 14px rgba(124, 58, 237, 0.25)' : 'none',
                  }}
                >
                  {msg.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  ) : (
                    <div className="prose prose-invert max-w-none text-xs leading-relaxed" style={{ fontSize: '0.82rem' }}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p style={{ margin: '0 0 0.5rem 0' }}>{children}</p>,
                          ul: ({ children }) => <ul style={{ margin: '0 0 0.5rem 1rem', paddingLeft: '0.5rem' }}>{children}</ul>,
                          ol: ({ children }) => <ol style={{ margin: '0 0 0.5rem 1rem', paddingLeft: '0.5rem' }}>{children}</ol>,
                          li: ({ children }) => <li style={{ marginBottom: '0.25rem' }}>{children}</li>,
                          code: ({ inline, children }: any) =>
                            inline ? (
                              <code style={{ background: 'rgba(255,255,255,0.12)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                {children}
                              </code>
                            ) : (
                              <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '0.6rem', borderRadius: '6px', overflowX: 'auto', fontSize: '0.76rem', margin: '0.5rem 0' }}>
                                <code>{children}</code>
                              </pre>
                            ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Timestamp Citation Badges */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div
                      style={{
                        marginTop: '0.65rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Jump to Video:</span>
                      {msg.citations.map((cit, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => onSeekVideo?.(cit.seconds)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '99px',
                            background: 'rgba(6, 182, 212, 0.18)',
                            border: '1px solid rgba(6, 182, 212, 0.4)',
                            color: '#67e8f9',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(6, 182, 212, 0.35)')}
                          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(6, 182, 212, 0.18)')}
                          title={`Seek video to ${cit.time}: ${cit.text}`}
                        >
                          <Clock size={11} />
                          <span>{cit.time}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.65rem 0.95rem',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  fontSize: '0.78rem',
                  width: 'fit-content',
                }}
              >
                <Loader2 size={15} className="animate-spin" color="#c084fc" />
                <span>Searching video transcript via RAG...</span>
              </div>
            )}

            {/* Quick Prompts on initial load */}
            {messages.length === 1 && !isLoading && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                  Suggested Questions:
                </div>
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qp.query)}
                    style={{
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.25)',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.18)';
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.45)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.25)';
                    }}
                  >
                    <span>{qp.label}</span>
                    <Sparkles size={12} color="#c084fc" />
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(10, 12, 19, 0.7)',
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
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about this video (RAG indexed)..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '0.7rem 0.95rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !input.trim()}
                style={{
                  padding: '0.7rem',
                  borderRadius: '10px',
                  border: 'none',
                  background:
                    input.trim() && !isLoading
                      ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                      : 'rgba(255, 255, 255, 0.06)',
                  color: input.trim() && !isLoading ? '#ffffff' : '#64748b',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: input.trim() && !isLoading ? '0 2px 10px rgba(124, 58, 237, 0.3)' : 'none',
                }}
              >
                {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
