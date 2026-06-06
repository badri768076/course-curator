'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLearningStore } from '@/store/use-learning-store';
import { STYLE_META, LearningStyle } from '@/types/learning-style';
import type { LearningProfile } from '@/types/learning-style';

// ── Study Buddy Message Types ──
interface BuddyMessage {
  id: string;
  emoji: string;
  text: string;
  type: 'tip' | 'praise' | 'nudge' | 'insight';
  priority: number;
}

function generateMessages(profile: LearningProfile, topicSlug: string, eli5Unlocked: boolean): BuddyMessage[] {
  const messages: BuddyMessage[] = [];
  const { dominantStyle, videoPauses, videoRewinds, pauseReasons, answeringStyle, scores } = profile;

  // ── Always show style detection status ──
  if (dominantStyle !== 'unknown') {
    const meta = STYLE_META[dominantStyle];
    messages.push({
      id: 'style-detected',
      emoji: meta.emoji,
      text: `Your dominant style is ${meta.label}! Content is now auto-optimised for you.`,
      type: 'insight',
      priority: 1,
    });
  }

  // ── Answering Style ──
  if (answeringStyle === 'Reflective') {
    messages.push({
      id: 'reflective',
      emoji: '🧘',
      text: 'You take your time answering — a sign of deep thinking. Try timed challenges to build speed!',
      type: 'tip',
      priority: 3,
    });
  } else if (answeringStyle === 'Active') {
    messages.push({
      id: 'active',
      emoji: '⚡',
      text: 'You answer fast and explore options! Try reading the explanation after each question for deeper insight.',
      type: 'tip',
      priority: 3,
    });
  }

  // ── Pause-driven insights ──
  if (pauseReasons.confused >= 2) {
    messages.push({
      id: 'confused-nudge',
      emoji: '💡',
      text: 'You\'ve been confused a few times — try the ELI5 mode in Summary for simpler explanations!',
      type: 'nudge',
      priority: 2,
    });
  }

  if (pauseReasons.notes >= 3) {
    messages.push({
      id: 'notes-praise',
      emoji: '📝',
      text: 'Great note-taking habit! Students who take notes retain 40% more information.',
      type: 'praise',
      priority: 4,
    });
  }

  if (pauseReasons.bored >= 2) {
    messages.push({
      id: 'bored-nudge',
      emoji: '🎮',
      text: 'Feeling bored? Try the Quiz tab for a quick challenge — it\'s interactive!',
      type: 'nudge',
      priority: 2,
    });
  }

  // ── Engagement-driven ──
  if (videoPauses >= 5) {
    messages.push({
      id: 'many-pauses',
      emoji: '⏸️',
      text: `You've paused ${videoPauses} times. Taking breaks is smart — your brain needs time to process!`,
      type: 'praise',
      priority: 5,
    });
  }

  if (videoRewinds >= 3) {
    messages.push({
      id: 'rewinds',
      emoji: '⏪',
      text: 'Rewinding often? Check the Transcript tab to read along at your pace.',
      type: 'tip',
      priority: 3,
    });
  }

  // ── ELI5 unlocked ──
  if (eli5Unlocked) {
    messages.push({
      id: 'eli5-unlocked',
      emoji: '👶',
      text: 'ELI5 Mode unlocked! Toggle it in the Summary tab for child-friendly analogies.',
      type: 'insight',
      priority: 2,
    });
  }

  // ── Score-based dynamic messages ──
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total > 0) {
    const topStyles = (Object.entries(scores) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    const [first, second] = topStyles;
    if (second && first[1] > 0 && second[1] > 0) {
      const pctDiff = Math.round(((first[1] - second[1]) / first[1]) * 100);
      if (pctDiff < 20) {
        messages.push({
          id: 'balanced',
          emoji: '⚖️',
          text: `You're balanced between ${first[0]} and ${second[0]} styles. Keep exploring all content types!`,
          type: 'insight',
          priority: 6,
        });
      }
    }
  }

  // ── Fallback ──
  if (messages.length === 0) {
    messages.push({
      id: 'welcome',
      emoji: '👋',
      text: 'Welcome! Start watching the video — I\'ll give you personalised tips as you learn.',
      type: 'tip',
      priority: 10,
    });
  }

  return messages.sort((a, b) => a.priority - b.priority);
}

export function StudyBuddy({ topicSlug }: { topicSlug: string }) {
  const learningProfile = useLearningStore((s) => s.learningProfile);
  const eli5Unlocked = useLearningStore((s) => s.eli5Unlocked);
  const [expanded, setExpanded] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const messages = generateMessages(learningProfile, topicSlug, !!eli5Unlocked[topicSlug]);
  const current = messages[currentIdx % messages.length];

  // Auto-rotate messages when expanded
  useEffect(() => {
    if (expanded && messages.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIdx((i) => (i + 1) % messages.length);
      }, 6000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expanded, messages.length]);

  if (!isMounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '5rem',
        right: '1.5rem',
        zIndex: 99,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.5rem',
      }}
    >
      {/* Expanded card */}
      {expanded && (
        <div
          className="animate-slide-up"
          style={{
            width: '300px',
            padding: '1.25rem',
            background: 'rgba(9, 12, 22, 0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.5), 0 0 20px rgba(168,85,247,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🤖 Study Buddy
            </h4>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
              {currentIdx + 1}/{messages.length}
            </span>
          </div>

          {/* Current message */}
          <div
            key={current.id}
            style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '0.9rem',
              borderRadius: '12px',
              background: current.type === 'nudge'
                ? 'rgba(239,68,68,0.06)'
                : current.type === 'praise'
                ? 'rgba(34,197,94,0.06)'
                : 'rgba(168,85,247,0.06)',
              border: `1px solid ${
                current.type === 'nudge'
                  ? 'rgba(239,68,68,0.2)'
                  : current.type === 'praise'
                  ? 'rgba(34,197,94,0.2)'
                  : 'rgba(168,85,247,0.2)'
              }`,
              alignItems: 'flex-start',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{current.emoji}</span>
            <p style={{ fontSize: '0.82rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.55, margin: 0 }}>
              {current.text}
            </p>
          </div>

          {/* Navigation dots */}
          {messages.length > 1 && (
            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
              {messages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    width: i === currentIdx % messages.length ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '99px',
                    background: i === currentIdx % messages.length ? 'hsl(var(--primary-violet))' : 'rgba(255,255,255,0.15)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* Answering style badge */}
          {learningProfile.answeringStyle !== 'Balanced' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.75rem', borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: '0.75rem' }}>
                {learningProfile.answeringStyle === 'Reflective' ? '🧘' : '⚡'}
              </span>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'white', margin: 0 }}>
                  {learningProfile.answeringStyle} Learner
                </p>
                <p style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                  Based on quiz response patterns
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(0,204,255,0.2))',
          border: '1px solid rgba(168,85,247,0.4)',
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
          boxShadow: '0 4px 24px rgba(168,85,247,0.25)',
          transition: 'all 0.3s ease',
          transform: expanded ? 'rotate(15deg)' : 'rotate(0deg)',
        }}
        onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 32px rgba(168,85,247,0.45)'; e.currentTarget.style.transform = expanded ? 'rotate(15deg) scale(1.05)' : 'scale(1.1)'; }}
        onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(168,85,247,0.25)'; e.currentTarget.style.transform = expanded ? 'rotate(15deg)' : 'rotate(0deg)'; }}
      >
        🤖
      </button>
    </div>
  );
}
