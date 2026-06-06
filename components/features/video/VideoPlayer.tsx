'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Loader } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  initialTime?: number;
  onTimeUpdate?: (seconds: number) => void;
  onVideoEvent?: (type: 'pause' | 'rewind' | 'skip') => void;
  onPauseReasonSubmitted?: (reason: 'notes' | 'confused' | 'bored') => void;
  seekTo?: number | null; // external seek request (seconds)
}

export function VideoPlayer({ videoId, initialTime = 0, onTimeUpdate, onVideoEvent, onPauseReasonSubmitted, seekTo }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPausePrompt, setShowPausePrompt] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<'notes' | 'confused' | 'bored' | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeRef = useRef<number>(initialTime);
  const seekApplied = useRef<number | null>(null);

  useEffect(() => {
    const initPlayer = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (_) {}
      }
      playerRef.current = new (window as any).YT.Player(`yt-player-${videoId}`, {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0, start: Math.floor(initialTime) },
        events: {
          onReady: () => setIsLoaded(true),
          onStateChange: (event: any) => {
            // 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 0 = ENDED
            if (event.data === 1) {
              setIsPlaying(true);
              startTracking();
              setShowPausePrompt(false);
            } else {
              if (event.data === 2) {
                // Detect rewind vs simple pause
                const currentT = playerRef.current?.getCurrentTime?.() ?? 0;
                if (currentT < lastTimeRef.current - 2) {
                  onVideoEvent?.('rewind');
                } else {
                  onVideoEvent?.('pause');
                  setShowPausePrompt(true);
                }
              }
              setIsPlaying(false);
              stopTracking();
            }
          },
        },
      });
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else if ((window as any).YT?.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      stopTracking();
      try { playerRef.current?.destroy(); } catch (_) {}
    };
  }, [videoId]);

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
        {!isLoaded && (
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Loader size={11} /> Loading…
          </span>
        )}
      </div>

      <div ref={containerRef} style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid hsla(var(--border-glass))' }}>
        <div id={`yt-player-${videoId}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

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
          <div style={{ position: 'absolute', inset: 0, zIndex: 11, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: 'rgba(0,204,255,0.15)', border: '1px solid #00ccff', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 0 30px rgba(0,204,255,0.2)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🎮</span>
              <h4 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Let's play a game!</h4>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>Switch to the Quiz tab on the right to challenge yourself.</p>
              <button 
                onClick={() => setActiveOverlay(null)}
                style={{ background: '#00ccff', color: 'black', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Got it!
              </button>
            </div>
          </div>
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
