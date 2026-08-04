'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import styles from './AITutorChat.module.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AITutorChatProps {
    videoId?: string;
    topicTitle?: string;
}

export function AITutorChat({ videoId, topicTitle }: AITutorChatProps) {
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (videoId) {
            setMessages([
                { role: 'model', content: `Hi there! 👋\nI'm your AI Tutor. Let's explore "${topicTitle || 'this video'}". How can I help you today?` }
            ]);
        } else {
            setMessages([
                { role: 'model', content: "Hi! 👋\nPlease select a topic with a video to start chatting." }
            ]);
        }
        setInputMessage('');
        setIsLoading(false);
    }, [videoId, topicTitle]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || !videoId || isLoading) return;

        const newMessage = { role: 'user' as const, content: text };
        const updatedMessages = [...messages, newMessage];

        setMessages(updatedMessages);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/youtube-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId, messages: updatedMessages }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages([...updatedMessages, { role: 'model', content: data.reply }]);
            } else {
                setMessages([...updatedMessages, { role: 'model', content: `Error: ${data.error}` }]);
            }
        } catch (error) {
            setMessages([...updatedMessages, { role: 'model', content: 'An unexpected error occurred.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(inputMessage);
    };

    const quickQuestions: string[] = [
        "What are the key takeaways?",
        "Explain the main concept",
        "Can you give me an example?",
    ];

    return (
        <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
                <div className={styles.headerIconWrapper}>
                    <Bot size={18} className={styles.headerIcon} />
                </div>
                <h3 className={styles.headerTitle}>AI Tutor</h3>
            </div>

            <div className={styles.chatMessages}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userWrapper : styles.modelWrapper}`}>
                        {msg.role === 'model' && (
                            <div className={styles.avatarModel}><Bot size={14} /></div>
                        )}
                        <div className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.modelMessage}`}>
                            {msg.role === 'user' ? (
                                msg.content
                            ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className={`${styles.messageWrapper} ${styles.modelWrapper}`}>
                        <div className={styles.avatarModel}><Bot size={14} /></div>
                        <div className={`${styles.message} ${styles.modelMessage} ${styles.loadingMessage}`}>
                            <Loader2 className={styles.spinner} size={14} /> Thinking...
                        </div>
                    </div>
                )}

                {messages.length === 1 && videoId && !isLoading && (
                    <div className={styles.quickQuestions}>
                        {quickQuestions.map((q, idx) => (
                            <button
                                key={idx}
                                className={styles.quickQButton}
                                onClick={() => sendMessage(q)}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleFormSubmit} className={styles.chatInputContainer}>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={videoId ? "Ask anything..." : "Select a video first..."}
                    disabled={!videoId || isLoading}
                    className={styles.chatInput}
                />
                <button
                    type="submit"
                    disabled={!videoId || isLoading || !inputMessage.trim()}
                    className={styles.sendButton}
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
