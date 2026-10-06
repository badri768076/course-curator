'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Loader, RotateCw, ExternalLink } from 'lucide-react';
import { BoredGameModal } from './BoredGameModal';

interface VideoPlayerProps {
  videoId: string;
  videoTitle?: string;
  initialTime?: number;
  onTimeUpdate?: (seconds: number) => void;
  onVideoEvent?: (type: 'pause' | 'rewind' | 'skip') => void;
  onPauseReasonSubmitted?: (reason: 'notes' | 'confused' | 'bored') => void;
  seekTo?: number | null; // external seek request (seconds)
  onVideoError?: (errCode?: number) => void;
  onSwitchVideo?: () => void;
}

export function VideoPlayer({
  videoId,
  videoTitle,
  initialTime = 0,
  onTimeUpdate,
  onVideoEvent,
  onPauseReasonSubmitted,
  seekTo,
  onVideoError,
  onSwitchVideo,
}: VideoPlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPausePrompt, setShowPausePrompt] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<'notes' | 'confused' | 'bored' | null>(null);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [useDirectEmbed, setUseDirectEmbed] = useState(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeRef = useRef<number>(initialTime);
  const seekApplied = useRef<number | null>(null);

  const autoSwitchCount = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    setHasVideoError(false);
    setIsLoaded(false);

    // Safely tear down existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (_) {}
      playerRef.current = null;
    }

    if (!mountRef.current) return;
    mountRef.current.innerHTML = '';

    // Direct iframe fallback mode
    if (useDirectEmbed) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=0&rel=0`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.onload = () => {
        if (isMounted) setIsLoaded(true);
      };
      mountRef.current.appendChild(iframe);
      return;
    }

    // Dynamic unmanaged child div for YouTube Iframe API
    const uniqueId = `yt-embed-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ytElem = document.createElement('div');
    ytElem.id = uniqueId;
    ytElem.style.width = '100%';
    ytElem.style.height = '100%';
    mountRef.current.appendChild(ytElem);

    const initPlayer = () => {
      if (!isMounted || !document.getElementById(uniqueId)) return;

      try {
        playerRef.current = new (window as any).YT.Player(uniqueId, {
          height: '100%',
          width: '100%',
          videoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            start: Math.floor(initialTime),
            enablejsapi: 1,
          },
          events: {
            onReady: () => {
              if (isMounted) setIsLoaded(true);
            },
            onStateChange: (event: any) => {
              // 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 0 = ENDED
              if (event.data === 1) {
                if (isMounted) {
                  setIsPlaying(true);
                  setShowPausePrompt(false);
                }
                startTracking();
              } else {
                if (event.data === 2) {
                  const currentT = playerRef.current?.getCurrentTime?.() ?? 0;
                  if (currentT < lastTimeRef.current - 2) {
                    onVideoEvent?.('rewind');
                  } else {
                    onVideoEvent?.('pause');
                    if (isMounted) setShowPausePrompt(true);
                  }
                }
                if (isMounted) setIsPlaying(false);
                stopTracking();
              }
            },
            onError: (event: any) => {
              console.warn('YouTube Player error code:', event.data);
              const isEmbedBlocked = event.data === 101 || event.data === 150 || event.data === 100 || event.data === 2;

              if (isEmbedBlocked && onSwitchVideo && autoSwitchCount.current < 2) {
                autoSwitchCount.current++;
                console.log(`Auto-switching away from non-embeddable video ${videoId} (attempt ${autoSwitchCount.current})`);
                onSwitchVideo();
                return;
              }

              if (isMounted) {
                setHasVideoError(true);
                setIsLoaded(true);
                onVideoError?.(event.data);
              }
            },
          },
        });
      } catch (err) {
        console.error('Failed to initialize YouTube Player:', err);
        if (isMounted) {
          setHasVideoError(true);
          setIsLoaded(true);
        }
      }
    };

    const loadAPI = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer();
        return;
      }

      if (typeof document !== 'undefined' && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      pollInterval = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          if (pollInterval) clearInterval(pollInterval);
          initPlayer();
        }
      }, 120);
    };

    loadAPI();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      stopTracking();
      try {
        playerRef.current?.destroy();
      } catch (_) {}
      playerRef.current = null;
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [videoId, useDirectEmbed]);

  // Handle external seek requests (from transcript timestamps)
  useEffect(() => {
    if (seekTo !== null && seekTo !== undefined && seekTo !== seekApplied.current && playerRef.current?.seekTo) {
      playerRef.current.seekTo(seekTo, true);
      seekApplied.current = seekTo;
      onVideoEvent?.('skip');
    }
  }, [seekTo]);

  const startTracking = () => {
    stopTracking();
    progressInterval.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const t = playerRef.current.getCurrentTime();
        onTimeUpdate?.(t);
        lastTimeRef.current = t;
      }
    }, 1500);
  };

  const stopTracking = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
  };

  return (
    <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
          {isPlaying
            ? <Play size={16} color="hsl(var(--primary-cyan))" />
            : <Pause size={16} color="hsl(var(--text-muted))" />}
          Video Lecture
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isLoaded && (
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Loader size={11} className="animate-spin" /> Loading…
            </span>
          )}
          {onSwitchVideo && (
            <button
              onClick={onSwitchVideo}
              title="Find another educational video for this topic"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: 'hsl(var(--text-secondary))',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              <RotateCw size={11} /> Next Video
            </button>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid hsla(var(--border-glass))' }}>
        {/* Unmanaged DOM mount node: React will NEVER call removeChild on elements inside this */}
        <div ref={mountRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Error overlay */}
        {hasVideoError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 12,
            background: 'rgba(9, 12, 22, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📺</span>
            <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
              Video Cannot Be Embedded Here
            </h4>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem', maxWidth: '380px', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              The creator of this video may have restricted external embedding. You can switch to another tutorial or open it directly.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {onSwitchVideo && (
                <button
                  onClick={onSwitchVideo}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: 'hsl(var(--primary-violet))',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <RotateCw size={13} /> Switch Video
                </button>
              )}
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(239,68,68,0.2)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={13} /> Watch on YouTube
              </a>
              {!useDirectEmbed && (
                <button
                  onClick={() => setUseDirectEmbed(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Try Direct Player
                </button>
              )}
            </div>
          </div>
        )}

        {showPausePrompt && !activeOverlay && (
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: 'rgba(9, 12, 22, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 255, 255, 0.1)',
            minWidth: '280px',
            animation: 'fadeIn 0.2s ease',
          }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', margin: 0 }}>
              Why did you pause? 🤔
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              {[
                { label: '✍️ Notes', value: 'notes' as const },
                { label: '🤔 Confused', value: 'confused' as const },
                { label: '🥱 Bored', value: 'bored' as const },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => {
                    onPauseReasonSubmitted?.(btn.value);
                    setShowPausePrompt(false);
                    setActiveOverlay(btn.value);
                    if (btn.value === 'notes' || btn.value === 'confused') {
                      setTimeout(() => setActiveOverlay(null), 4000);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.5rem',
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Immediate Overlays */}
        {activeOverlay === 'notes' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 11, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 0 30px rgba(34,197,94,0.2)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🌟</span>
              <h4 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Great Job!</h4>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', margin: 0 }}>Taking notes increases retention by 40%.</p>
            </div>
          </div>
        )}

        {activeOverlay === 'confused' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 11, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid hsl(var(--primary-violet))', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 0 30px rgba(168,85,247,0.2)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🧠</span>
              <h4 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Unlocking ELI5 Mode...</h4>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', margin: 0 }}>Check the Summary panel on the right for a simplified explanation!</p>
            </div>
          </div>
        )}

        {activeOverlay === 'bored' && (
          <BoredGameModal
            topicTitle={videoTitle}
            onResume={() => setActiveOverlay(null)}
          />
        )}
      </div>

      {initialTime > 0 && (
        <p style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', textAlign: 'right' }}>
          ▶ Resumed at {Math.floor(initialTime / 60)}m {Math.floor(initialTime % 60)}s
        </p>
      )}
    </div>
  );
}
