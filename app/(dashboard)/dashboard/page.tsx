'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Loader,
  BookOpen,
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCw,
  BarChart2,
  MessageSquare,
  ArrowRight,
  Layers3,
} from 'lucide-react';

import { useLearningStore } from '@/store/use-learning-store';
import { generateCourseAction } from '@/actions/ai-generation';
import { MindmapRenderer } from '@/components/features/topic/MindmapRenderer';
import { VideoChatbot } from '@/components/features/video/VideoChatbot';
import { FloatingChatbot } from '@/components/features/video/FloatingChatbot';
import { ROUTES } from '@/constants/routes';

import styles from './dashboard-page.module.css';

export default function DashboardPage() {
  const router = useRouter();

  const {
    courses,
    activeCourseId,
    progress,
    addCourse,
    clearAll,
    setActiveTopic,
  } = useLearningStore();

  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);

  const activeCourse =
    courses.find((course) => course.id === activeCourseId) || null;

  /* ─────────────────────────────────────────
     COURSE GENERATION
  ───────────────────────────────────────── */

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!topic.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const course = await generateCourseAction(topic.trim());

      addCourse(course);
      setTopic('');
    } catch (err: any) {
      setError(err?.message || 'Failed to curate syllabus.');
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────────
     COURSE PROGRESS
  ───────────────────────────────────────── */

  const getCourseProgress = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);

    if (!course) return 0;

    let totalTopics = 0;
    let completedTopics = 0;

    course.chapters.forEach((chapter) => {
      chapter.topics.forEach((topic) => {
        totalTopics++;

        const key = `${courseId}:${topic.slug}`;

        if (progress[key]?.completed) {
          completedTopics++;
        }
      });
    });

    return totalTopics > 0
      ? Math.round((completedTopics / totalTopics) * 100)
      : 0;
  };

  /* ─────────────────────────────────────────
     TOPIC STATE
  ───────────────────────────────────────── */

  const getTopicState = (topicSlug: string) => {
    const key = `${activeCourseId}:${topicSlug}`;

    return progress[key] || {
      completed: false,
      quizScore: -1,
    };
  };

  /* ─────────────────────────────────────────
     TOPIC NAVIGATION
  ───────────────────────────────────────── */

  const handleNodeClick = (slug: string) => {
    setActiveTopic(slug);
    router.push(ROUTES.topic(slug));
  };

  /* ─────────────────────────────────────────
     GLOBAL COUNTS
  ───────────────────────────────────────── */

  const lessonCount = activeCourse
    ? activeCourse.chapters.reduce(
      (total, chapter) => total + chapter.topics.length,
      0
    )
    : 0;

  const completedCount = activeCourse
    ? activeCourse.chapters.reduce((total, chapter) => {
      return (
        total +
        chapter.topics.filter(
          (topic) => getTopicState(topic.slug).completed
        ).length
      );
    }, 0)
    : 0;

  const quizCount = activeCourse
    ? activeCourse.chapters.reduce((total, chapter) => {
      return (
        total +
        chapter.topics.filter(
          (topic) => getTopicState(topic.slug).quizScore >= 0
        ).length
      );
    }, 0)
    : 0;

  const progressPercentage = activeCourse
    ? getCourseProgress(activeCourse.id)
    : 0;

  /* ─────────────────────────────────────────
     EMPTY STATE
  ───────────────────────────────────────── */

  if (!activeCourse) {
    return (
      <div className={styles.page}>
        <header className={styles.topbar}>
          <div>
            <div className={styles.eyebrow}>Course Curator</div>
            <h1 className={styles.pageTitle}>Your learning workspace</h1>
          </div>
        </header>

        <main className={styles.emptyState}>
          <div className={styles.emptyInner}>
            <div className={styles.emptyIcon}>
              <Sparkles size={22} strokeWidth={1.8} />
            </div>

            <div className={styles.emptyCopy}>
              <div className={styles.eyebrow}>Start a new course</div>

              <h2>What do you want to learn?</h2>

              <p>
                Enter a subject and Course Curator will build a structured
                learning path with lessons, visual maps, videos and quizzes.
              </p>
            </div>

            <form
              className={styles.generateForm}
              onSubmit={handleGenerate}
            >
              <input
                type="text"
                placeholder="Try Machine Learning, React, Python..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                autoFocus
              />

              <button
                type="submit"
                disabled={loading || !topic.trim()}
              >
                {loading ? (
                  <>
                    <Loader
                      size={16}
                      className={styles.spinner}
                    />
                    Building...
                  </>
                ) : (
                  <>
                    Generate course
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className={styles.errorMessage}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.emptyFeatures}>
              <span>
                <Layers3 size={14} />
                Structured syllabus
              </span>

              <span>
                <BookOpen size={14} />
                Video lessons
              </span>

              <span>
                <BarChart2 size={14} />
                Adaptive quizzes
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ─────────────────────────────────────────
     DASHBOARD
  ───────────────────────────────────────── */

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.topbar}>
        <div className={styles.headingBlock}>
          <div className={styles.eyebrow}>Current course</div>

          <h1 className={styles.pageTitle}>
            {activeCourse.title}
          </h1>

          <p className={styles.pageSubtitle}>
            Continue where you left off or explore another topic.
          </p>
        </div>

        <button
          className={styles.resetButton}
          onClick={clearAll}
        >
          <RefreshCw size={14} />
          Reset course
        </button>
      </header>

      {/* Main dashboard */}
      <main className={styles.dashboard}>
        {/* Stats */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span>Progress</span>
              <BarChart2 size={16} />
            </div>

            <div className={styles.statValue}>
              {progressPercentage}%
            </div>

            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>

            <div className={styles.statMeta}>
              {completedCount} of {lessonCount} lessons completed
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span>Lessons</span>
              <BookOpen size={16} />
            </div>

            <div className={styles.statValue}>
              {lessonCount}
            </div>

            <div className={styles.statMeta}>
              Across {activeCourse.chapters.length} chapters
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span>Quizzes attempted</span>
              <CheckCircle2 size={16} />
            </div>

            <div className={styles.statValue}>
              {quizCount}
            </div>

            <div className={styles.statMeta}>
              Keep testing your understanding
            </div>
          </div>
        </section>

        {/* Main workspace */}
        <section className={styles.workspace}>
          {/* Course map */}
          <div className={styles.mapPanel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelKicker}>Visual roadmap</div>

                <h2 className={styles.panelTitle}>
                  Course map
                </h2>
              </div>

              <div className={styles.panelHint}>
                Select a topic to start learning
              </div>
            </div>

            <div className={styles.mapContent}>
              <MindmapRenderer
                course={activeCourse}
                activeTopicSlug={null}
                onNodeClick={handleNodeClick}
              />
            </div>

            {/* Quick generate */}
            <div className={styles.quickGenerate}>
              <div className={styles.quickGenerateLabel}>
                <Sparkles size={15} />
                <span>Curate another course</span>
              </div>

              <form
                className={styles.quickForm}
                onSubmit={handleGenerate}
              >
                <input
                  type="text"
                  placeholder="e.g. Deep Learning"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                />

                <button
                  type="submit"
                  disabled={loading || !topic.trim()}
                >
                  {loading ? (
                    <Loader
                      size={15}
                      className={styles.spinner}
                    />
                  ) : (
                    <>
                      Generate
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right panel */}
          <aside className={styles.sidePanel}>
            <div className={styles.sidePanelTabs}>
              <button
                className={`${styles.sideTab} ${!showChatbot ? styles.sideTabActive : ''
                  }`}
                onClick={() => setShowChatbot(false)}
              >
                <BookOpen size={14} />
                Outline
              </button>

              <button
                className={`${styles.sideTab} ${showChatbot ? styles.sideTabActive : ''
                  }`}
                onClick={() => setShowChatbot(true)}
              >
                <MessageSquare size={14} />
                Assistant
              </button>
            </div>

            {showChatbot ? (
              <div className={styles.chatContainer}>
                <VideoChatbot
                  videoId={
                    activeCourse.chapters[0]?.topics[0]?.videoId || ''
                  }
                  videoTitle={activeCourse.title}
                  isOpen={showChatbot}
                />
              </div>
            ) : (
              <div className={styles.outline}>
                <div className={styles.outlineHeader}>
                  <div>
                    <div className={styles.panelKicker}>
                      Syllabus
                    </div>

                    <h2 className={styles.outlineTitle}>
                      Course outline
                    </h2>
                  </div>

                  <span className={styles.lessonBadge}>
                    {lessonCount} lessons
                  </span>
                </div>

                <div className={styles.chapterList}>
                  {activeCourse.chapters.map(
                    (chapter, chapterIndex) => (
                      <section
                        key={chapter.id}
                        className={styles.chapter}
                      >
                        <div className={styles.chapterHeading}>
                          <span className={styles.chapterNumber}>
                            {String(chapterIndex + 1).padStart(2, '0')}
                          </span>

                          <h3>{chapter.title}</h3>
                        </div>

                        <div className={styles.topicList}>
                          {chapter.topics.map((topic) => {
                            const state = getTopicState(
                              topic.slug
                            );

                            return (
                              <button
                                key={topic.slug}
                                className={styles.topicItem}
                                onClick={() =>
                                  handleNodeClick(topic.slug)
                                }
                              >
                                <div className={styles.topicMain}>
                                  {state.completed ? (
                                    <CheckCircle2
                                      size={15}
                                      className={
                                        styles.completedIcon
                                      }
                                    />
                                  ) : (
                                    <Circle
                                      size={15}
                                      className={
                                        styles.incompleteIcon
                                      }
                                    />
                                  )}

                                  <span
                                    className={
                                      state.completed
                                        ? styles.topicCompleted
                                        : ''
                                    }
                                  >
                                    {topic.title}
                                  </span>
                                </div>

                                {state.quizScore >= 0 && (
                                  <span
                                    className={
                                      styles.quizScore
                                    }
                                  >
                                    {state.quizScore}%
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    )
                  )}
                </div>
              </div>
            )}
          </aside>
        </section>
      </main>

      {/* Floating chatbot */}
      {activeCourse.chapters[0]?.topics[0]?.videoId && (
        <FloatingChatbot
          videoId={
            activeCourse.chapters[0].topics[0].videoId
          }
          videoTitle={activeCourse.title}
        />
      )}
    </div>
  );
}