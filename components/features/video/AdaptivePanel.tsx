'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLearningStore } from '@/store/use-learning-store';
import { analyzeVideoAction } from '@/actions/ai-generation';
import { VideoAnalysisResult } from '@/types/video-analysis';
import { MCQQuestion } from '@/types/ai-output';
import { FlowchartRenderer } from '@/components/features/flowchart/FlowchartRenderer';
import { VideoMindmapRenderer } from '@/components/features/mindmap/VideoMindmapRenderer';
import { AIFeedback } from '@/components/features/mcq/AIFeedback';
import { STYLE_META, LearningStyle } from '@/types/learning-style';
import {
  FileText,
  Share2,
  GitBranch,
  Zap,
  Loader,
  ChevronRight,
  Check,
  RefreshCw,
  Clock,
  Download,
  Sparkles,
} from 'lucide-react';

import styles from './AdaptivePanel.module.css';

type TabId = 'summary' | 'mindmap' | 'flowchart' | 'quiz';

const BASE_TABS: Array<{
  id: TabId;
  label: string;
  icon: React.ReactNode;
}> = [
    { id: 'summary', label: 'Summary', icon: <FileText size={14} /> },
    { id: 'mindmap', label: 'Mindmap', icon: <Share2 size={14} /> },
    { id: 'flowchart', label: 'Flowchart', icon: <GitBranch size={14} /> },
    { id: 'quiz', label: 'Quiz', icon: <Zap size={14} /> },
  ];

const STYLE_TAB_ORDER: Record<LearningStyle, TabId[]> = {
  visual: ['mindmap', 'flowchart', 'summary', 'quiz'],
  auditory: ['summary', 'mindmap', 'flowchart', 'quiz'],
  'read-write': ['summary', 'flowchart', 'mindmap', 'quiz'],
  kinesthetic: ['quiz', 'summary', 'flowchart', 'mindmap'],
  unknown: ['summary', 'mindmap', 'flowchart', 'quiz'],
};

/* -------------------------------------------------------------------------- */
/* Mini Quiz                                                                  */
/* -------------------------------------------------------------------------- */

