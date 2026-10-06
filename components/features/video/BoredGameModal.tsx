'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trophy, RotateCw, Play, Sparkles, Zap, Timer, Flame, CheckCircle2 } from 'lucide-react';

interface BoredGameModalProps {
  topicTitle?: string;
  onResume: () => void;
}

interface MemoryCard {
  id: number;
  pairId: number;
  content: string;
  type: 'term' | 'def';
  isFlipped: boolean;
  isMatched: boolean;
}

// Concept pairs tailored to programming topics
const TOPIC_PAIRS: Record<string, Array<{ term: string; def: string }>> = {
  react: [
    { term: 'Component', def: 'Reusable building block of UI' },
    { term: 'State', def: 'Internal data that triggers re-render' },
    { term: 'Props', def: 'Read-only inputs passed from parent' },
    { term: 'Virtual DOM', def: 'Fast in-memory copy of the real DOM' },
    { term: 'useEffect', def: 'Handles side effects & subscriptions' },
    { term: 'JSX', def: 'HTML-like syntax extension in JS' },
  ],
  javascript: [
    { term: 'Closure', def: 'Function bundled with lexical environment' },
    { term: 'Promise', def: 'Object representing async completion' },
    { term: 'Event Loop', def: 'Coordinates execution stack & queues' },
    { term: 'Hoisting', def: 'Variable declarations moved to top' },
    { term: 'Prototype', def: 'Mechanism for JS object inheritance' },
    { term: 'Arrow Fn', def: 'Lexically binds this context' },
  ],
  python: [
    { term: 'List Comp', def: 'Concise syntax to build lists' },
    { term: 'Decorator', def: 'Function that modifies another function' },
    { term: 'Generator', def: 'Function yielding values lazily' },
    { term: 'GIL', def: 'Global Interpreter Lock for threads' },
    { term: 'Tuple', def: 'Immutable ordered sequence' },
    { term: 'Dunder', def: 'Special method with double underscores' },
  ],
  default: [
    { term: 'Algorithm', def: 'Step-by-step problem-solving rules' },
    { term: 'Data Structure', def: 'Organized way of storing values' },
    { term: 'API', def: 'Contract for software communication' },
    { term: 'Recursion', def: 'Function calling itself to solve subproblems' },
    { term: 'Complexity', def: 'Measure of time & memory scaling' },
    { term: 'Debugging', def: 'Finding and resolving code defects' },
  ],
};

function getPairsForTopic(topicTitle: string = '') {
  const lower = topicTitle.toLowerCase();
  for (const [key, pairs] of Object.entries(TOPIC_PAIRS)) {
    if (lower.includes(key)) return pairs;
  }
  return TOPIC_PAIRS.default;
}

