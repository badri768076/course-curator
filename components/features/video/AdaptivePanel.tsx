'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLearningStore } from '@/store/use-learning-store';
import { analyzeVideoAction } from '@/actions/ai-generation';
import { VideoAnalysisResult, TranscriptChunk } from '@/types/video-analysis';
import { MCQQuestion } from '@/types/ai-output';
import { FlowchartRenderer } from '@/components/features/flowchart/FlowchartRenderer';
import { VideoMindmapRenderer } from '@/components/features/mindmap/VideoMindmapRenderer';
import { AIFeedback } from '@/components/features/mcq/AIFeedback';
import { Button } from '@/components/ui/button';
import { STYLE_META, LearningStyle } from '@/types/learning-style';
import {
  FileText, AlignLeft, Share2, GitBranch, Zap,
  Loader, ChevronRight, Check, RefreshCw, Clock, Download,
} from 'lucide-react';

// ── Tab definitions ────────────────────────────────────────────────────────
type TabId = 'summary' | 'mindmap' | 'flowchart' | 'quiz' | 'transcript';

const BASE_TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'summary',    label: 'Summary',    icon: <FileText    size={14} /> },
  { id: 'transcript', label: 'Transcript', icon: <AlignLeft   size={14} /> },
  { id: 'mindmap',    label: 'Mindmap',    icon: <Share2      size={14} /> },
  { id: 'flowchart',  label: 'Flowchart',  icon: <GitBranch   size={14} /> },
  { id: 'quiz',       label: 'Quiz',       icon: <Zap         size={14} /> },
];

// Map dominant style → preferred tab order
const STYLE_TAB_ORDER: Record<LearningStyle, TabId[]> = {
  visual:      ['mindmap', 'flowchart', 'summary', 'transcript', 'quiz'],
  auditory:    ['transcript', 'summary', 'mindmap', 'flowchart', 'quiz'],
  'read-write':['summary', 'transcript', 'flowchart', 'mindmap', 'quiz'],
  kinesthetic: ['quiz', 'summary', 'flowchart', 'mindmap', 'transcript'],
  unknown:     ['summary', 'transcript', 'mindmap', 'flowchart', 'quiz'],
};