function MiniQuiz({
  questions,
  topicSlug,
}: {
  questions: MCQQuestion[];
  topicSlug: string;
}) {
  const {
    activeCourseId,
    saveQuizScore,
    markTopicCompleted,
    recordQuizAttemptSpeed,
    recordQuizAttemptDetails,
  } = useLearningStore();

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const startRef = useRef<number>(Date.now());
  const changeCountRef = useRef<number>(0);

  if (!questions || questions.length === 0) {
    return (
      <div className={styles.emptyState}>
        No quiz questions available for this topic.
      </div>
    );
  }

  const q = questions[idx];

  const handleOptionClick = (i: number) => {
    if (submitted) return;

    if (selected !== null && selected !== i) {
      changeCountRef.current += 1;
    }

    setSelected(i);
  };

  const handleSubmit = () => {
    if (selected === null) return;

    const elapsed = (Date.now() - startRef.current) / 1000;

    recordQuizAttemptSpeed(elapsed);
    recordQuizAttemptDetails(
      topicSlug,
      elapsed,
      changeCountRef.current
    );

    if (selected === q.correctAnswerIndex) {
      setScore((s) => s + 1);
    }

    setSubmitted(true);
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      const finalScore =
        score + (selected === q.correctAnswerIndex ? 1 : 0);

      if (activeCourseId) {
        saveQuizScore(
          activeCourseId,
          topicSlug,
          finalScore
        );

        if (finalScore / questions.length >= 0.5) {
          markTopicCompleted(
            activeCourseId,
            topicSlug,
            true
          );
        }
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
    const pct = Math.round(
      (score / questions.length) * 100
    );

    return (
      <div className={styles.quizResult}>
        <div className={styles.quizResultIcon}>
          {pct >= 50 ? '🏆' : '📚'}
        </div>

        <div>
          <p className={styles.quizScore}>
            {score}/{questions.length} Correct
          </p>

          <p className={styles.quizResultMessage}>
            {pct >= 50
              ? 'Great work! Topic marked complete.'
              : 'Review the content and try again.'}
          </p>
        </div>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            setIdx(0);
            setSelected(null);
            setSubmitted(false);
            setScore(0);
            setDone(false);
            startRef.current = Date.now();
          }}
        >
          <RefreshCw size={13} />
          Retry Quiz
        </button>
      </div>
    );
  }

  return (
    <div className={styles.quiz}>
      <div className={styles.quizTopBar}>
        <span>
          Question {idx + 1} of {questions.length}
        </span>

        <span className={styles.quizScoreSmall}>
          <Clock size={12} />
          Score: {score}
        </span>
      </div>

      <p className={styles.quizQuestion}>
        {q.question}
      </p>

      <div className={styles.quizOptions}>
        {q.options.map((opt, i) => {
          let optionClass = styles.quizOption;

          if (!submitted && i === selected) {
            optionClass += ` ${styles.quizOptionSelected}`;
          }

          if (submitted) {
            if (i === q.correctAnswerIndex) {
              optionClass += ` ${styles.quizOptionCorrect}`;
            } else if (i === selected) {
              optionClass += ` ${styles.quizOptionWrong}`;
            } else {
              optionClass += ` ${styles.quizOptionNeutral}`;
            }
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleOptionClick(i)}
              className={optionClass}
              disabled={submitted}
            >
              <span
                className={`${styles.optionLetter} ${i === selected
                    ? styles.optionLetterSelected
                    : ''
                  }`}
              >
                {String.fromCharCode(65 + i)}
              </span>

              <span className={styles.optionText}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {submitted && (
        <AIFeedback
          isCorrect={selected === q.correctAnswerIndex}
          explanation={q.explanation}
        />
      )}

      <div className={styles.quizActions}>
        {!submitted ? (
          <button
            type="button"
            className={styles.primaryButton}
            disabled={selected === null}
            onClick={handleSubmit}
          >
            Submit
          </button>
        ) : (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleNext}
          >
            {idx + 1 === questions.length
              ? 'Finish'
              : 'Next'}
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Adaptive Panel                                                        */
/* -------------------------------------------------------------------------- */

interface AdaptivePanelProps {
  courseId: string;
  topicSlug: string;
  topicTitle: string;
  videoId: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onSeekVideo?: (seconds: number) => void;
}

export function AdaptivePanel({
  courseId,
  topicSlug,
  topicTitle,
  videoId,
  isCompleted,
  onToggleComplete,
  onSeekVideo,
}: AdaptivePanelProps) {
  const {
    learningProfile,
    videoAnalyses,
    eli5Unlocked,
    cacheVideoAnalysis,
    recordPanelTime,
  } = useLearningStore();

  const cacheKey = `${courseId}-${topicSlug}`;

  const [analysis, setAnalysis] =
    useState<VideoAnalysisResult | null>(
      videoAnalyses[cacheKey] || null
    );

  const [loading, setLoading] = useState(
    !videoAnalyses[cacheKey]
  );

  const [activeTab, setActiveTab] =
    useState<TabId>('summary');

  const [eli5Mode, setEli5Mode] =
    useState(false);

  const [isMounted, setIsMounted] =
    useState(false);

  const tabStartRef = useRef<number>(Date.now());

  const isEli5Available =
    !!eli5Unlocked[topicSlug];



  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* ------------------------------ Tab ordering ----------------------------- */

  const dominantStyle =
    learningProfile.dominantStyle;

  const tabOrder =
    STYLE_TAB_ORDER[dominantStyle];

  const orderedTabs = [...BASE_TABS].sort(
    (a, b) =>
      tabOrder.indexOf(a.id) -
      tabOrder.indexOf(b.id)
  );

  /* ----------------------------- Load analysis ----------------------------- */

  const loadAnalysis = useCallback((forceRefresh: boolean = false) => {
    const cached = videoAnalyses[cacheKey];

    // Detect stale or old static mock data: require version === 3
    const isValid =
      !forceRefresh &&
      cached &&
      cached.version === 3 &&
      cached.chapters &&
      cached.chapters.length > 0 &&
      cached.quiz &&
      cached.quiz.length > 0;

    if (isValid) {
      setAnalysis(cached);
      setLoading(false);
      return;
    }

    setLoading(true);

    analyzeVideoAction(
      topicSlug,
      topicTitle,
      videoId
    )
      .then((result) => {
        cacheVideoAnalysis(
          cacheKey,
          result
        );
        setAnalysis(result);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cacheKey, topicSlug, topicTitle, videoId, videoAnalyses, cacheVideoAnalysis]);

  useEffect(() => {
    loadAnalysis(false);
  }, [loadAnalysis]);

  /* --------------------------- Panel time tracking -------------------------- */

  const switchTab = useCallback(
    (tab: TabId) => {
      const ms =
        Date.now() - tabStartRef.current;

      if (ms > 1000) {
        recordPanelTime(
          activeTab,
          ms
        );
      }

      tabStartRef.current = Date.now();
      setActiveTab(tab);
    },
    [activeTab, recordPanelTime]
  );

  useEffect(() => {
    return () => {
      const ms =
        Date.now() - tabStartRef.current;

      if (ms > 1000) {
        recordPanelTime(
          activeTab,
          ms
        );
      }
    };
  }, [activeTab]);

  const styleMeta =
    (dominantStyle && STYLE_META?.[dominantStyle]) || STYLE_META?.unknown;

  const isStyleDetected =
    dominantStyle !== 'unknown';

  if (!isMounted) return null;

  return (
    <div className={styles.panel}>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <header className={styles.panelHeader}>
        <div className={styles.headerMain}>
          <div className={styles.headerTopRow}>
            <div className={styles.eyebrowBadge}>
              <FileText size={12} />
              <span>Lesson Notes</span>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                title="Regenerate dynamic notes, quiz, and mindmap for this topic"
                onClick={() => loadAnalysis(true)}
                disabled={loading}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>{loading ? 'Refreshing…' : 'Regenerate'}</span>
              </button>

              <button
                type="button"
                className={styles.secondaryButton}
                title="Download Presentation Slides (.pptx)"
                onClick={() => {
                  import('@/lib/ppt-generator').then(
                    ({ generatePPT }) => {
                      if (analysis) {
                        generatePPT(
                          topicTitle,
                          analysis
                        );
                      }
                    }
                  );
                }}
              >
                <Download size={12} />
                <span>PPT</span>
              </button>

              <button
                type="button"
                className={
                  isCompleted
                    ? `${styles.secondaryButton} ${styles.completedButton}`
                    : styles.primaryButton
                }
                onClick={onToggleComplete}
              >
                {isCompleted && (
                  <Check size={12} />
                )}
                <span>
                  {isCompleted
                    ? 'Completed'
                    : 'Mark Done'}
                </span>
              </button>
            </div>
          </div>

          <div className={styles.headingBlock}>
            <h2 className={styles.topicTitle}>
              {topicTitle}
            </h2>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Tabs                                                             */}
        {/* ---------------------------------------------------------------- */}

        <nav
          className={styles.tabBar}
          aria-label="Study materials"
        >
          {orderedTabs.map((tab) => {
            const isActive =
              activeTab === tab.id;

            const isPreferred =
              tabOrder[0] === tab.id &&
              isStyleDetected;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  switchTab(tab.id)
                }
                className={`${styles.tabButton} ${isActive
                    ? styles.tabButtonActive
                    : ''
                  }`}
              >
                {tab.icon}

                <span>{tab.label}</span>

                {isPreferred && (
                  <span
                    className={
                      styles.preferredDot
                    }
                    aria-label="Recommended for your learning style"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Content                                                            */}
      {/* ------------------------------------------------------------------ */}

      <main className={styles.panelContent}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loaderRing}>
              <Loader size={22} />
            </div>

            <p className={styles.loadingTitle}>
              Generating {activeTab}…
            </p>

            <p className={styles.loadingDescription}>
              AI is reading the video and building
              your study materials
            </p>
          </div>
        ) : !analysis ? (
          <div className={styles.errorState}>
            <p>
              Could not generate content for
              this topic.
            </p>
          </div>
        ) : (
          <>
            {/* ============================================================ */}
            {/* SUMMARY                                                       */}
            {/* ============================================================ */}

            {activeTab === 'summary' && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <div>
                    <span className={styles.sectionEyebrow}>
                      {eli5Mode
                        ? "EXPLAIN LIKE I'M 5"
                        : 'KEY CONCEPTS & SUMMARY'}
                    </span>

                    <p className={styles.sectionDescription}>
                      {eli5Mode
                        ? 'Simpler analogies and beginner-friendly intuition.'
                        : 'Core technical concepts and takeaways from this lecture.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEli5Mode(
                        (m) => !m
                      )
                    }
                    className={`${styles.eli5Toggle} ${eli5Mode
                        ? styles.eli5ToggleActive
                        : ''
                      }`}
                    title="Toggle simple ELI5 explanation"
                  >
                    <span>
                      {eli5Mode
                        ? '🧠'
                        : '👶'}
                    </span>

                    <span>
                      {eli5Mode
                        ? 'Normal View'
                        : 'ELI5 Mode'}
                    </span>
                  </button>
                </div>

                {eli5Mode && analysis.eli5 && (
                  <div className={styles.eli5Banner}>
                    <span className={styles.eli5BannerIcon}>💡</span>
                    <div>
                      <h4 className={styles.eli5BannerHeading}>ELI5: Intuitive Analogy</h4>
                      <p className={styles.eli5BannerText}>{analysis.eli5}</p>
                    </div>
                  </div>
                )}

                <div className={styles.summaryList}>
                  {(() => {
                    const rawList = (eli5Mode && analysis.eli5Summary)
                      ? analysis.eli5Summary
                      : analysis.summary;

                    const list = (rawList && rawList.length > 0) ? rawList : [
                      { emoji: '📌', heading: `Introduction to ${topicTitle}`, detail: `Fundamental principles, architecture, and core objectives of ${topicTitle}.` },
                      { emoji: '🔑', heading: 'Core Concepts & Logic', detail: `Key structural mechanics and design guidelines explained in the lesson.` },
                      { emoji: '💡', heading: 'Practical Application', detail: `Real-world examples, patterns, and implementation strategies.` },
                    ];

                    return list.map((point: any, i: number) => {
                      const emoji = typeof point === 'object' ? (point.emoji || '📌') : '📌';
                      const heading = typeof point === 'object' ? (point.heading || point.title || `Concept ${i + 1}`) : `Key Point ${i + 1}`;
                      const detail = typeof point === 'object' ? (point.detail || point.description || point.text || '') : String(point);

                      return (
                        <article
                          key={i}
                          className={`${styles.summaryItem} ${eli5Mode ? styles.summaryItemEli5 : ''}`}
                        >
                          <span className={styles.summaryIcon}>
                            {emoji}
                          </span>

                          <div>
                            <h3 className={styles.summaryHeading}>
                              {heading}
                            </h3>

                            <p className={styles.summaryDetail}>
                              {detail}
                            </p>
                          </div>
                        </article>
                      );
                    });
                  })()}
                </div>
              </section>
            )}


            {/* ============================================================ */}
            {/* MINDMAP                                                       */}
            {/* ============================================================ */}

            {activeTab === 'mindmap' && (
              <section
                className={
                  styles.visualSection
                }
              >
                <VideoMindmapRenderer
                  data={analysis.mindmap}
                  title={topicTitle}
                  onNodeClick={(slug) => {
                    const transcriptList = Array.isArray(analysis.transcript) ? analysis.transcript : [];
                    const chunk = transcriptList.find(
                      (t) =>
                        t.conceptTags?.some(
                          (tag) =>
                            slug.toLowerCase().includes(
                              tag.toLowerCase().replace(/\s+/g, '-')
                            ) ||
                            tag.toLowerCase().includes(slug.toLowerCase())
                        )
                    );

                    if (chunk && typeof chunk.startTime === 'number') {
                      onSeekVideo?.(chunk.startTime);
                      return;
                    }

                    // Fallback to chapter match
                    const matchedChapter = (analysis.chapters || []).find((ch: any) =>
                      ch.title?.toLowerCase().includes(slug.toLowerCase()) ||
                      slug.toLowerCase().includes(ch.title?.toLowerCase().slice(0, 10))
                    );
                    if (matchedChapter) {
                      const sec = matchedChapter.seconds ?? matchedChapter.startTime ?? 0;
                      onSeekVideo?.(sec);
                    }
                  }}
                />
              </section>
            )}

            {/* ============================================================ */}
            {/* FLOWCHART                                                     */}
            {/* ============================================================ */}

            {activeTab === 'flowchart' && (
              <section
                className={
                  styles.visualSection
                }
              >
                <FlowchartRenderer
                  data={analysis.flowchart}
                  title={topicTitle}
                />
              </section>
            )}

            {/* ============================================================ */}
            {/* QUIZ                                                          */}
            {/* ============================================================ */}

            {activeTab === 'quiz' && (
              <section
                className={styles.quizSection}
              >
                <div className={styles.sectionHeaderSimple}>
                  <span
                    className={
                      styles.sectionEyebrow
                    }
                  >
                    KNOWLEDGE CHECK
                  </span>

                  <p
                    className={
                      styles.sectionDescription
                    }
                  >
                    Test what you understood from
                    this lesson.
                  </p>
                </div>

                <MiniQuiz
                  questions={analysis.quiz}
                  topicSlug={topicSlug}
                />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}