export function BoredGameModal({ topicTitle = 'React', onResume }: BoredGameModalProps) {
  const [gameMode, setGameMode] = useState<'memory' | 'blitz'>('memory');
  
  // ── Memory Match State ──
  const basePairs = useMemo(() => getPairsForTopic(topicTitle), [topicTitle]);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isWon, setIsWon] = useState(false);

  // Initialize cards
  const initMemoryGame = () => {
    // Pick 4 pairs (8 cards total) for a fast, punchy 1-minute game
    const selectedPairs = basePairs.slice(0, 4);
    const cardList: MemoryCard[] = [];

    selectedPairs.forEach((pair, pairIdx) => {
      cardList.push({
        id: pairIdx * 2,
        pairId: pairIdx,
        content: pair.term,
        type: 'term',
        isFlipped: false,
        isMatched: false,
      });
      cardList.push({
        id: pairIdx * 2 + 1,
        pairId: pairIdx,
        content: pair.def,
        type: 'def',
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle cards
    for (let i = cardList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardList[i], cardList[j]] = [cardList[j], cardList[i]];
    }

    setCards(cardList);
    setFlippedIndices([]);
    setMoves(0);
    setMatchesCount(0);
    setElapsedSec(0);
    setIsWon(false);
  };

  useEffect(() => {
    initMemoryGame();
  }, [basePairs]);

  // Timer
  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isWon]);

  // Handle card flip
  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    const newFlipped = [...flippedIndices, index];
    setCards(newCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        // Match found!
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;
            return updated;
          });
          setFlippedIndices([]);
          setMatchesCount((c) => {
            const newCount = c + 1;
            if (newCount === 4) setIsWon(true);
            return newCount;
          });
        }, 350);
      } else {
        // No match, flip back
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  // ── Speed Blitz Mode State ──
  const [blitzScore, setBlitzScore] = useState(0);
  const [blitzStreak, setBlitzStreak] = useState(0);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState(20);
  const [blitzOver, setBlitzOver] = useState(false);
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [isPromptCorrectPair, setIsPromptCorrectPair] = useState(true);

  const blitzPrompts = useMemo(() => {
    const list = [];
    for (let i = 0; i < basePairs.length; i++) {
      const correct = basePairs[i];
      // true prompt
      list.push({ term: correct.term, def: correct.def, isMatch: true });
      // false prompt
      const wrong = basePairs[(i + 1) % basePairs.length];
      list.push({ term: correct.term, def: wrong.def, isMatch: false });
    }
    return list.sort(() => Math.random() - 0.5);
  }, [basePairs]);

  useEffect(() => {
    if (gameMode !== 'blitz' || blitzOver) return;
    const timer = setInterval(() => {
      setBlitzTimeLeft((t) => {
        if (t <= 1) {
          setBlitzOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameMode, blitzOver]);

  const handleBlitzAnswer = (userGuessedMatch: boolean) => {
    if (blitzOver) return;
    const current = blitzPrompts[currentPromptIdx % blitzPrompts.length];
    const isCorrect = userGuessedMatch === current.isMatch;

    if (isCorrect) {
      setBlitzScore((s) => s + 10 + blitzStreak * 2);
      setBlitzStreak((st) => st + 1);
    } else {
      setBlitzStreak(0);
    }

    setCurrentPromptIdx((idx) => idx + 1);
  };

  const restartBlitz = () => {
    setBlitzScore(0);
    setBlitzStreak(0);
    setBlitzTimeLeft(20);
    setBlitzOver(false);
    setCurrentPromptIdx(0);
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 25,
      background: 'rgba(10, 12, 20, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease',
      color: '#ffffff',
      fontFamily: 'var(--cc-font-body, "Inter", sans-serif)',
    }}>
      <div style={{
        background: '#ffffff',
        color: '#1a1a2e',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '92%',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
        border: '1px solid #e2e8f0',
        padding: '1.25rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
      }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🎮</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1a1a2e', fontFamily: 'var(--cc-font-display, "Outfit", sans-serif)' }}>
                Brain Break Arcade!
              </h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                Recharge your mind with quick concept games
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px', gap: '2px' }}>
            <button
              onClick={() => setGameMode('memory')}
              style={{
                border: 'none',
                background: gameMode === 'memory' ? '#4f46e5' : 'transparent',
                color: gameMode === 'memory' ? '#ffffff' : '#64748b',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🧠 Memory Match
            </button>
            <button
              onClick={() => { setGameMode('blitz'); restartBlitz(); }}
              style={{
                border: 'none',
                background: gameMode === 'blitz' ? '#4f46e5' : 'transparent',
                color: gameMode === 'blitz' ? '#ffffff' : '#64748b',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ⚡ Speed Blitz
            </button>
          </div>
        </div>

        {/* ── MODE 1: MEMORY MATCH ── */}
        {gameMode === 'memory' && (
          <>
            {/* Stats row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Timer size={13} color="#4f46e5" />
                <span>Time: {elapsedSec}s</span>
              </div>
              <div>
                <span>Moves: <b>{moves}</b></span>
              </div>
              <div style={{ color: matchesCount === 4 ? '#16a34a' : '#4f46e5' }}>
                <span>Pairs: <b>{matchesCount}/4</b></span>
              </div>
              <button
                onClick={initMemoryGame}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}
                title="Shuffle and start new round"
              >
                <RotateCw size={11} /> Reset
              </button>
            </div>

            {/* Win Banner */}
            {isWon ? (
              <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #86efac', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.25s ease' }}>
                <span style={{ fontSize: '2.5rem' }}>🏆</span>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#15803d' }}>
                  Magnificent Memory!
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534' }}>
                  Solved in <b>{moves} moves</b> ({elapsedSec} seconds)! Your brain is refreshed and ready to learn.
                </p>
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={initMemoryGame}
                    style={{ background: '#ffffff', border: '1px solid #86efac', color: '#15803d', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Play Again 🔄
                  </button>
                  <button
                    onClick={onResume}
                    style={{ background: '#16a34a', border: 'none', color: '#ffffff', padding: '0.45rem 1.1rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)' }}
                  >
                    <Play size={13} fill="#ffffff" /> Resume Video
                  </button>
                </div>
              </div>
            ) : (
              /* Cards Grid (2 rows x 4 cols) */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.55rem' }}>
                {cards.map((card, i) => {
                  const showContent = card.isFlipped || card.isMatched;
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(i)}
                      disabled={card.isMatched || card.isFlipped}
                      style={{
                        height: '76px',
                        borderRadius: '10px',
                        border: card.isMatched
                          ? '2px solid #86efac'
                          : showContent
                          ? '2px solid #6366f1'
                          : '1px solid #cbd5e1',
                        background: card.isMatched
                          ? '#f0fdf4'
                          : showContent
                          ? '#eef2ff'
                          : '#f8fafc',
                        color: card.isMatched
                          ? '#15803d'
                          : showContent
                          ? '#312e81'
                          : '#94a3b8',
                        padding: '0.4rem',
                        fontSize: card.type === 'term' ? '0.78rem' : '0.66rem',
                        fontWeight: card.type === 'term' ? 800 : 500,
                        lineHeight: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        cursor: card.isMatched ? 'default' : 'pointer',
                        transition: 'transform 0.18s ease, background 0.18s ease',
                        boxShadow: showContent ? '0 4px 10px rgba(99, 102, 241, 0.15)' : 'none',
                        transform: showContent ? 'scale(1.02)' : 'scale(1)',
                        userSelect: 'none',
                      }}
                    >
                      {showContent ? (
                        <span>
                          {card.type === 'term' && '🔹 '}
                          {card.content}
                        </span>
                      ) : (
                        <span style={{ fontSize: '1.2rem', opacity: 0.65 }}>❓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── MODE 2: SPEED BLITZ ── */}
        {gameMode === 'blitz' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: blitzTimeLeft <= 5 ? '#dc2626' : '#4f46e5' }}>
                <Timer size={13} />
                <span>Timer: <b>{blitzTimeLeft}s</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ea580c' }}>
                <Flame size={13} />
                <span>Streak: <b>{blitzStreak}x</b></span>
              </div>
              <div style={{ color: '#16a34a' }}>
                <span>Score: <b>{blitzScore}</b></span>
              </div>
            </div>

            {blitzOver ? (
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '2.5rem' }}>⚡</span>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                  Time's Up! Final Score: {blitzScore}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  {blitzScore >= 50 ? '🔥 Incredible focus & speed!' : 'Great warm-up session!'}
                </p>
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={restartBlitz}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Play Again 🔄
                  </button>
                  <button
                    onClick={onResume}
                    style={{ background: '#4f46e5', border: 'none', color: '#ffffff', padding: '0.45rem 1.1rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Play size={13} fill="#ffffff" /> Resume Video
                  </button>
                </div>
              </div>
            ) : (
              /* Active Blitz Card */
              (() => {
                const current = blitzPrompts[currentPromptIdx % blitzPrompts.length];
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '100%', background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 750, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Does this match?
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#312e81' }}>
                        {current.term}
                      </h4>
                      <div style={{ height: '1px', background: '#cbd5e1', margin: '0.2rem 0' }} />
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>
                        &ldquo;{current.def}&rdquo;
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.85rem', width: '100%' }}>
                      <button
                        onClick={() => handleBlitzAnswer(false)}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s ease' }}
                      >
                        ❌ WRONG
                      </button>
                      <button
                        onClick={() => handleBlitzAnswer(true)}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #86efac', background: '#f0fdf4', color: '#15803d', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s ease' }}
                      >
                        ✅ MATCH
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Tip: Pausing to play mini-games re-engages dopamine and boosts focus.
          </span>
          <button
            onClick={onResume}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '0.35rem 0.85rem',
              borderRadius: '7px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Play size={12} fill="#334155" />
            <span>Resume Video</span>
          </button>
        </div>
      </div>
    </div>
  );
}
