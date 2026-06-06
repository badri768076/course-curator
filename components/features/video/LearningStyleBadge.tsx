'use client';

import React, { useState } from 'react';
import { useLearningStore } from '@/store/use-learning-store';
import { STYLE_META } from '@/types/learning-style';

export function LearningStyleBadge() {
  const learningProfile = useLearningStore((s) => s.learningProfile);
  const [expanded, setExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { dominantStyle, scores, totalEngagementMs, videoPauses, videoRewinds } = learningProfile;
  const meta = STYLE_META[dominantStyle];
  const isKnown = dominantStyle !== 'unknown';

  if (!isMounted) return null;

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const styleOrder: Array<keyof typeof scores> = ['visual', 'auditory', 'read-write', 'kinesthetic'];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.5rem',
      }}
    >
      {/* Expanded detail card */}
      {expanded && (
        <div
          className="glass-card animate-slide-up"
          style={{ width: '260px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
        >
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>
              {meta.emoji} {meta.label}
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '0.4rem', lineHeight: 1.5 }}>
              {meta.description}
            </p>
          </div>

          {/* Style score bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>
              Inferred from your behaviour
            </p>
            {styleOrder.map((style) => {
              const pct = Math.round((scores[style] / totalScore) * 100);
              const m = STYLE_META[style];
              return (
                <div key={style} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: style === dominantStyle ? 'white' : 'hsl(var(--text-secondary))' }}>
                    <span>{m.emoji} {m.label.split(' ')[0]}</span>
                    <span style={{ fontWeight: style === dominantStyle ? 700 : 400 }}>{pct}%</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: m.color,
                      borderRadius: '99px',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[
              { label: 'Video Pauses', value: videoPauses },
              { label: 'Rewinds', value: videoRewinds },
              { label: 'Engaged', value: `${Math.round(totalEngagementMs / 60000)}m` },
              { label: 'Style', value: isKnown ? 'Detected ✓' : 'Learning…' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>{s.value}</div>
                <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main floating badge button */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 1rem',
          borderRadius: '999px',
          background: isKnown
            ? `linear-gradient(135deg, ${meta.color}22, ${meta.color}11)`
            : 'rgba(30,35,50,0.9)',
          border: `1px solid ${isKnown ? meta.color + '55' : 'rgba(100,116,139,0.4)'}`,
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
          boxShadow: isKnown ? `0 0 20px ${meta.color}33` : 'none',
          transition: 'all 0.3s ease',
          color: 'white',
          fontSize: '0.85rem',
          fontWeight: 600,
          fontFamily: 'var(--font-title)',
        }}
      >
        <span style={{ fontSize: '1rem' }}>{meta.emoji}</span>
        <span>{isKnown ? meta.label : 'Detecting style…'}</span>
        {isKnown && (
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: meta.color,
            boxShadow: `0 0 6px ${meta.color}`,
            animation: 'pulse 2s infinite',
          }} />
        )}
      </button>
    </div>
  );
}
