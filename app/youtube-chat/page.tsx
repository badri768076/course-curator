'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Send, Loader2, Bot, User, Youtube } from 'lucide-react';
import styles from './youtube-chat.module.css';
import Link from 'next/link';

export default function YoutubeChat() {
    const [videoUrl, setVideoUrl] = useState('');
    const [videoId, setVideoId] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const extractVideoId = (url: string) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : false;
    };

    const handleLoadVideo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoUrl) return;

        const id = extractVideoId(videoUrl);
        if (id) {
            setVideoId(id);
            setMessages([
                { role: 'model', content: 'Hi! I am ready to answer any questions about this video. What would you like to know?' }
            ]);
        } else {
            alert('Please enter a valid YouTube URL');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !videoId || isLoading) return;

        const newMessage = { role: 'user' as const, content: inputMessage };
        const updatedMessages = [...messages, newMessage];

        setMessages(updatedMessages);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/youtube-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId,
                    messages: updatedMessages
                })
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

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <Youtube className={styles.logoIcon} size={28} />
                    <h1>YouTube RAG Chat</h1>
                </div>
                <Link href="/" className={styles.backLink}>Back to Home</Link>
            </header>

            <main className={styles.main}>
                <div className={styles.leftPanel}>
                    {!videoId ? (
                        <div className={styles.setupCard}>
                            <h2>Analyze any YouTube Video</h2>
                            <p>Enter a YouTube video URL to start chatting with its content.</p>
                            <form onSubmit={handleLoadVideo} className={styles.urlForm}>
                                <input
                                    type="text"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className={styles.input}
                                />
                                <button type="submit" className={styles.button}>
                                    <Play size={18} /> Load Video
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className={styles.videoCard}>
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className={styles.iframe}
                            ></iframe>
                        </div>
                    )}
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.chatCard}>
                        <div className={styles.chatHeader}>
                            <Bot size={24} className={styles.chatIcon} />
                            <h3>Video Assistant</h3>
                        </div>

                        <div className={styles.chatMessages}>
                            {messages.length === 0 && !videoId ? (
                                <div className={styles.emptyState}>
                                    Load a video to start chatting!
                                </div>
                            ) : null}

                            {messages.map((msg, idx) => (
                                <div key={idx} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userWrapper : styles.modelWrapper}`}>
                                    <div className={styles.avatar}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.modelMessage}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className={`${styles.messageWrapper} ${styles.modelWrapper}`}>
                                    <div className={styles.avatar}>
                                        <Bot size={16} />
                                    </div>
                                    <div className={`${styles.message} ${styles.loadingMessage}`}>
                                        <Loader2 className={styles.spinner} size={18} /> Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className={styles.chatInputContainer}>
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder={videoId ? "Ask a question about the video..." : "Load a video first"}
                                disabled={!videoId || isLoading}
                                className={styles.chatInput}
                            />
                            <button
                                type="submit"
                                disabled={!videoId || isLoading || !inputMessage.trim()}
                                className={styles.sendButton}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