// ── Mini Quiz sub-component ────────────────────────────────────────────────
function MiniQuiz({ questions, topicSlug }: { questions: MCQQuestion[]; topicSlug: string }) {
  const { activeCourseId, saveQuizScore, markTopicCompleted, recordQuizAttemptSpeed, recordQuizAttemptDetails } = useLearningStore();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const startRef = useRef<number>(Date.now());
  const changeCountRef = useRef<number>(0);

  if (!questions || questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-secondary))' }}>
        No quiz questions available for this topic.
      </div>
    );
  }

  const q = questions[idx];

  const handleOptionClick = (i: number) => {
    if (submitted) return;
    if (selected !== null && selected !== i) changeCountRef.current += 1;
    setSelected(i);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    const elapsed = (Date.now() - startRef.current) / 1000;
    recordQuizAttemptSpeed(elapsed);
    recordQuizAttemptDetails(topicSlug, elapsed, changeCountRef.current);
    if (selected === q.correctAnswerIndex) setScore((s) => s + 1);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      const finalScore = score + (selected === q.correctAnswerIndex ? 1 : 0);
      if (activeCourseId) {
        saveQuizScore(activeCourseId, topicSlug, finalScore);
        if (finalScore / questions.length >= 0.5) markTopicCompleted(activeCourseId, topicSlug, true);
      }
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setSubmitted(false);
      startRef.current = Date.now();
      changeCountRef.current = 0;
    }
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={{ textAlign: 'center', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '3rem' }}>{pct >= 50 ? '🏆' : '📚'}</div>
        <div>
          <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{score}/{questions.length} Correct</p>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {pct >= 50 ? 'Great work! Topic marked complete.' : 'Review the content and try again.'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { setIdx(0); setSelected(null); setSubmitted(false); setScore(0); setDone(false); startRef.current = Date.now(); }}>
          <RefreshCw size={13} style={{ marginRight: '0.4rem' }} /> Retry Quiz
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Question {idx + 1} of {questions.length}</span>
        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> Score: {score}</span>
      </div>
      <p style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1.5, color: 'hsl(var(--primary-violet))' }}>{q.question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {q.options.map((opt, i) => {
          let bg = 'white';
          let border = 'hsla(var(--border-glass-bright))';
          if (submitted) {
            if (i === q.correctAnswerIndex) { bg = 'hsla(142, 70%, 90%, 0.5)'; border = '#22c55e'; }
            else if (i === selected) { bg = 'hsla(0, 80%, 90%, 0.5)'; border = '#ef4444'; }
          } else if (i === selected) {
            bg = 'hsla(var(--primary-violet) / 0.1)'; border = 'hsl(var(--primary-violet))';
          }
          return (
            <button key={i} onClick={() => handleOptionClick(i)}
              style={{ textAlign: 'left', padding: '0.8rem 1rem', borderRadius: '10px', background: bg, border: `1px solid ${border}`, color: 'hsl(var(--text-primary))', fontSize: '0.9rem', cursor: submitted ? 'default' : 'pointer', transition: 'all 0.18s ease', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: i === selected ? 'hsl(var(--primary-violet))' : 'hsla(var(--border-glass))', color: i === selected ? 'white' : 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {submitted && <AIFeedback isCorrect={selected === q.correctAnswerIndex} explanation={q.explanation} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!submitted
          ? <Button size="sm" disabled={selected === null} onClick={handleSubmit}>Submit</Button>
          : <Button size="sm" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {idx + 1 === questions.length ? 'Finish' : 'Next'} <ChevronRight size={14} />
            </Button>
        }
      </div>
    </div>
  );
}

// ── Main AdaptivePanel ─────────────────────────────────────────────────────
interface AdaptivePanelProps {
  courseId: string;
  topicSlug: string;
  topicTitle: string;
  videoId: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onSeekVideo?: (seconds: number) => void;
}

export function AdaptivePanel({ courseId, topicSlug, topicTitle, videoId, isCompleted, onToggleComplete, onSeekVideo }: AdaptivePanelProps) {
  const {
    learningProfile,
    videoAnalyses,
    eli5Unlocked,
    cacheVideoAnalysis,
    recordPanelTime,
  } = useLearningStore();

  const cacheKey = `${courseId}-${topicSlug}`;
  const [analysis, setAnalysis] = useState<VideoAnalysisResult | null>(videoAnalyses[cacheKey] || null);
  const [loading, setLoading] = useState(!videoAnalyses[cacheKey]);
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [eli5Mode, setEli5Mode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const tabStartRef = useRef<number>(Date.now());
  const isEli5Available = !!eli5Unlocked[topicSlug];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reorder tabs based on dominant learning style
  const dominantStyle = learningProfile.dominantStyle;
  const tabOrder = STYLE_TAB_ORDER[dominantStyle];
  const orderedTabs = [...BASE_TABS].sort(
    (a, b) => tabOrder.indexOf(a.id) - tabOrder.indexOf(b.id)
  );

  // Load analysis on mount
  useEffect(() => {
    const cached = videoAnalyses[cacheKey];
    const hasValidChapters = cached && cached.chapters && cached.chapters.length > 0 && cached.chapters.every(c => c.summary && c.summary.length > 100);
    
    if (cached && hasValidChapters) {
      setAnalysis(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    analyzeVideoAction(topicSlug, topicTitle, videoId)
      .then((result) => {
        cacheVideoAnalysis(cacheKey, result);
        setAnalysis(result);
      })
      .finally(() => setLoading(false));
  }, [topicSlug, videoId]);

  // Track panel dwell time on tab switch
  const switchTab = useCallback((tab: TabId) => {
    const ms = Date.now() - tabStartRef.current;
    if (ms > 1000) recordPanelTime(activeTab, ms); // ignore accidental flicks
    tabStartRef.current = Date.now();
    setActiveTab(tab);
  }, [activeTab, recordPanelTime]);

  // Also flush panel time on unmount
  useEffect(() => {
    return () => {
      const ms = Date.now() - tabStartRef.current;
      if (ms > 1000) recordPanelTime(activeTab, ms);
    };
  }, [activeTab]);

  const styleMeta = STYLE_META[dominantStyle];
  const isStyleDetected = dominantStyle !== 'unknown';

  if (!isMounted) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', height: '100%' }}>

      {/* ── Panel Header ── */}
      <div style={{ padding: '1.25rem 1.5rem 0', borderBottom: '1px solid hsla(var(--border-glass))', background: 'hsla(350, 80%, 98%, 0.9)', borderRadius: '16px 16px 0 0', border: '1px solid hsla(var(--border-glass))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'hsl(var(--text-primary))' }}>{topicTitle}</h2>
            {isStyleDetected && (
              <p style={{ fontSize: '0.75rem', color: styleMeta.color, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>{styleMeta.emoji}</span>
                <span>Showing {styleMeta.label.split(' ')[0]} layout</span>
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                import('@/lib/ppt-generator').then(({ generatePPT }) => {
                  if (analysis) generatePPT(topicTitle, analysis);
                });
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={13} /> PPT
            </Button>
            <Button
              variant={isCompleted ? 'secondary' : 'primary'}
              size="sm"
              onClick={onToggleComplete}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isCompleted && <Check size={13} color="#22c55e" />}
              {isCompleted ? 'Completed' : 'Mark Done'}
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '1px' }}>
          {orderedTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isPreferred = tabOrder[0] === tab.id && isStyleDetected;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.55rem 0.9rem',
                  borderRadius: '10px 10px 0 0',
                  border: 'none',
                  background: isActive ? 'hsla(350, 100%, 94%, 0.8)' : 'transparent',
                  borderBottom: isActive ? '2px solid hsl(var(--primary-violet))' : '2px solid transparent',
                  color: isActive ? 'hsl(var(--primary-violet))' : 'hsl(var(--text-secondary))',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                }}
              >
                {tab.icon}
                {tab.label}
                {isPreferred && (
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: styleMeta.color, position: 'absolute', top: '4px', right: '4px', boxShadow: `0 0 4px ${styleMeta.color}` }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Panel Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', border: '1px solid hsla(var(--border-glass))', borderTop: 'none', borderRadius: '0 0 16px 16px', background: 'hsla(350, 80%, 99%, 0.85)', minHeight: '400px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', padding: '3rem 0' }}>
            <Loader size={28} color="hsl(var(--primary-violet))" className="animate-spin" />
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>Generating {activeTab}…</p>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>AI is reading the video and building your study materials</p>
          </div>
        ) : !analysis ? (
          <p style={{ color: 'hsl(var(--text-muted))' }}>Could not generate content for this topic.</p>
        ) : (
          <>
            {/* SUMMARY */}
            {activeTab === 'summary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>
                    {eli5Mode ? 'Explain Like I\'m 5 Mode 👶' : 'Key Concepts from this lesson'}
                  </p>
                  {isEli5Available && (
                    <button
                      onClick={() => setEli5Mode((m) => !m)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.75rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 600,
                        background: eli5Mode ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                        border: eli5Mode ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                        color: eli5Mode ? '#22c55e' : 'hsl(var(--text-secondary))',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <span>{eli5Mode ? '🧠' : '👶'}</span>
                      {eli5Mode ? 'Normal Mode' : 'ELI5 Mode'}
                    </button>
                  )}
                </div>
                {(eli5Mode && analysis.eli5Summary ? analysis.eli5Summary : analysis.summary).map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '12px', background: eli5Mode ? 'rgba(34,197,94,0.04)' : 'white', border: `1px solid ${eli5Mode ? 'rgba(34,197,94,0.15)' : 'hsla(var(--border-glass))'}`, alignItems: 'flex-start', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>{point.emoji}</span>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'hsl(var(--primary-violet))', marginBottom: '0.3rem' }}>{point.heading}</p>
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.6 }}>{point.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TRANSCRIPT */}
            {activeTab === 'transcript' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--text-muted))' }}>
                  Detailed Video Chapters & AI Transcript Summary
                </p>
                {analysis.chapters && analysis.chapters.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {analysis.chapters.map((chapter, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          padding: '1.25rem',
                          borderRadius: '12px',
                          background: 'white',
                          border: '1px solid hsla(var(--border-glass))',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
                          alignItems: 'flex-start',
                        }}
                      >
                        <button
                          onClick={() => onSeekVideo?.(chapter.seconds)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            background: 'hsla(var(--primary-violet) / 0.08)',
                            border: '1px solid hsla(var(--primary-violet) / 0.2)',
                            color: 'hsl(var(--primary-violet))',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'hsla(var(--primary-violet) / 0.15)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'hsla(var(--primary-violet) / 0.08)';
                          }}
                        >
                          <Clock size={12} />
                          {chapter.timestamp}
                        </button>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#1f2937', marginBottom: '0.5rem' }}>
                            {chapter.title}
                          </h4>
                          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                            {chapter.summary}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
                    No chapter segment summaries available.
                  </div>
                )}
              </div>
            )}

            {/* MINDMAP */}
            {activeTab === 'mindmap' && (
              <VideoMindmapRenderer
                data={analysis.mindmap}
                title={topicTitle}
                onNodeClick={(slug) => {
                  // Find matching transcript chunk for seek
                  const chunk = analysis.transcript.find((t) =>
                    t.conceptTags?.some((tag) => slug.includes(tag.toLowerCase().replace(/\s+/g, '-')))
                  );
                  if (chunk) onSeekVideo?.(chunk.startTime);
                }}
              />
            )}

            {/* FLOWCHART */}
            {activeTab === 'flowchart' && (
              <FlowchartRenderer data={analysis.flowchart} title={topicTitle} />
            )}

            {/* QUIZ */}
            {activeTab === 'quiz' && (
              <MiniQuiz questions={analysis.quiz} topicSlug={topicSlug} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
